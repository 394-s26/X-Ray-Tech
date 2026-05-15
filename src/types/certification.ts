import type { Timestamp } from 'firebase/firestore';

export type CertificateCategory = 'IEMA' | 'ARRT' | 'CPR';

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
  photoStoragePath: string;
  photoURL: string;
  createdAt: Timestamp;
}
