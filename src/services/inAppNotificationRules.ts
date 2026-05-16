import type { Certification } from '../types/certification';
import type { AppUser } from '../types/auth';
import type { InAppNotification } from '../types/notifications';

/** Per license_ce_logic.md — CE credits required each biennial cycle */
export const CE_CREDITS_REQUIRED_PER_LICENSE = 24;

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
}

function formatShort(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function activeCreditsFor(certs: Certification[], cat: 'IEMA' | 'ARRT'): number {
  return certs
    .filter((c) => c.categories.includes(cat) && daysUntil(c.expirationDate) >= 0)
    .reduce((s, c) => s + c.ceCredits, 0);
}

function earliestLiveCertFor(certs: Certification[], cat: 'IEMA' | 'ARRT'): Certification | null {
  const list = certs.filter((c) => c.categories.includes(cat) && daysUntil(c.expirationDate) >= 0);
  if (list.length === 0) return null;
  return [...list].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))[0] ?? null;
}

function displayUserName(u: AppUser): string {
  if (u.firstName?.trim() && u.lastName?.trim()) return `${u.firstName.trim()} ${u.lastName.trim()}`;
  return u.username;
}

type CeUrgencyTier = 1 | 2 | 3;

function ceUrgencyTier(days: number, remaining: number): CeUrgencyTier | null {
  if (remaining <= 0 || days < 0) return null;
  if (days < 30 && remaining < 5) return 3;
  if (days < 60 && remaining > 5) return 2;
  if (days < 90 && remaining > 10) return 1;
  return null;
}

function certHeadline(cert: Certification): string {
  const name = cert.certificateName.trim() || 'Untitled certificate';
  return `"${name}" expires ${formatShort(cert.expirationDate)}`;
}

function pushCeUrgency(
  out: InAppNotification[],
  license: 'IEMA' | 'ARRT',
  days: number,
  remaining: number,
  anchorCert: Certification,
): void {
  const tier = ceUrgencyTier(days, remaining);
  if (tier == null) return;

  const renewalDate = anchorCert.expirationDate;
  const scope = license;
  let title: string;
  let body: string;
  let severity: InAppNotification['severity'] = 'warning';

  const head = certHeadline(anchorCert);

  if (tier === 1) {
    title = `${license}: CE deadline in ${days} days`;
    body = `${head}. You still need more than 10 CE credits (${Math.ceil(remaining)} remaining) before then. Category A or A+ only.`;
    severity = 'warning';
  } else if (tier === 2) {
    title = `${license}: CE deadline approaching`;
    body = `${head}. Within 60 days of that date you still need over 5 CE credits (${Math.ceil(remaining)} left).`;
    severity = 'warning';
  } else {
    title = `${license}: Finish CE credits soon`;
    body = `${head} — under 30 days away. Fewer than 5 CE credits left (${Math.ceil(remaining)} remaining). Wrap up accredited courses now.`;
    severity = 'urgent';
  }

  out.push({
    id: `ce-urgency-${license}-tier${tier}-${renewalDate}`,
    title,
    body,
    severity,
    scope,
    href: '/credentials',
  });
}

function pushCyclePair(
  out: InAppNotification[],
  license: 'IEMA' | 'ARRT',
  days: number,
  anchorCert: Certification,
): void {
  if (days <= 0 || days > 90) return;
  const renewalDate = anchorCert.expirationDate;
  const scope = license;
  const head = certHeadline(anchorCert);
  out.push({
    id: `cycle-apply-${license}-${renewalDate}`,
    title: `${license}: cycle ending — apply certificates`,
    body: `${head} (${days} days). Apply qualifying Category A/A+ certificates to this cycle before it ends — each certificate applies once per license (${license}).`,
    severity: days <= 45 ? 'warning' : 'info',
    scope,
    href: '/certificates/new',
  });
  const otherLicense = license === 'IEMA' ? 'ARRT' : 'IEMA';
  out.push({
    id: `cycle-exams-${license}-${renewalDate}`,
    title: `${license}: plan CE for the next cycle`,
    body: `A new biennial CE cycle follows this reporting period. Related timing: ${head}. Schedule exams or coursework early — ${license} and ${otherLicense} treat CE earned in the last month of a cycle differently (check each registry's rules).`,
    severity: 'info',
    scope,
    href: '/credentials',
  });
}

export interface BuildInAppNotificationsParams {
  certifications: Certification[];
  appUser: AppUser;
  /** Manager's team members (Firestore profiles); excludes notifications for self */
  teamMemberProfiles?: AppUser[];
  /** New member uids detected via team snapshot (session); paired with display names */
  recentTeamJoins?: { uid: string; displayName: string }[];
}

export function buildInAppNotifications(params: BuildInAppNotificationsParams): InAppNotification[] {
  const { certifications, appUser, teamMemberProfiles = [], recentTeamJoins = [] } = params;
  const out: InAppNotification[] = [];

  const licenses = ['IEMA', 'ARRT'] as const;
  for (const license of licenses) {
    const earliest = earliestLiveCertFor(certifications, license);
    if (!earliest) continue;

    const days = daysUntil(earliest.expirationDate);
    const remaining = Math.max(0, CE_CREDITS_REQUIRED_PER_LICENSE - activeCreditsFor(certifications, license));

    pushCeUrgency(out, license, days, remaining, earliest);
    pushCyclePair(out, license, days, earliest);
  }

  const expired = certifications.filter((c) => daysUntil(c.expirationDate) < 0);
  if (expired.length >= 2) {
    const expiredKey = [...expired].map((c) => c.id).sort().join('|').slice(0, 96);
    out.push({
      id: `certs-expired-${expired.length}-${expiredKey}`,
      title: 'Multiple certificates expired',
      body: `${expired.length} uploaded certificates are past expiration. Replace or renew documentation so CE totals stay accurate.`,
      severity: 'urgent',
      href: '/credentials',
    });
  }

  if (appUser.role === 'manager' && teamMemberProfiles.length > 0) {
    for (const member of teamMemberProfiles) {
      if (member.uid === appUser.uid) continue;

      const end = member.ceProbationEndsAt?.trim();
      if (!end) continue;
      const d = daysUntil(end);
      if (d < 0) continue;

      out.push({
        id: `team-probation-${member.uid}-${end}`,
        title: 'Team member in CE probation',
        body: `${displayUserName(member)} is in a documented CE probation window until ${formatShort(end)}. Align staffing and CE completion with policy (confirm probation length with Michelle for your organization).`,
        severity: 'warning',
        scope: 'Team',
        href: '/team',
      });
    }
  }

  for (const join of recentTeamJoins) {
    if (join.uid === appUser.uid) continue;
    out.push({
      id: `team-join-${join.uid}`,
      title: 'Team member joined',
      body: `${join.displayName} joined your team.`,
      severity: 'info',
      scope: 'Team',
      href: '/team',
    });
  }

  const seen = new Set<string>();
  return out.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}
