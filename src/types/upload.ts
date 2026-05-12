import type { Timestamp } from 'firebase/firestore';

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

export interface Scantron {
  id: string;
  uid: string;
  ocrText: string;
  ocrConfidence: number;
  examName: string | null;
  examDate: string | null;
  uploadedAt: Timestamp;
}

export interface ScantronInput {
  uid: string;
  ocrText: string;
  ocrConfidence: number;
  examName: string | null;
  examDate: string | null;
}

export const STORAGE_LIMITS = {
  certificate: 25,
  scantron: 25,
} as const;

export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
} as const;

export const ALLOWED_CONTENT_TYPES: ReadonlyArray<CertificateContentType> = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

export class UnsupportedTypeError extends Error {
  constructor(type: string) {
    super(`Unsupported file type "${type}". Use JPEG, PNG, or PDF.`);
    this.name = 'UnsupportedTypeError';
  }
}

export class TooLargeError extends Error {
  constructor(size: number, max: number) {
    super(`File is ${(size / 1024 / 1024).toFixed(1)} MB; maximum is ${(max / 1024 / 1024).toFixed(0)} MB.`);
    this.name = 'TooLargeError';
  }
}

export class MagicByteMismatchError extends Error {
  constructor() {
    super('File contents do not match the declared file type.');
    this.name = 'MagicByteMismatchError';
  }
}

export class StorageLimitError extends Error {
  kind: 'certificate' | 'scantron';
  limit: number;
  constructor(kind: 'certificate' | 'scantron', limit: number) {
    const noun = kind === 'certificate' ? 'certificates' : 'scan-tron records';
    super(
      `You've reached the ${limit}-${noun} limit. Delete an older one before uploading more.`,
    );
    this.name = 'StorageLimitError';
    this.kind = kind;
    this.limit = limit;
  }
}
