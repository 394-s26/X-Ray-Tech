import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Mirrors `Certificate` in `src/types/certificate.ts` (upload / OCR flow).
 */
export type CertificateContentType = 'image/jpeg' | 'image/png' | 'application/pdf';

export type ValidationStatus = 'pending' | 'ok' | 'failed';

export interface Certificate {
  id: string;
  uid: string;
  storagePath: string;
  displayFileName: string;
  contentType: CertificateContentType;
  byteSize: number;
  ocrText: string;
  ocrConfidence: number;
  providerName: string | null;
  completedDate: string | null;
  expirationDate: string | null;
  ceCredits: number | null;
  examName: string | null;
  uploadedAt: Timestamp;
  validated: ValidationStatus;
  validationError?: string;
}
