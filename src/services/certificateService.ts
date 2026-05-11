import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

export type CertificateCategory = 'IEMA' | 'ARRT';

export interface CreateCertificateInput {
  photoFile: File;
  certificateName: string;
  companyName: string;
  completedDate: string;
  expiresDate: string;
  points: number;
  categories: CertificateCategory[];
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

  const certRef = doc(collection(db, 'certificates'));
  const certId = certRef.id;
  const ext = extFromMime(input.photoFile.type);
  const path = `certificates/${user.uid}/${certId}.${ext}`;
  const blobRef = storageRef(storage, path);

  await uploadBytes(blobRef, input.photoFile, {
    contentType: input.photoFile.type || 'image/jpeg',
    customMetadata: { uid: user.uid, certId },
  });
  const photoURL = await getDownloadURL(blobRef);

  await setDoc(certRef, {
    id: certId,
    uid: user.uid,
    certificateName: input.certificateName.trim(),
    companyName: input.companyName.trim(),
    completedDate: input.completedDate,
    expiresDate: input.expiresDate,
    points: input.points,
    categories: input.categories,
    photoPath: path,
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
    if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
      return "Permission denied. Try signing in again.";
    }
    if (message.includes('storage/canceled')) {
      return 'Upload was canceled. Please try again.';
    }
    return message;
  }
  return 'Failed to save the certificate. Please try again.';
};
