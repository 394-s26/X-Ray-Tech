import type { DocumentData, Timestamp } from 'firebase-admin/firestore';
import type { Certificate } from '../types/certificate.js';

/** Normalize Firestore `certificates` docs (Certification or upload Certificate shape). */
export function toCertificateForFcm(id: string, data: DocumentData): Certificate | null {
  const expirationDate = data.expirationDate;
  if (typeof expirationDate !== 'string' || !expirationDate.trim()) {
    return null;
  }

  const uid = (data.uid ?? data.ownerId) as string | undefined;
  if (!uid) {
    return null;
  }

  const uploadedAt = (data.uploadedAt ?? data.createdAt) as Timestamp | undefined;
  if (!uploadedAt) {
    return null;
  }

  return {
    id,
    uid,
    storagePath: typeof data.storagePath === 'string' ? data.storagePath : '',
    displayFileName:
      (typeof data.displayFileName === 'string' && data.displayFileName) ||
      (typeof data.certificateName === 'string' && data.certificateName) ||
      'Certificate',
    contentType:
      data.contentType === 'image/png' ||
      data.contentType === 'application/pdf' ||
      data.contentType === 'image/jpeg'
        ? data.contentType
        : 'image/jpeg',
    byteSize: typeof data.byteSize === 'number' ? data.byteSize : 0,
    ocrText: typeof data.ocrText === 'string' ? data.ocrText : '',
    ocrConfidence: typeof data.ocrConfidence === 'number' ? data.ocrConfidence : 0,
    providerName:
      typeof data.providerName === 'string' ? data.providerName : data.providerName ?? null,
    completedDate:
      typeof data.completedDate === 'string' ? data.completedDate : data.completedDate ?? null,
    expirationDate,
    ceCredits: typeof data.ceCredits === 'number' ? data.ceCredits : data.ceCredits ?? null,
    examName: typeof data.examName === 'string' ? data.examName : data.examName ?? null,
    uploadedAt,
    validated:
      data.validated === 'pending' || data.validated === 'ok' || data.validated === 'failed'
        ? data.validated
        : 'ok',
    validationError:
      typeof data.validationError === 'string' ? data.validationError : undefined,
  };
}
