import type { AppUser } from '../types/auth';
import type { Certification, CertificateCategory } from '../types/certification';

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

/** Returns IEMA cycles ordered oldest → newest, spanning the user's anchor and the current rolled cycle. */
export function listIemaCycles(u: AppUser): CycleSummary[] {
  if (!isIemaSetup(u)) return [];
  const month = u.iemaCycleEndMonth as number;
  const anchorYear = u.iemaCycleStartYear as number;
  const currentYear = rolledIemaStartYear(u);
  const lo = Math.min(anchorYear, currentYear);
  const hi = Math.max(anchorYear, currentYear);
  const today = todayISO();
  const out: CycleSummary[] = [];
  for (let y = lo; y <= hi; y += 2) {
    const w = iemaCycleStartingAt(month, y);
    out.push({
      ...w,
      isCurrent: y === currentYear,
      isPast: today > w.endISO,
      isFuture: today < w.startISO,
    });
  }
  return out;
}

export function listArrtCycles(u: AppUser): CycleSummary[] {
  if (!isArrtSetup(u)) return [];
  const birthMonth = Number((u.birthday as string).slice(0, 2));
  if (!Number.isFinite(birthMonth) || birthMonth < 1 || birthMonth > 12) return [];
  const anchorYear = u.arrtCycleStartYear as number;
  const currentYear = rolledArrtStartYear(u, birthMonth);
  const lo = Math.min(anchorYear, currentYear);
  const hi = Math.max(anchorYear, currentYear);
  const today = todayISO();
  const out: CycleSummary[] = [];
  for (let y = lo; y <= hi; y += 2) {
    const w = arrtCycleStartingAt(birthMonth, y);
    out.push({
      startISO: w.startISO,
      endISO: w.endISO,
      daysRemaining: w.daysRemaining,
      isCurrent: y === currentYear,
      isPast: today > w.endISO,
      isFuture: today < w.startISO,
    });
  }
  return out;
}

export function creditsInCycle(
  certs: Certification[],
  category: CertificateCategory,
  cycle: CycleWindow,
): number {
  return certs.reduce((sum, cert) => {
    if (!cert.categories.includes(category)) return sum;
    const completed = cert.completedDate;
    if (completed < cycle.startISO || completed > cycle.endISO) return sum;
    return sum + (cert.ceCredits || 0);
  }, 0);
}
