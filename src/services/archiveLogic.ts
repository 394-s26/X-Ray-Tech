import type { Certification, CertificateCategory } from '../types/certification';
import type { AppUser } from '../types/auth';
import {
  PER_LICENSE,
  computeArrtCycle,
  computeIemaCycle,
  creditsInCycle,
  getEffectiveAppliedCycles,
} from '../utils/cycles';

type License = Exclude<CertificateCategory, 'CPR'>;

export type LicenseUsage = 'available' | 'inUse' | 'spent';

/**
 * Per-license state for a cert: 'inUse' = applied to the user's current cycle,
 * 'spent' = applied to a past cycle (matches the red X in CycleManager),
 * 'available' = not applied to this license yet.
 */
export const getLicenseUsage = (
  cert: Certification,
  license: License,
  appUser: AppUser,
): LicenseUsage => {
  const applied = getEffectiveAppliedCycles(cert, appUser)[license];
  if (!applied) return 'available';
  const cycle = license === 'ARRT' ? computeArrtCycle(appUser) : computeIemaCycle(appUser);
  if (cycle && applied === cycle.startISO) return 'inUse';
  return 'spent';
};

const isLicenseSpent = (
  cert: Certification,
  license: License,
  appUser: AppUser,
): boolean => getLicenseUsage(cert, license, appUser) === 'spent';

export type LifecycleStatus = 'active' | 'expiringSoon' | 'expired';

export const EXPIRING_SOON_DAYS = 30;

export interface ArchiveStatus {
  lifecycle: LifecycleStatus;
  expired: boolean;
  expiringSoon: boolean;
  usedByArrt: boolean;
  usedByIema: boolean;
  usedByCpr: boolean;
  unreported: boolean;
}

const startOfToday = (today?: Date): Date => {
  const d = today ? new Date(today) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isFullyUsed = (cert: Certification): boolean => {
  const cprOnly =
    cert.categories.includes('CPR') &&
    !cert.categories.includes('ARRT') &&
    !cert.categories.includes('IEMA');
  return cprOnly
    ? cert.categories.includes('CPR')
    : cert.categories.includes('ARRT') && cert.categories.includes('IEMA');
};

export const isArchived = (
  cert: Certification,
  appUser: AppUser,
  today?: Date,
): boolean => {
  if (getArchiveStatus(cert, today).expired) return true;
  const cprOnly =
    cert.categories.includes('CPR') &&
    !cert.categories.includes('ARRT') &&
    !cert.categories.includes('IEMA');
  if (cprOnly) return true;
  return isLicenseSpent(cert, 'ARRT', appUser) && isLicenseSpent(cert, 'IEMA', appUser);
};

export const getArchiveStatus = (
  cert: Certification,
  today?: Date,
): ArchiveStatus => {
  const cutoff = startOfToday(today);
  const expiry = new Date(`${cert.expirationDate}T00:00:00`);
  const daysUntil = Math.floor((expiry.getTime() - cutoff.getTime()) / 86_400_000);
  const expired = daysUntil < 0;
  const expiringSoon = !expired && daysUntil < EXPIRING_SOON_DAYS;
  const lifecycle: LifecycleStatus = expired
    ? 'expired'
    : expiringSoon
      ? 'expiringSoon'
      : 'active';
  return {
    lifecycle,
    expired,
    expiringSoon,
    usedByArrt: cert.categories.includes('ARRT'),
    usedByIema: cert.categories.includes('IEMA'),
    usedByCpr: cert.categories.includes('CPR'),
    unreported: cert.categories.length === 0,
  };
};

export const isCategoryA = (cert: Certification): boolean => {
  const t = (cert.categoryType ?? '').trim().toUpperCase();
  return t === 'A' || t === 'A+';
};

/**
 * Unused points per license, capped at remaining capacity in the current cycle.
 *
 * For each license:
 *   1. usedThisCycle = credits already applied to the user's current cycle.
 *   2. capacity = max(0, 24 - usedThisCycle).
 *   3. unused = min(sum of ceCredits across non-expired A/A+ certs that
 *      are NOT effectively applied to this license, capacity).
 *
 * If the user hasn't set up that license yet (no current cycle), the cap is
 * disabled — return the raw sum so the UI still shows their potential.
 */
export const unusedPointsByLicense = (
  certs: Certification[],
  appUser: AppUser,
  today?: Date,
): { arrt: number; iema: number } => {
  const cutoff = startOfToday(today);

  const computeFor = (license: Exclude<CertificateCategory, 'CPR'>): number => {
    const cycle = license === 'ARRT' ? computeArrtCycle(appUser) : computeIemaCycle(appUser);
    let unappliedTotal = 0;
    for (const cert of certs) {
      if (!isCategoryA(cert)) continue;
      if (new Date(`${cert.expirationDate}T00:00:00`) < cutoff) continue;
      const applied = getEffectiveAppliedCycles(cert, appUser);
      if (applied[license]) continue; // already applied somewhere
      unappliedTotal += cert.ceCredits || 0;
    }
    if (!cycle) return unappliedTotal;
    const used = creditsInCycle(certs, license, cycle, appUser);
    const capacity = Math.max(0, PER_LICENSE - used);
    return Math.min(unappliedTotal, capacity);
  };

  return { arrt: computeFor('ARRT'), iema: computeFor('IEMA') };
};
