import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppUser } from '../types/auth';
import type { Certification, CertificateCategory } from '../types/certification';
import {
  creditsInCycle,
  isArrtSetup,
  isIemaSetup,
  listArrtCycles,
  listIemaCycles,
  type CycleSummary,
} from '../utils/cycles';

export interface CycleCreditsDoc {
  category: CertificateCategory;
  startISO: string;
  endISO: string;
  credits: number;
}

const cycleDocId = (category: CertificateCategory, startISO: string): string =>
  `${category}_${startISO}`;

const cycleCreditsCollection = (uid: string) =>
  collection(db, 'users', uid, 'cycleCredits');

/**
 * Builds the full set of (category, cycle, credits) entries that should be
 * persisted for this user. Only past + current cycles are written — future
 * cycles always have 0 credits and we'd rather not pre-create empty docs.
 */
function buildEntries(
  appUser: AppUser,
  certifications: Certification[],
): CycleCreditsDoc[] {
  const out: CycleCreditsDoc[] = [];

  const push = (cycles: CycleSummary[], category: CertificateCategory) => {
    for (const cycle of cycles) {
      if (cycle.isFuture) continue;
      out.push({
        category,
        startISO: cycle.startISO,
        endISO: cycle.endISO,
        credits: creditsInCycle(certifications, category, cycle, appUser),
      });
    }
  };

  if (isIemaSetup(appUser)) push(listIemaCycles(appUser), 'IEMA');
  if (isArrtSetup(appUser)) push(listArrtCycles(appUser), 'ARRT');

  return out;
}

/**
 * Writes the full per-cycle credit snapshot to Firestore. Idempotent — safe to
 * call on every cert change. Skipped entirely when there are no entries
 * (e.g. user hasn't set up either license yet).
 */
export async function syncCycleCredits(
  appUser: AppUser,
  certifications: Certification[],
): Promise<void> {
  const entries = buildEntries(appUser, certifications);
  if (entries.length === 0) return;

  const batch = writeBatch(db);
  const col = cycleCreditsCollection(appUser.uid);
  for (const entry of entries) {
    const ref = doc(col, cycleDocId(entry.category, entry.startISO));
    batch.set(
      ref,
      {
        category: entry.category,
        startISO: entry.startISO,
        endISO: entry.endISO,
        credits: entry.credits,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
}

/** Cache key used by the sync hook to avoid redundant writes. */
export function fingerprintEntries(entries: CycleCreditsDoc[]): string {
  return entries
    .map((e) => `${e.category}|${e.startISO}|${e.credits}`)
    .sort()
    .join(';');
}

export function buildEntriesForFingerprint(
  appUser: AppUser,
  certifications: Certification[],
): CycleCreditsDoc[] {
  return buildEntries(appUser, certifications);
}
