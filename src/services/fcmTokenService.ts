import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
 * Uses update-then-create (no read) so Firestore rules allow first-time writes.
 */
export async function upsertFcmToken(uid: string, token: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const docId = fcmTokenDocId(uid, deviceId);
  const ref = doc(db, 'fcmTokens', docId);
  const now = serverTimestamp();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const fields = {
    uid,
    token,
    deviceId,
    platform: 'web' as const,
    userAgent,
    updatedAt: now,
  };

  try {
    await updateDoc(ref, fields);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'not-found') {
      throw err;
    }
    await setDoc(ref, {
      ...fields,
      createdAt: now,
    });
  }
}

export async function deleteCurrentDeviceFcmToken(uid: string): Promise<void> {
  const ref = doc(db, 'fcmTokens', fcmTokenDocId(uid));
  try {
    await deleteDoc(ref);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'not-found') {
      throw err;
    }
  }
}
