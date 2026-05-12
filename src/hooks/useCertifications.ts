import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { Certification, CertificateCategory } from '../types/certification';

interface UseCertificationsResult {
  certifications: Certification[];
  loading: boolean;
  error: string | null;
}

export function useCertifications(category?: CertificateCategory): UseCertificationsResult {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'certificates'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data() as Certification);
        const filtered = category
          ? docs.filter((c) => c.categories.includes(category))
          : docs;
        setCertifications(filtered);
        setLoading(false);
      },
      (err) => {
        console.error('useCertifications snapshot error', err);
        setError('Failed to load certifications.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [category]);

  return { certifications, loading, error };
}
