import { useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import type { Certification, CertificateCategory } from '../types/certification';
import { CopyIcon, RotateCwIcon, FilterIcon, TeamIcon } from '../services/svgIcons';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import {
  getTeamByCode,
  fetchAppUser,
  fetchUsersByUids,
  fetchCertificatesForOwner,
  updateTeamCode,
  removeTeamMember,
} from '../services/authService';
import { TeamSetupCard } from '../components/TeamSetupCard';
import '../styles/components/AccountSetupFlow.css';

interface TeamManagementProps {
  appUser: AppUser;
  onAppUserUpdate?: (user: AppUser) => void;
}

type Tier = 'red' | 'yellow' | 'green';

const TRACKED_CATEGORIES: CertificateCategory[] = ['ARRT', 'IEMA'];
// Match Dashboard.tsx (IEMA_TOTAL = 48): combined non-expired CE credits across
// IEMA + ARRT certs, divided by the combined 2-license requirement.
const OVERALL_CREDITS_TOTAL = 48;

const DOT_COLOR: Record<Tier, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
};

const BAR_FILL_COLOR: Record<Tier, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
};

const TEXT_COLOR: Record<Tier, string> = {
  red: 'text-red-600 dark:text-red-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  green: 'text-emerald-600 dark:text-emerald-400',
};

const STATUS_LABEL: Record<Tier, string> = {
  red: 'Action needed',
  yellow: 'Expiring soon',
  green: 'Licensed',
};

const RANK: Record<Tier, number> = { red: 0, yellow: 1, green: 2 };

interface LicenseSummary {
  category: CertificateCategory;
  earliestExpiry: string | null;
  credits: number;
  licenseNumber: string | null;
}

interface TeamMemberSummary {
  uid: string;
  user: AppUser;
  isLead: boolean;
  licenses: LicenseSummary[];
  /** Sum of CE credits from non-expired IEMA|ARRT certs (matches Dashboard). */
  overallCredits: number;
}

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + 'T00:00:00');
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
}

function tierFromDate(dateString: string | null): Tier {
  if (!dateString) return 'red';
  const days = daysUntil(dateString);
  if (days < 30) return 'red';
  if (days < 90) return 'yellow';
  return 'green';
}

function worstTier(a: Tier, b: Tier): Tier {
  return RANK[a] < RANK[b] ? a : b;
}

function overallTier(summary: TeamMemberSummary): Tier {
  return summary.licenses.reduce<Tier>(
    (acc, lic) => worstTier(acc, tierFromDate(lic.earliestExpiry)),
    'green',
  );
}

function soonestExpiry(summary: TeamMemberSummary): string | null {
  const dates = summary.licenses
    .map((l) => l.earliestExpiry)
    .filter((d): d is string => !!d);
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a <= b ? a : b));
}

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


const displayName = (user: AppUser): string => {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.username || user.email || 'Unknown member';
};

const licenseNumberFor = (
  user: AppUser,
  category: CertificateCategory,
): string | null => {
  if (category === 'ARRT') return user.arrtLicenseNumber?.trim() || null;
  if (category === 'IEMA') return user.iemaLicenseNumber?.trim() || null;
  return null;
};

const generateTeamId = (existingIds: Set<string>): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let id: string;
  do {
    id =
      letters[Math.floor(Math.random() * 26)] +
      letters[Math.floor(Math.random() * 26)] +
      Array.from({ length: 5 }, () => digits[Math.floor(Math.random() * 10)]).join('');
  } while (existingIds.has(id));
  return id;
};

function darkenHex(hex: string, amount = 0.4): string {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount));
  const b = Math.round((num & 0xff) * (1 - amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function summarizeMember(
  user: AppUser,
  certs: Certification[],
  isLead: boolean,
): TeamMemberSummary {
  const licenses: LicenseSummary[] = TRACKED_CATEGORIES.map((category) => {
    const active = certs.filter(
      (c) => c.categories.includes(category) && daysUntil(c.expirationDate) >= 0,
    );
    const earliestExpiry =
      active.length === 0
        ? null
        : active
            .map((c) => c.expirationDate)
            .reduce((a, b) => (a <= b ? a : b));
    const credits = active.reduce((s, c) => s + (c.ceCredits ?? 0), 0);
    return {
      category,
      earliestExpiry,
      credits,
      licenseNumber: licenseNumberFor(user, category),
    };
  });
  const overallCredits = certs
    .filter(
      (c) =>
        (c.categories.includes('IEMA') || c.categories.includes('ARRT')) &&
        daysUntil(c.expirationDate) >= 0,
    )
    .reduce((sum, c) => sum + (c.ceCredits ?? 0), 0);
  return { uid: user.uid, user, isLead, licenses, overallCredits };
}

interface OverallProgressBarProps {
  credits: number;
  tier: Tier;
}

function OverallProgressBar({ credits, tier }: OverallProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (credits / OVERALL_CREDITS_TOTAL) * 100));
  const creditsRounded = Math.round(credits);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_FILL_COLOR[tier]}`}
          style={{ width: `${pct}%`, transition: 'width 0.4s ease-out' }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-gray-600 dark:text-slate-300 shrink-0 w-14 text-right">
        {creditsRounded}/{OVERALL_CREDITS_TOTAL} CE
      </span>
    </div>
  );
}

interface LicenseDetailRowProps {
  license: LicenseSummary;
}

function LicenseDetailRow({ license }: LicenseDetailRowProps) {
  const tier = tierFromDate(license.earliestExpiry);
  return (
    <div className="py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[tier]}`} />
        <span className="text-sm font-bold text-primary dark:text-slate-100 w-16 shrink-0">
          {license.category}
        </span>
        <span className={`text-sm font-semibold ml-auto ${TEXT_COLOR[tier]}`}>
          {license.earliestExpiry ? formatDate(license.earliestExpiry) : 'No cert on file'}
        </span>
      </div>
      {license.licenseNumber && (
        <p className="mt-1 pl-[1.625rem] text-[11px] text-gray-500 dark:text-slate-400">
          License #{' '}
          <span className="font-mono font-semibold text-gray-700 dark:text-slate-200">
            {license.licenseNumber}
          </span>
        </p>
      )}
    </div>
  );
}

const CE_TOTAL_PER_LICENSE = 24;

interface EmployeeModalProps {
  summary: TeamMemberSummary;
  teamCode: string;
  onClose: () => void;
  onRemoved: (uid: string) => void;
}

function EmployeeModal({ summary, teamCode, onClose, onRemoved }: EmployeeModalProps) {
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const overall = overallTier(summary);
  const { user } = summary;

  const handleRemove = async () => {
    setRemoveError(null);
    setRemoving(true);
    try {
      await removeTeamMember(teamCode, summary.uid);
      setRemoved(true);
      onRemoved(summary.uid);
      setTimeout(onClose, 1500);
    } catch {
      setRemoveError('Failed to remove member. Please try again.');
      setRemoving(false);
    }
  };

  const arrtLic = summary.licenses.find((l) => l.category === 'ARRT');
  const iemaLic = summary.licenses.find((l) => l.category === 'IEMA');

  const hasArrtId = !!user.arrtIdNumber?.trim();
  const hasIemaId = !!user.iemaIdNumber?.trim();

  return (
    <div className="overlay-center" onClick={onClose}>
      <div
        className="overlay-panel overlay-panel--sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-primary dark:text-slate-100 tracking-tight">
                {displayName(user)}
              </h3>
              <span
                className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${TEXT_COLOR[overall]}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
              >
                <span className={`w-2 h-2 rounded-full ${DOT_COLOR[overall]}`} />
                {STATUS_LABEL[overall]}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 min-h-[1.25rem]">
              {summary.isLead && <span className="font-semibold">Team lead</span>}
              {summary.isLead && (hasArrtId || hasIemaId) && ' · '}
              {hasArrtId && <span className="font-mono">ARRT {user.arrtIdNumber}</span>}
              {hasArrtId && hasIemaId && ' · '}
              {hasIemaId && <span className="font-mono">IEMA {user.iemaIdNumber}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer shrink-0 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            CE progress
          </p>
          {arrtLic && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 w-10 shrink-0">ARRT</span>
              <div className="flex-1 min-w-0 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_FILL_COLOR[tierFromDate(arrtLic.earliestExpiry)]}`}
                  style={{ width: `${Math.max(0, Math.min(100, (arrtLic.credits / CE_TOTAL_PER_LICENSE) * 100))}%`, transition: 'width 0.4s ease-out' }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-gray-600 dark:text-slate-300 shrink-0 w-14 text-right">
                {Math.round(arrtLic.credits)}/{CE_TOTAL_PER_LICENSE} CE
              </span>
            </div>
          )}
          {iemaLic && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 w-10 shrink-0">IEMA</span>
              <div className="flex-1 min-w-0 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_FILL_COLOR[tierFromDate(iemaLic.earliestExpiry)]}`}
                  style={{ width: `${Math.max(0, Math.min(100, (iemaLic.credits / CE_TOTAL_PER_LICENSE) * 100))}%`, transition: 'width 0.4s ease-out' }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-gray-600 dark:text-slate-300 shrink-0 w-14 text-right">
                {Math.round(iemaLic.credits)}/{CE_TOTAL_PER_LICENSE} CE
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-2">
            Licenses
          </p>
          <div>
            {summary.licenses.map((lic) => (
              <LicenseDetailRow key={lic.category} license={lic} />
            ))}
          </div>
        </div>

        {removeError && (
          <p className="text-xs text-red-500 mt-4">{removeError}</p>
        )}

        <span className="block text-xs text-gray-600 dark:text-slate-300 min-h-[1rem]">
          {!summary.isLead && confirmRemove &&
            `Are you sure you want to remove ${displayName(user)} from the team?`}
        </span>
        

        {!summary.isLead && (
          <div className="mt-6">
            {removed ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {displayName(user)} has been removed from the team.
              </p>
            ) : confirmRemove ? (
              <div className="flex flex-col gap-2">
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={removing}
                    onClick={handleRemove}
                    className="global-btn red-btn w-auto px-3 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {removing ? 'Removing…' : 'Yes, remove'}
                  </button>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => setConfirmRemove(false)}
                    className="global-btn cancel-btn w-auto px-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="global-btn w-auto px-4 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove from team
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmployeeRowProps {
  summary: TeamMemberSummary;
  onClick: () => void;
}

function EmployeeRow({ summary, onClick }: EmployeeRowProps) {
  const tier = overallTier(summary);
  const next = soonestExpiry(summary);
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer w-full flex flex-col gap-2 px-4 py-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full shrink-0 ${DOT_COLOR[tier]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary dark:text-slate-100 truncate flex items-center gap-2 flex-wrap">
            <span>{displayName(summary.user)}</span>
            {summary.user.arrtIdNumber && (
              <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 font-mono">
                ARRT {summary.user.arrtIdNumber}
              </span>
            )}
            {summary.user.iemaIdNumber && (
              <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 font-mono">
                IEMA {summary.user.iemaIdNumber}
              </span>
            )}
            {summary.isLead && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Lead
              </span>
            )}
          </p>
          <p className={`text-[11px] font-semibold ${TEXT_COLOR[tier]}`}>
            {STATUS_LABEL[tier]}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Next expiry
          </p>
          <p className={`text-sm font-semibold ${TEXT_COLOR[tier]}`}>
            {next ? formatDate(next) : '—'}
          </p>
        </div>
      </div>
      <div className="pl-6">
        <OverallProgressBar credits={summary.overallCredits} tier={tier} />
      </div>
    </button>
  );
}

const TeamManagement = ({ appUser, onAppUserUpdate }: TeamManagementProps) => {
  const isManager = appUser.role === 'manager';

  const [team, setTeam] = useState<Team | null>(null);
  const [teamCode, setTeamCode] = useState(appUser.teamCode ?? '');
  const [leadName, setLeadName] = useState('');
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerateSpin, setRegenerateSpin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TeamMemberSummary | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Tier>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!appUser.teamCode) {
        if (!cancelled) {
          setTeam(null);
          setMembers([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const t = await getTeamByCode(appUser.teamCode);
      if (cancelled) return;
      if (!t) {
        setLoading(false);
        return;
      }
      setTeam(t);
      setTeamCode(t.id);

      const memberUids = Array.from(new Set([t.teamLead, ...t.members]));
      const [users, lead] = await Promise.all([
        fetchUsersByUids(memberUids),
        fetchAppUser(t.teamLead),
      ]);
      if (cancelled) return;
      if (lead) {
        setLeadName(
          lead.firstName && lead.lastName
            ? `${lead.firstName} ${lead.lastName}`
            : lead.username,
        );
      }

      // Only the team lead is authorized to read teammates' certificates.
      // Members viewing this page don't load others' certs.
      const canLoadCerts = appUser.uid === t.teamLead;
      const certLists = canLoadCerts
        ? await Promise.all(users.map((u) => fetchCertificatesForOwner(u.uid)))
        : users.map(() => [] as Certification[]);
      if (cancelled) return;

      const summaries = users.map((u, i) =>
        summarizeMember(u, certLists[i], u.uid === t.teamLead),
      );
      setMembers(summaries);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser.teamCode, appUser.uid]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const ea = soonestExpiry(a);
      const eb = soonestExpiry(b);
      if (ea && eb) return ea.localeCompare(eb);
      if (ea) return -1;
      if (eb) return 1;
      return displayName(a.user).localeCompare(displayName(b.user));
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedMembers.filter((m) => {
      if (q && !displayName(m.user).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && overallTier(m) !== statusFilter) return false;
      return true;
    });
  }, [sortedMembers, search, statusFilter]);

  const complianceCounts = useMemo(() => {
    let compliant = 0;
    let nonCompliant = 0;
    for (const m of members) {
      if (overallTier(m) === 'red') nonCompliant += 1;
      else compliant += 1;
    }
    return { compliant, nonCompliant };
  }, [members]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const handleRegenerate = async () => {
    if (!team) return;
    setRegenerateError(null);
    const newCode = generateTeamId(new Set([teamCode]));
    setRegenerating(true);
    setRegenerateSpin(true);
    try {
      const updatedTeam = await updateTeamCode(teamCode, newCode, appUser.uid);
      setTeam(updatedTeam);
      setTeamCode(newCode);
    } catch {
      setRegenerateError('Failed to regenerate team code. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const hasNoTeam = !appUser.teamCode;

  // No-team state: show the setup card with its own header (no breadcrumb since there's no team to crumb to)
  if (hasNoTeam) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="You're not part of a team yet. Join one with a code, or create your own."
        />
        <TeamSetupCard
          appUser={appUser}
          onJoined={(updated) => onAppUserUpdate?.(updated)}
        />
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <Breadcrumb items={[{ name: 'Team', to: '' }]} />
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="Loading…"
        />
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-500 dark:text-slate-400">Loading team…</p>
        </div>
      </main>
    );
  }

  // Team code exists but team couldn't be found
  if (!team) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <Breadcrumb items={[{ name: 'Team', to: '' }]} />
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="We couldn't load your team."
        />
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-700 dark:text-slate-200">
            We couldn't find the team for code{' '}
            <span className="font-mono">{appUser.teamCode}</span>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: team.name, to: '' }]} />

      <PageHeader
        icon={<TeamIcon size={22} />}
        title={team.name}
        subtitle={
          isManager
            ? 'Invite teammates and review their certification progress.'
            : 'View and manage your team members.'
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500 dark:text-slate-400">
          {leadName && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold"
              style={
                team.color
                  ? { backgroundColor: `${team.color}22`, color: darkenHex(team.color) }
                  : undefined
              }
            >
              Led by {leadName}
            </span>
          )}
          {leadName && <span className="text-gray-300 dark:text-slate-600">·</span>}
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
              Team code
            </span>
            <span
              className="font-mono font-semibold tracking-widest"
              style={team.color ? { color: darkenHex(team.color) } : undefined}
            >
              {teamCode}
            </span>
            <button
              type="button"
              title={codeCopied ? 'Copied!' : 'Copy team code'}
              onClick={handleCopy}
              className="cursor-pointer text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
            >
              <CopyIcon size={14} />
            </button>
            {isManager && (
              <button
                type="button"
                title="Regenerate team code"
                disabled={regenerating}
                onClick={handleRegenerate}
                onAnimationEnd={() => setRegenerateSpin(false)}
                className="cursor-pointer text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
              >
                <RotateCwIcon
                  size={14}
                  className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''}
                />
              </button>
            )}
          </span>
          {isManager && <span className="text-gray-300 dark:text-slate-600">·</span>}
          {isManager && (
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Filter members"
              aria-expanded={filterOpen}
              className={
                'sm:ml-auto w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
                (filterOpen || activeFilterCount > 0
                  ? 'border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]')
              }
            >
              <FilterIcon size={14} />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[#7C49D5] dark:bg-[#A876FF] text-white text-[10px] tabular-nums leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
        {regenerateError && (
          <p className="text-xs text-red-500 mt-1">{regenerateError}</p>
        )}
      </div>

      {isManager && filterOpen && (
        <div className="mb-6">
          <div className="rounded-2xl glass-panel p-4 w-full">
            <div className="flex flex-col gap-3">
              <div className="form-field">
                <label className="form-label">Search by name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Member name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'red', 'yellow', 'green'] as const).map((s) => {
                    const active = statusFilter === s;
                    const label = s === 'all' ? 'All' : STATUS_LABEL[s as Tier];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={
                          'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ' +
                          (active
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600')
                        }
                      >
                        {s !== 'all' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s as Tier]}`} />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="card card--md card--glass">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-primary dark:text-slate-100">
              Team members
            </h2>
            {isManager && (
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                Sorted by soonest upcoming expiry
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {isManager && (
              <>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR.green}`} />
                  {complianceCounts.compliant} compliant
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR.red}`} />
                  {complianceCounts.nonCompliant} non-compliant
                </span>
                <span className="text-gray-300 dark:text-slate-600">·</span>
              </>
            )}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
              {isManager
                ? `${filteredMembers.length}${filteredMembers.length !== sortedMembers.length ? `/${sortedMembers.length}` : ''} members`
                : `${sortedMembers.length} members`}
            </p>
          </div>
        </div>

        {isManager ? (
          filteredMembers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">
              {sortedMembers.length === 0
                ? 'No teammates yet. Share your team code to invite members.'
                : 'No members match these filters.'}
            </p>
          ) : (
            <ul className="flex flex-col">
              {filteredMembers.map((m) => (
                <li key={m.uid}>
                  <EmployeeRow summary={m} onClick={() => setSelected(m)} />
                </li>
              ))}
            </ul>
          )
        ) : (
          sortedMembers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">
              No teammates yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700">
              {sortedMembers.map((m) => (
                <li key={m.uid} className="flex items-center gap-3 px-4 py-3">
                  <p className="text-sm font-semibold text-primary dark:text-slate-100">
                    {displayName(m.user)}
                    {m.isLead && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        Lead
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {isManager && selected && (
        <EmployeeModal
          summary={selected}
          teamCode={teamCode}
          onClose={() => setSelected(null)}
          onRemoved={(uid) => setMembers((prev) => prev.filter((m) => m.uid !== uid))}
        />
      )}
    </main>
  );
};

export default TeamManagement;
