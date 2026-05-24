import type { Certification } from '../types/certification';

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

export const isArchived = (cert: Certification, today?: Date): boolean => {
  return getArchiveStatus(cert, today).expired || isFullyUsed(cert);
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

const isCategoryA = (cert: Certification): boolean => {
  const t = (cert.categoryType ?? '').trim().toUpperCase();
  return t === 'A' || t === 'A+';
};

/**
 * Unused points per license: ceCredits across certs that
 *   - are Category A or A+ (the only categories that count per license_ce_logic.md)
 *   - have not yet expired
 *   - are NOT already applied to that license (cert.categories does not include it)
 *
 * Per license_ce_logic.md a single certificate may be applied to one ARRT cycle
 * AND one IEMA cycle ("double dipping"), so a cert tagged only with IEMA still
 * counts toward ARRT's unused pool until it's tagged with ARRT too.
 */
export const unusedPointsByLicense = (
  certs: Certification[],
  today?: Date,
): { arrt: number; iema: number } => {
  const cutoff = startOfToday(today);
  let arrt = 0;
  let iema = 0;

  for (const cert of certs) {
    if (!isCategoryA(cert)) continue;
    if (new Date(`${cert.expirationDate}T00:00:00`) < cutoff) continue;

    if (!cert.categories.includes('ARRT')) arrt += cert.ceCredits || 0;
    if (!cert.categories.includes('IEMA')) iema += cert.ceCredits || 0;
  }

  return { arrt, iema };
};
