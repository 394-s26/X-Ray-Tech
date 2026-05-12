import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface StoredCounts {
  certificates: number;
  scantrons: number;
}

const countWhereOwner = async (collectionName: string, uid: string): Promise<number> => {
  const q = query(collection(db, collectionName), where('uid', '==', uid));
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const getStoredCertificateCount = (uid: string): Promise<number> =>
  countWhereOwner('certificates', uid);

export const getStoredScantronCount = (uid: string): Promise<number> =>
  countWhereOwner('scantrons', uid);

export const getStoredCounts = async (uid: string): Promise<StoredCounts> => {
  const [certificates, scantrons] = await Promise.all([
    getStoredCertificateCount(uid),
    getStoredScantronCount(uid),
  ]);
  return { certificates, scantrons };
};
