import { FirebaseError } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, storage } from './firebase';

/** User-facing copy when save fails (e.g. Auth / Storage rules). */
export function describeCertificateSaveError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/operation-not-allowed'
    ) {
      return (
        'Anonymous sign-in is disabled for this Firebase project. In the Firebase Console, open ' +
        'Authentication → Sign-in method → Anonymous → Enable, then try again.'
      );
    }
    if (err.code === 'storage/unauthorized') {
      return (
        'Storage rejected the upload. If your team has not deployed Storage rules from this repo, run ' +
        '`firebase deploy --only storage` (or ask someone with access). Rules must allow writes under ' +
        'certificatePhotos/{your user id}/ for image files.'
      );
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Could not save the certificate. Check Firebase Auth (Anonymous) and Storage rules.';
}

export type CertificateCategory = 'IEMA' | 'ARRT';

export interface CertificateRecordInput {
  photoFile: File;
  certificateName: string;
  companyName: string;
  completedDate: string;
  expiresDate: string;
  points: number;
  category: CertificateCategory;
}

async function ensureSignedIn(): Promise<string> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!.uid;
}

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

function fileExtensionLower(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const i = base.lastIndexOf('.');
  if (i <= 0) return '';
  return base.slice(i + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
}

/** Storage rules require image/*; browsers sometimes omit file.type. */
function imageContentTypeForUpload(file: File): string {
  if (file.type && /^image\//i.test(file.type)) {
    return file.type;
  }
  const ext = fileExtensionLower(file.name);
  return EXT_TO_MIME[ext] ?? 'image/png';
}

function safeObjectBaseName(file: File): string {
  const base = file.name.split(/[/\\]/).pop() ?? 'photo';
  const dot = base.lastIndexOf('.');
  const withoutExt = dot > 0 ? base.slice(0, dot) : base;
  return withoutExt.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'photo';
}

export async function createCertificateRecord(input: CertificateRecordInput): Promise<string> {
  const uid = await ensureSignedIn();

  const extRaw = fileExtensionLower(input.photoFile.name);
  const ext = extRaw && EXT_TO_MIME[extRaw] ? extRaw : 'png';
  const safeBase = safeObjectBaseName(input.photoFile);
  const objectName = `${crypto.randomUUID()}_${safeBase}.${ext}`;
  const storageRef = ref(storage, `certificatePhotos/${uid}/${objectName}`);

  await uploadBytes(storageRef, input.photoFile, {
    contentType: imageContentTypeForUpload(input.photoFile),
  });

  const photoUrl = await getDownloadURL(storageRef);

  const completedAt = Timestamp.fromDate(new Date(`${input.completedDate}T12:00:00`));
  const expiresAt = Timestamp.fromDate(new Date(`${input.expiresDate}T12:00:00`));

  const docRef = await addDoc(collection(db, 'certificateRecords'), {
    ownerUid: uid,
    photoStoragePath: storageRef.fullPath,
    photoUrl,
    certificateName: input.certificateName.trim(),
    companyName: input.companyName.trim(),
    completedAt,
    expiresAt,
    points: input.points,
    category: input.category,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
