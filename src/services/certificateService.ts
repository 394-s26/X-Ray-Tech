import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { getStoredCertificateCount } from './storedCounts';
import { listScantrons } from './scantronService';
import { planAppliedCycleMigrations } from '../utils/cycles';
import {
  STORAGE_LIMITS,
  StorageLimitError,
  type Certificate,
  type CertificateContentType,
  type CertificateInput,
  type Scantron,
} from '../types/upload';
import type { AppUser } from '../types/auth';
import type { AppliedCycles, Certification, CertificateCategory } from '../types/certification';

export type { CertificateCategory };

const COLLECTION = 'certificates';

const certCollection = () => collection(db, COLLECTION);

// ── Manual CE certificate form (CertificateCreatePage) ─────────────────────

export interface CreateCertificateInput {
  photoFile: File | null;
  certificateName: string;
  providerName: string;
  completedDate: string;
  expirationDate: string;
  ceCredits: number;
  categoryType: string | null;
  categories: CertificateCategory[];
  appliedCycles: AppliedCycles;
}

const extFromMime = (mime: string): string => {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic';
  return 'jpg';
};

export const createCertificateRecord = async (
  input: CreateCertificateInput,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to add a certificate.');
  }

  const certRef = doc(certCollection());
  const certId = certRef.id;

  let photoStoragePath = '';
  let photoURL = '';
  if (input.photoFile) {
    const ext = extFromMime(input.photoFile.type);
    const path = `certificates/${user.uid}/${certId}.${ext}`;
    const blobRef = storageRef(storage, path);
    await uploadBytes(blobRef, input.photoFile, {
      contentType: input.photoFile.type || 'image/jpeg',
      customMetadata: { uid: user.uid, certId },
    });
    photoStoragePath = path;
    photoURL = await getDownloadURL(blobRef);
  }

  await setDoc(certRef, {
    id: certId,
    ownerId: user.uid,
    certificateName: input.certificateName.trim(),
    providerName: input.providerName.trim(),
    completedDate: input.completedDate,
    expirationDate: input.expirationDate,
    ceCredits: input.ceCredits,
    categoryType: input.categoryType,
    categories: input.categories,
    appliedCycles: input.appliedCycles,
    photoStoragePath,
    photoURL,
    createdAt: serverTimestamp(),
  });

  return certId;
};

export const describeCertificateSaveError = (err: unknown): string => {
  if (err instanceof Error) {
    const message = err.message;
    if (message.includes('storage/unauthorized')) {
      return 'Storage permission denied. Your Firebase storage rules need to be deployed.';
    }
    if (message.includes('storage/quota-exceeded')) {
      return 'Storage quota exceeded. Contact your administrator.';
    }
    if (
      message.includes('permission-denied') ||
      message.includes('Missing or insufficient permissions')
    ) {
      return 'Permission denied. Try signing in again.';
    }
    if (message.includes('storage/canceled')) {
      return 'Upload was canceled. Please try again.';
    }
    return message;
  }
  return 'Failed to save the certificate. Please try again.';
};

// ── OCR / file-upload flow (CertificateUploadCard) ──────────────────────────

const extForContentType = (contentType: CertificateContentType): 'jpg' | 'png' | 'pdf' => {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  return 'pdf';
};

export const saveCertificate = async (
  input: CertificateInput,
  fileBlob: Blob,
): Promise<Certificate> => {
  const currentCount = await getStoredCertificateCount(input.uid);
  if (currentCount >= STORAGE_LIMITS.certificate) {
    throw new StorageLimitError('certificate', STORAGE_LIMITS.certificate);
  }

  const certRef = doc(certCollection());
  const certId = certRef.id;
  const ext = extForContentType(input.contentType);
  const path = `certificates/${input.uid}/${certId}.${ext}`;
  const blobRef = storageRef(storage, path);

  await uploadBytes(blobRef, fileBlob, {
    contentType: input.contentType,
    customMetadata: {
      uid: input.uid,
      certId,
    },
  });

  const docPayload = {
    id: certId,
    uid: input.uid,
    storagePath: path,
    displayFileName: input.displayFileName,
    contentType: input.contentType,
    byteSize: fileBlob.size,
    ocrText: input.ocrText,
    ocrConfidence: input.ocrConfidence,
    providerName: input.providerName,
    completedDate: input.completedDate,
    expirationDate: input.expirationDate,
    ceCredits: input.ceCredits,
    examName: input.examName,
    uploadedAt: serverTimestamp(),
    validated: 'pending' as const,
  };
  await setDoc(certRef, docPayload);

  return {
    ...docPayload,
    uploadedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as Timestamp,
  };
};

export const listCertificates = async (uid: string): Promise<Certificate[]> => {
  const q = query(certCollection(), where('uid', '==', uid), orderBy('uploadedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Certificate);
};

export const listUserCertifications = async (uid: string): Promise<Certification[]> => {
  const q = query(certCollection(), where('ownerId', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Certification);
};

/**
 * Number of certificate images this account currently has stored. Drives the
 * per-account image-upload allowance — derived from live data so deleting a
 * certificate frees a slot, and certs uploaded before the limit existed count
 * toward it too.
 */
export const countUserCertificateImages = async (uid: string): Promise<number> => {
  const certs = await listUserCertifications(uid);
  return certs.filter((c) => (c.photoURL ?? '').length > 0).length;
};

export const getCertificateDownloadUrl = (cert: Certificate): Promise<string> => {
  return getDownloadURL(storageRef(storage, cert.storagePath));
};

export const deleteCertificate = async (cert: Certificate): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, cert.id));
  try {
    await deleteObject(storageRef(storage, cert.storagePath));
  } catch (err) {
    if (err instanceof Error && /not-found|object-not-found/.test(err.message)) return;
    throw err;
  }
};

export const updateCertificationRecord = async (
  id: string,
  updates: {
    certificateName?: string;
    providerName?: string;
    completedDate?: string;
    expirationDate?: string;
    ceCredits?: number;
    categoryType?: string | null;
    categories?: CertificateCategory[];
    appliedCycles?: AppliedCycles;
  },
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), updates);
};

/**
 * Re-points certs applied to the user's *active* license cycle when a profile
 * edit shifts that cycle's window, so each cert's stored `appliedCycles` keeps
 * reflecting the now-current cycle dates instead of silently reading as spent.
 * See `planAppliedCycleMigrations`. Reads the user's certs fresh, writes any
 * updates in a single batch, and no-ops (no reads beyond the list) when nothing
 * needs migrating. Returns the number of certs updated.
 */
export const migrateAppliedCyclesForProfileChange = async (
  uid: string,
  prevUser: AppUser,
  nextUser: AppUser,
): Promise<number> => {
  const certs = await listUserCertifications(uid);
  const migrations = planAppliedCycleMigrations(certs, prevUser, nextUser);
  if (migrations.length === 0) return 0;
  const batch = writeBatch(db);
  for (const m of migrations) {
    batch.update(doc(db, COLLECTION, m.certId), { appliedCycles: m.appliedCycles });
  }
  await batch.commit();
  return migrations.length;
};

export const deleteCertificationRecord = async (cert: Certification): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, cert.id));
  if (cert.photoStoragePath) {
    try {
      await deleteObject(storageRef(storage, cert.photoStoragePath));
    } catch (err) {
      if (err instanceof Error && /not-found|object-not-found/.test(err.message)) return;
      throw err;
    }
  }
};

const normalize = (s: string | null): string => (s ?? '').trim().toLowerCase();

const daysBetween = (a: string, b: string): number => {
  const da = new Date(a).getTime();
  const db_ = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db_)) return Number.POSITIVE_INFINITY;
  return Math.abs(da - db_) / (1000 * 60 * 60 * 24);
};

export const findMatchingScantronsForCert = async (
  uid: string,
  examName: string | null,
  primaryDate: string | null,
): Promise<Scantron[]> => {
  const all = await listScantrons(uid);
  const targetName = normalize(examName);
  return all.filter((s) => {
    const sameName = targetName.length > 0 && normalize(s.examName) === targetName;
    const sameDate =
      primaryDate && s.examDate ? daysBetween(primaryDate, s.examDate) <= 90 : false;
    return sameName || sameDate;
  });
};
