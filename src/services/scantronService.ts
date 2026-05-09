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
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getStoredScantronCount } from './storedCounts';
import {
  STORAGE_LIMITS,
  StorageLimitError,
  type Scantron,
  type ScantronInput,
} from '../types/upload';

const COLLECTION = 'scantrons';

const scantronCollection = () => collection(db, COLLECTION);

export const saveScantron = async (input: ScantronInput): Promise<Scantron> => {
  const currentCount = await getStoredScantronCount(input.uid);
  if (currentCount >= STORAGE_LIMITS.scantron) {
    throw new StorageLimitError('scantron', STORAGE_LIMITS.scantron);
  }
  const ref = doc(scantronCollection());
  const payload = {
    ...input,
    uploadedAt: serverTimestamp(),
  };
  await setDoc(ref, { id: ref.id, ...payload });
  return {
    id: ref.id,
    uid: input.uid,
    ocrText: input.ocrText,
    ocrConfidence: input.ocrConfidence,
    examName: input.examName,
    examDate: input.examDate,
    uploadedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as Timestamp,
  };
};

export const listScantrons = async (uid: string): Promise<Scantron[]> => {
  const q = query(scantronCollection(), where('uid', '==', uid), orderBy('uploadedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Scantron);
};

export const deleteScantron = async (scantron: Scantron): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, scantron.id));
};

export const deleteScantrons = async (scantrons: Scantron[]): Promise<void> => {
  if (scantrons.length === 0) return;
  const batch = writeBatch(db);
  for (const s of scantrons) {
    batch.delete(doc(db, COLLECTION, s.id));
  }
  await batch.commit();
};
