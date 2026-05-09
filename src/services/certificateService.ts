import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { getStoredCertificateCount } from './storedCounts';
import { listScantrons } from './scantronService';
import {
  STORAGE_LIMITS,
  StorageLimitError,
  type Certificate,
  type CertificateContentType,
  type CertificateInput,
  type Scantron,
} from '../types/upload';

const COLLECTION = 'certificates';

const certCollection = () => collection(db, COLLECTION);

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
  return snap.docs.map(d => d.data() as Certificate);
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
  return all.filter(s => {
    const sameName = targetName.length > 0 && normalize(s.examName) === targetName;
    const sameDate =
      primaryDate && s.examDate ? daysBetween(primaryDate, s.examDate) <= 90 : false;
    return sameName || sameDate;
  });
};
