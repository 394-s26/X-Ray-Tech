import type { Timestamp } from 'firebase/firestore';

/** File type for uploaded certificate images/PDFs. */
export type CertificateContentType = 'image/jpeg' | 'image/png' | 'application/pdf';

export type ValidationStatus = 'pending' | 'ok' | 'failed';

/**
 * OCR / file-upload certificate stored in Firestore `certificates` (uid-based docs).
 * For manually entered CE records, see `Certification` in `certification.ts`.
 */
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

export interface CertificateInput {
  uid: string;
  displayFileName: string;
  contentType: CertificateContentType;
  ocrText: string;
  ocrConfidence: number;
  providerName: string | null;
  completedDate: string | null;
  expirationDate: string | null;
  ceCredits: number | null;
  examName: string | null;
}
