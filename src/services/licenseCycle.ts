import type { AppUser } from '../types/auth';

export interface CycleWindow {
  start: Date;
  end: Date;
}

const lastDayOfMonth = (year: number, monthIndex: number): Date => {
  return new Date(year, monthIndex + 1, 0);
};

const parseBirthMonth = (birthday: string | null | undefined): number | null => {
  if (!birthday) return null;
  const match = birthday.match(/^(\d{2})-\d{2}$/);
  if (!match) return null;
  const m = parseInt(match[1], 10);
  if (m < 1 || m > 12) return null;
  return m;
};

const dayOnly = (d: Date): Date => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
};

const parseIsoDate = (iso: string): Date => {
  return new Date(`${iso}T00:00:00`);
};

/**
 * Returns the ARRT cycle window containing `date`, rolling forward in 2-year
 * increments from the user's stored start year.
 *
 * Per license_ce_logic.md:
 *   - Starts: first day of birth month
 *   - Ends:   last day of the month BEFORE birth month, 2 years later
 */
export const arrtCycleFor = (date: Date, user: AppUser): CycleWindow | null => {
  const birthMonth = parseBirthMonth(user.birthday);
  if (!birthMonth || !user.arrtCycleStartYear) return null;

  const target = dayOnly(date);
  let year = user.arrtCycleStartYear;

  for (let i = 0; i < 50; i++) {
    const start = new Date(year, birthMonth - 1, 1);
    const end = lastDayOfMonth(year + 2, birthMonth - 2);
    if (target >= start && target <= end) {
      return { start, end };
    }
    if (target < start) return { start, end };
    year += 2;
  }
  return null;
};

/**
 * ARRT credits earned during the birth month (final month of the cycle) do NOT
 * count toward that cycle. Returns true when the cert's completedDate falls
 * inside the cycle's effective earning window.
 */
export const isWithinArrtCreditWindow = (
  certCompletedDate: string,
  user: AppUser,
): boolean => {
  const birthMonth = parseBirthMonth(user.birthday);
  if (!birthMonth) return false;
  const completed = parseIsoDate(certCompletedDate);
  const cycle = arrtCycleFor(completed, user);
  if (!cycle) return false;
  if (completed < cycle.start || completed > cycle.end) return false;
  // Exclude the final (birth) month of the cycle window.
  const finalMonthStart = new Date(cycle.end.getFullYear(), birthMonth - 1, 1);
  return completed < finalMonthStart;
};

/**
 * Returns the IEMA cycle window containing `date`, rolling forward in 2-year
 * increments from the user's stored start year.
 *
 * Per license_ce_logic.md:
 *   - Starts: first day of accreditation month (iemaCycleEndMonth)
 *   - Ends:   last day of accreditation month, 2 years later
 *   - All credits within the window count, including the final month.
 */
export const iemaCycleFor = (date: Date, user: AppUser): CycleWindow | null => {
  if (!user.iemaCycleStartYear || !user.iemaCycleEndMonth) return null;

  const m = user.iemaCycleEndMonth;
  const target = dayOnly(date);
  let year = user.iemaCycleStartYear;

  for (let i = 0; i < 50; i++) {
    const start = new Date(year, m - 1, 1);
    const end = lastDayOfMonth(year + 2, m - 1);
    if (target >= start && target <= end) {
      return { start, end };
    }
    if (target < start) return { start, end };
    year += 2;
  }
  return null;
};

export const isWithinIemaCreditWindow = (
  certCompletedDate: string,
  user: AppUser,
): boolean => {
  const completed = parseIsoDate(certCompletedDate);
  const cycle = iemaCycleFor(completed, user);
  if (!cycle) return false;
  return completed >= cycle.start && completed <= cycle.end;
};
