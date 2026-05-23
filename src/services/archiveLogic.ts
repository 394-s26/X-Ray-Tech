import type { AppUser } from '../types/auth';
import type { Certification } from '../types/certification';
import {
  isWithinArrtCreditWindow,
  isWithinIemaCreditWindow,
} from './licenseCycle';

export interface ArchiveStatus {
  expired: boolean;
  usedByArrt: boolean;
  usedByIema: boolean;
}

const startOfToday = (today?: Date): Date => {
  const d = today ? new Date(today) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getArchiveStatus = (
  cert: Certification,
  today?: Date,
): ArchiveStatus => {
  const expiry = new Date(`${cert.expirationDate}T00:00:00`);
  const expired = expiry < startOfToday(today);
  return {
    expired,
    usedByArrt: cert.categories.includes('ARRT'),
    usedByIema: cert.categories.includes('IEMA'),
  };
};

const isCategoryA = (cert: Certification): boolean => {
  const t = (cert.categoryType ?? '').trim().toUpperCase();
  return t === 'A' || t === 'A+';
};

/**
 * Potential unused points per license: sum of ceCredits across certs that
 *   - are Category A or A+
 *   - have not yet expired
 *   - are NOT already applied to that license (cert.categories does not include it)
 *   - have a completedDate that falls inside that license's current credit window
 *
 * Returns null per license if the user has not completed setup for it.
 */
export const unusedPointsByLicense = (
  certs: Certification[],
  user: AppUser,
  today?: Date,
): { arrt: number | null; iema: number | null } => {
  const cutoff = startOfToday(today);
  const arrtConfigured = Boolean(user.birthday && user.arrtCycleStartYear);
  const iemaConfigured = Boolean(user.iemaCycleStartYear && user.iemaCycleEndMonth);

  let arrt = 0;
  let iema = 0;

  for (const cert of certs) {
    if (!isCategoryA(cert)) continue;
    if (new Date(`${cert.expirationDate}T00:00:00`) < cutoff) continue;

    if (
      arrtConfigured &&
      !cert.categories.includes('ARRT') &&
      isWithinArrtCreditWindow(cert.completedDate, user)
    ) {
      arrt += cert.ceCredits || 0;
    }

    if (
      iemaConfigured &&
      !cert.categories.includes('IEMA') &&
      isWithinIemaCreditWindow(cert.completedDate, user)
    ) {
      iema += cert.ceCredits || 0;
    }
  }

  return {
    arrt: arrtConfigured ? arrt : null,
    iema: iemaConfigured ? iema : null,
  };
};
