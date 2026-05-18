import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app } from './firebase';
import { registerMessagingServiceWorker } from './firebaseMessagingSw';

const NOTIFY_AFTER_LOGIN_KEY = 'xray-tech:notify-permission-after-login';

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
 * After login: ensure permission, register SW with env config, obtain FCM token.
 * Runs when permission is default (prompt) or already granted (re-sync token).
 */
export async function requestNotificationPermissionIfDefault(): Promise<void> {
  if (typeof Notification === 'undefined') {
    console.warn('[FCM] Notifications API not available.');
    return;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('[FCM] Firebase Messaging is not supported in this browser.');
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    console.log('[FCM] Notification permission not granted:', permission);
    return;
  }

  const vapidKey = readVapidKey();
  if (!vapidKey) {
    console.warn('[FCM] Set VITE_FCM_VAPID_KEY (or VITE_FCM_VAPID_ID) in .env.');
    return;
  }

  try {
    const registration = await registerMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] Registration token:', token);
    } else {
      console.warn('[FCM] getToken returned empty — check SW console for init errors.');
    }
  } catch (err) {
    console.error('[FCM] Setup failed:', err);
  }
}
