import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth } from './firebase';
import { registerMessagingServiceWorker } from './firebaseMessagingSw';
import { upsertFcmToken } from './fcmTokenService';

const NOTIFY_AFTER_LOGIN_KEY = 'xray-tech:notify-permission-after-login';
const FCM_LAST_SYNC_KEY = 'xray-fcm-last-sync';

/** Re-fetch and persist FCM token after this interval (web has no onTokenRefresh). */
export const FCM_TOKEN_REFRESH_MS = 24 * 60 * 60 * 1000;

export function markNotificationPermissionPromptAfterLogin(): void {
  try {
    sessionStorage.setItem(NOTIFY_AFTER_LOGIN_KEY, '1');
  } catch {
    /* quota / private mode */
  }
}

export function consumeNotificationPermissionPromptAfterLogin(): boolean {
  try {
    if (!sessionStorage.getItem(NOTIFY_AFTER_LOGIN_KEY)) return false;
    sessionStorage.removeItem(NOTIFY_AFTER_LOGIN_KEY);
    return true;
  } catch {
    return false;
  }
}

function readVapidKey(): string | undefined {
  const key =
    (import.meta.env.VITE_FCM_VAPID_KEY ?? import.meta.env.VITE_FCM_VAPID_ID) as
      | string
      | undefined;
  return key?.trim() || undefined;
}

function markFcmSynced(): void {
  try {
    localStorage.setItem(FCM_LAST_SYNC_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isFcmTokenRefreshDue(): boolean {
  try {
    const last = localStorage.getItem(FCM_LAST_SYNC_KEY);
    if (!last) return true;
    return Date.now() - Number(last) >= FCM_TOKEN_REFRESH_MS;
  } catch {
    return true;
  }
}

const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('[FCM] Foreground message:', payload);
  const title = payload.notification?.title ?? 'X-Ray Tech';
  const body = payload.notification?.body ?? '';
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  }
});

/**
 * Registers SW, obtains FCM token, and upserts into `fcmTokens/{uid}_{deviceId}`.
 * Call after permission is granted, on login, and on a schedule to refresh stale tokens.
 */
export async function syncFcmTokenForCurrentUser(options?: {
  requestPermission?: boolean;
}): Promise<string | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  if (typeof Notification === 'undefined') {
    console.warn('[FCM] Notifications API not available.');
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('[FCM] Firebase Messaging is not supported in this browser.');
    return null;
  }

  let permission = Notification.permission;
  if (permission === 'default' && options?.requestPermission) {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return null;
  }

  const vapidKey = readVapidKey();
  if (!vapidKey) {
    console.warn('[FCM] Set VITE_FCM_VAPID_KEY (or VITE_FCM_VAPID_ID) in .env.');
    return null;
  }

  try {
    const registration = await registerMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn('[FCM] getToken returned empty — check SW console for init errors.');
      return null;
    }

    await upsertFcmToken(uid, token);
    markFcmSynced();
    console.log('[FCM] Token saved to Firestore');
    return token;
  } catch (err) {
    console.error('[FCM] Token sync failed:', err);
    return null;
  }
}

/** Refresh token if last sync is older than FCM_TOKEN_REFRESH_MS. */
export async function refreshFcmTokenIfDue(): Promise<void> {
  if (!auth.currentUser?.uid) return;
  if (Notification.permission !== 'granted') return;
  if (!isFcmTokenRefreshDue()) return;
  await syncFcmTokenForCurrentUser();
}

/**
 * After login: prompt if needed, then sync token to Firestore.
 */
export async function requestNotificationPermissionIfDefault(): Promise<void> {
  const shouldPrompt = Notification.permission === 'default';
  await syncFcmTokenForCurrentUser({ requestPermission: shouldPrompt });
}
