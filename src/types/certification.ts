import type { Timestamp } from 'firebase/firestore';

export type CertificateCategory = 'IEMA' | 'ARRT' | 'CPR';

export type AppliedCycles = Partial<Record<CertificateCategory, string>>;

export interface Certification {
  id: string;
  ownerId: string;
  certificateName: string;
  providerName: string;
  completedDate: string;
  expirationDate: string;
  ceCredits: number;
  categoryType: string | null;
  categories: CertificateCategory[];
  /**
   * Per-license cycle attribution. Key = license, value = the cycle's startISO.
   * Absent key → not applied to that license. Present key → credits land in
   * that cycle for that license. Legacy certs may omit this; readers should
   * fall back to `getEffectiveAppliedCycles` in utils/cycles.ts.
   */
  appliedCycles?: AppliedCycles;
  photoStoragePath: string;
  photoURL: string;
  createdAt: Timestamp;
}
