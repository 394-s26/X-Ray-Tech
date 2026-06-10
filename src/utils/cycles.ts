import type { AppUser } from '../types/auth';
import type {
  AppliedCycles,
  Certification,
  CertificateCategory,
} from '../types/certification';

/** Per-license CE credit cap for a single 2-year cycle. */
export const PER_LICENSE = 24;

export interface CycleWindow {
  startISO: string;
  endISO: string;
  daysRemaining: number;
}

export interface ArrtCycleWindow extends CycleWindow {
  birthMonth: number;
  isOnProbation: boolean;
  probationEndsISO: string | null;
}

export interface CycleSummary extends CycleWindow {
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00');
  const to = new Date(toISO + 'T00:00:00');
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function todayISO(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return toISO(t);
}

export function isIemaSetup(u: AppUser): boolean {
  return u.iemaCycleStartYear != null && u.iemaCycleEndMonth != null;
}

export function isArrtSetup(u: AppUser): boolean {
  return u.arrtCycleStartYear != null && !!u.birthday;
}

// Used to hide past cycles that ended before the account existed — those
// cycles can never carry user data, so showing them as empty PAST cards is
// misleading on brand-new accounts.
function accountCreatedISO(u: AppUser): string | null {
  if (!u.accountCreatedDate) return null;
  return toISO(u.accountCreatedDate.toDate());
}

function iemaCycleStartingAt(month: number, startYear: number): CycleWindow {
  const start = new Date(startYear, month - 1, 1);
  const end = new Date(startYear + 2, month, 0); // day 0 of next month = last day of this month
  const startISO = toISO(start);
  const endISO = toISO(end);
  return {
    startISO,
    endISO,
    daysRemaining: daysBetween(todayISO(), endISO),
  };
}

function arrtCycleStartingAt(birthMonth: number, startYear: number): Omit<ArrtCycleWindow, 'isOnProbation' | 'probationEndsISO'> {
  const start = new Date(startYear, birthMonth - 1, 1);
  // End = last day of the month BEFORE birth month, 2 years later
  const end = new Date(startYear + 2, birthMonth - 1, 0);
  const startISO = toISO(start);
  const endISO = toISO(end);
  return {
    startISO,
    endISO,
    daysRemaining: daysBetween(todayISO(), endISO),
    birthMonth,
  };
}

/**
 * Walks from the user's anchor year (forward OR backward in 2-year steps) until the
 * resulting window contains today. Lets users enter a slightly off anchor (e.g. they
 * pick their next-birthday year while signing up mid-cycle) without breaking tracking.
 */
function rolledIemaStartYear(u: AppUser): number {
  let startYear = u.iemaCycleStartYear as number;
  const month = u.iemaCycleEndMonth as number;
  const today = todayISO();
  // Forward roll: today after cycle end
  for (let i = 0; i < 50; i++) {
    const cycle = iemaCycleStartingAt(month, startYear);
    if (today <= cycle.endISO) break;
    startYear += 2;
  }
  // Backward roll: today before cycle start (anchor sits in the future)
  for (let i = 0; i < 50; i++) {
    const cycle = iemaCycleStartingAt(month, startYear);
    if (today >= cycle.startISO) break;
    startYear -= 2;
  }
  return startYear;
}

function rolledArrtStartYear(u: AppUser, birthMonth: number): number {
  let startYear = u.arrtCycleStartYear as number;
  const today = todayISO();
  for (let i = 0; i < 50; i++) {
    const cycle = arrtCycleStartingAt(birthMonth, startYear);
    if (today <= cycle.endISO) break;
    startYear += 2;
  }
  for (let i = 0; i < 50; i++) {
    const cycle = arrtCycleStartingAt(birthMonth, startYear);
    if (today >= cycle.startISO) break;
    startYear -= 2;
  }
  return startYear;
}

export function computeIemaCycle(u: AppUser): CycleWindow | null {
  if (!isIemaSetup(u)) return null;
  const month = u.iemaCycleEndMonth as number;
  const startYear = rolledIemaStartYear(u);
  return iemaCycleStartingAt(month, startYear);
}

export function computeArrtCycle(u: AppUser): ArrtCycleWindow | null {
  if (!isArrtSetup(u)) return null;
  const birthMonth = Number((u.birthday as string).slice(0, 2));
  if (!Number.isFinite(birthMonth) || birthMonth < 1 || birthMonth > 12) return null;

  const startYear = rolledArrtStartYear(u, birthMonth);
  const base = arrtCycleStartingAt(birthMonth, startYear);

  const probationEndsISO = u.ceProbationEndsAt ?? null;
  const isOnProbation = !!probationEndsISO && probationEndsISO >= todayISO();

  return { ...base, isOnProbation, probationEndsISO };
}

/**
 * Returns IEMA cycles ordered oldest → newest:
 *   - All past cycles from the anchor (inclusive) up to (but excluding) the current cycle.
 *     If the anchor is the current cycle or in the future, the past list is empty
 *     (the anchor is a hard "don't show cycles before this" boundary).
 *   - The current cycle.
 *   - One future cycle (the next cycle after current).
 */
export function listIemaCycles(u: AppUser): CycleSummary[] {
  if (!isIemaSetup(u)) return [];
  const month = u.iemaCycleEndMonth as number;
  const anchorYear = u.iemaCycleStartYear as number;
  const currentYear = rolledIemaStartYear(u);
  const today = todayISO();
  const createdISO = accountCreatedISO(u);
  const out: CycleSummary[] = [];

  // Past cycles: anchor (inclusive) → currentYear (exclusive). Skipped if anchor >= current.
  for (let y = anchorYear; y < currentYear; y += 2) {
    const w = iemaCycleStartingAt(month, y);
    // Drop past cycles that ended before the account existed — no user data
    // could ever live in them, so they'd render as empty placeholders.
    if (createdISO && w.endISO < createdISO) continue;
    out.push({ ...w, isCurrent: false, isPast: true, isFuture: today < w.startISO });
  }

  // Current cycle.
  const cur = iemaCycleStartingAt(month, currentYear);
  out.push({ ...cur, isCurrent: true, isPast: false, isFuture: false });

  // One future cycle (always shown).
  const next = iemaCycleStartingAt(month, currentYear + 2);
  out.push({ ...next, isCurrent: false, isPast: false, isFuture: true });

  return out;
}

export function listArrtCycles(u: AppUser): CycleSummary[] {
  if (!isArrtSetup(u)) return [];
  const birthMonth = Number((u.birthday as string).slice(0, 2));
  if (!Number.isFinite(birthMonth) || birthMonth < 1 || birthMonth > 12) return [];
  const anchorYear = u.arrtCycleStartYear as number;
  const currentYear = rolledArrtStartYear(u, birthMonth);
  const today = todayISO();
  const createdISO = accountCreatedISO(u);
  const out: CycleSummary[] = [];

  for (let y = anchorYear; y < currentYear; y += 2) {
    const w = arrtCycleStartingAt(birthMonth, y);
    if (createdISO && w.endISO < createdISO) continue;
    out.push({
      startISO: w.startISO,
      endISO: w.endISO,
      daysRemaining: w.daysRemaining,
      isCurrent: false,
      isPast: true,
      isFuture: today < w.startISO,
    });
  }

  const cur = arrtCycleStartingAt(birthMonth, currentYear);
  out.push({
    startISO: cur.startISO,
    endISO: cur.endISO,
    daysRemaining: cur.daysRemaining,
    isCurrent: true,
    isPast: false,
    isFuture: false,
  });

  const next = arrtCycleStartingAt(birthMonth, currentYear + 2);
  out.push({
    startISO: next.startISO,
    endISO: next.endISO,
    daysRemaining: next.daysRemaining,
    isCurrent: false,
    isPast: false,
    isFuture: true,
  });

  return out;
}

/**
 * Resolves which cycle a cert's credits land in, per license.
 *
 * - If `cert.appliedCycles` is present, it wins (explicit, user-chosen).
 * - Otherwise, for each license in `cert.categories`, derive the cycle
 *   whose window contains `completedDate` (legacy behavior). CPR is
 *   omitted because it has no cycle.
 */
export function getEffectiveAppliedCycles(
  cert: Certification,
  appUser: AppUser,
): AppliedCycles {
  if (cert.appliedCycles) return cert.appliedCycles;
  const out: AppliedCycles = {};
  const completed = cert.completedDate;
  for (const cat of cert.categories) {
    if (cat === 'CPR') continue;
    const cycles = cat === 'IEMA' ? listIemaCycles(appUser) : listArrtCycles(appUser);
    const hit = cycles.find((c) => completed >= c.startISO && completed <= c.endISO);
    if (hit) out[cat] = hit.startISO;
  }
  return out;
}

export function creditsInCycle(
  certs: Certification[],
  category: CertificateCategory,
  cycle: CycleWindow,
  appUser: AppUser,
): number {
  return certs.reduce((sum, cert) => {
    const applied = getEffectiveAppliedCycles(cert, appUser);
    if (applied[category] !== cycle.startISO) return sum;
    return sum + (cert.ceCredits || 0);
  }, 0);
}

export interface AppliedCycleMigration {
  certId: string;
  /** Full, updated `appliedCycles` map to write back to the cert document. */
  appliedCycles: AppliedCycles;
}

/**
 * Maps each old cycle's `startISO` to the new cycle that occupies the *same
 * position relative to the current cycle*. So the current cycle maps to the new
 * current cycle (offset 0), the one immediately before it to the new one
 * immediately before it (offset −1), and so on. An old cycle with no
 * corresponding new cycle (the new timeline doesn't reach that far back/forward)
 * is omitted, as is any cycle whose `startISO` didn't actually move.
 */
function buildCycleStartRemap(
  oldCycles: CycleSummary[],
  newCycles: CycleSummary[],
): Map<string, string> {
  const map = new Map<string, string>();
  if (oldCycles.length === 0 || newCycles.length === 0) return map;
  const oldCur = oldCycles.findIndex((c) => c.isCurrent);
  const newCur = newCycles.findIndex((c) => c.isCurrent);
  if (oldCur === -1 || newCur === -1) return map;
  for (let i = 0; i < oldCycles.length; i++) {
    const target = newCycles[newCur + (i - oldCur)];
    if (!target) continue;
    if (oldCycles[i].startISO !== target.startISO) {
      map.set(oldCycles[i].startISO, target.startISO);
    }
  }
  return map;
}

/**
 * After a user edits the profile fields that anchor their license cycles —
 * IEMA start year / end month, ARRT start year, or their birthday (the ARRT
 * cycle is anchored to its birth month) — the computed cycle windows, and
 * therefore their `startISO`s, can shift. A cert applied to a cycle freezes that
 * `startISO` into `appliedCycles` (its historical record of when the cycle
 * began). Without a fixup, the stored value would no longer match any recomputed
 * cycle, so the cert would read as "spent" in a past cycle (see CycleManager)
 * and silently drop off both the dashboard donut and its timeline card.
 *
 * This returns the per-cert updates needed to re-point every attribution — past,
 * current, and future — onto the corrected grid, by relative position (see
 * `buildCycleStartRemap`). Rules:
 *
 * - Each license is remapped independently — editing IEMA leaves an ARRT
 *   attribution on the same cert untouched, and vice-versa.
 * - Attributions outside the cycle list (older than the anchor, or a stale value
 *   with no matching old cycle) are left untouched — they have no remap entry.
 * - Legacy certs (no `appliedCycles`) are skipped: they derive their cycle from
 *   `completedDate` and recompute automatically against the updated profile.
 * - A license whose cycle grid didn't move yields an empty remap, so its
 *   attributions are left alone.
 */
export function planAppliedCycleMigrations(
  certs: Certification[],
  prevUser: AppUser,
  nextUser: AppUser,
): AppliedCycleMigration[] {
  const remaps: Record<Exclude<CertificateCategory, 'CPR'>, Map<string, string>> = {
    IEMA: buildCycleStartRemap(listIemaCycles(prevUser), listIemaCycles(nextUser)),
    ARRT: buildCycleStartRemap(listArrtCycles(prevUser), listArrtCycles(nextUser)),
  };

  const out: AppliedCycleMigration[] = [];
  for (const cert of certs) {
    if (!cert.appliedCycles) continue;
    let changed = false;
    const next: AppliedCycles = { ...cert.appliedCycles };
    for (const lic of ['IEMA', 'ARRT'] as const) {
      const cur = next[lic];
      if (!cur) continue;
      const mapped = remaps[lic].get(cur);
      if (mapped) {
        next[lic] = mapped;
        changed = true;
      }
    }
    if (changed) out.push({ certId: cert.id, appliedCycles: next });
  }
  return out;
}
