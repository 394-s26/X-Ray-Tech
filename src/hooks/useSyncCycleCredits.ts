import { useEffect, useRef } from 'react';
import type { AppUser } from '../types/auth';
import {
  buildEntriesForFingerprint,
  fingerprintEntries,
  syncCycleCredits,
} from '../services/cycleCreditsService';
import { useCertifications } from './useCertifications';

/**
 * Eagerly mirrors per-cycle CE credits to /users/{uid}/cycleCredits/{category}_{startISO}
 * whenever the user's certs or setup change. The fingerprint guard prevents redundant
 * writes when the snapshot fires but nothing relevant moved.
 */
export function useSyncCycleCredits(appUser: AppUser): void {
  const { certifications, loading } = useCertifications();
  const lastFingerprint = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const entries = buildEntriesForFingerprint(appUser, certifications);
    const fp = fingerprintEntries(entries);
    if (fp === lastFingerprint.current) return;
    lastFingerprint.current = fp;

    syncCycleCredits(appUser, certifications).catch((err) => {
      console.error('useSyncCycleCredits write failed', err);
    });
  }, [appUser, certifications, loading]);
}
