import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { FcmTokenRecord } from '../types/fcmToken';
import { db } from './firebase';

const DEVICE_ID_KEY = 'xray-fcm-device-id';

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

export function fcmTokenDocId(uid: string, deviceId?: string): string {
  return `${uid}_${deviceId ?? getOrCreateDeviceId()}`;
}

/**
 * Creates or updates this browser's token in `fcmTokens/{uid}_{deviceId}`.
 * Same device doc is updated when the token is refreshed (avoids stale duplicates per device).
 */
export async function upsertFcmToken(uid: string, token: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const docId = fcmTokenDocId(uid, deviceId);
  const ref = doc(db, 'fcmTokens', docId);
  const existing = await getDoc(ref);
  const now = serverTimestamp();

  const payload: Omit<FcmTokenRecord, 'createdAt' | 'updatedAt'> & {
    createdAt?: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid,
    token,
    deviceId,
    platform: 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    updatedAt: now,
  };

  if (existing.exists()) {
    await setDoc(ref, payload, { merge: true });
  } else {
    await setDoc(ref, {
      ...payload,
      createdAt: now,
    });
  }
}

/** Remove this device's token doc on sign-out (optional hygiene). */
export async function deleteCurrentDeviceFcmToken(uid: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const ref = doc(db, 'fcmTokens', fcmTokenDocId(uid, deviceId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await deleteDoc(ref);
}
