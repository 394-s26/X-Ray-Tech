import { getMessaging, getToken, onMessage } from "firebase/messaging";

const NOTIFY_AFTER_LOGIN_KEY = 'xray-tech:notify-permission-after-login';

/**
 * Call after a successful sign-in on the login page so the dashboard can
 * prompt once (including users who still complete account setup first).
 */
export function markNotificationPermissionPromptAfterLogin(): void {
  try {
    sessionStorage.setItem(NOTIFY_AFTER_LOGIN_KEY, '1');
  } catch {
    /* quota / private mode */
  }
}

/** Returns true once, then clears the flag. */
export function consumeNotificationPermissionPromptAfterLogin(): boolean {
  try {
    if (!sessionStorage.getItem(NOTIFY_AFTER_LOGIN_KEY)) return false;
    sessionStorage.removeItem(NOTIFY_AFTER_LOGIN_KEY);
    return true;
  } catch {
    return false;
  }
}

const messaging = getMessaging();

onMessage(messaging, (payload) => {
  console.log('Received foreground payload:', payload);
  alert(`Notification: ${payload.notification?.title}\n${payload.notification?.body}`);
});

/**
 * Prompts for Web Notification permission only when the user has not
 * already granted or denied (browser "default" state).
 */
export function requestNotificationPermissionIfDefault(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  void Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // 2. Now retrieve the token
      getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_ID })
        .then((currentToken) => {
          if (currentToken) {
            // This is your actual token! Print it, save it, or send it to your server.
            console.log('Your FCM Registration Token:', currentToken);

            
          } else {
            console.log('No registration token available.');
          }
        })
        .catch((err) => {
          console.error('An error occurred while retrieving token. ', err);
        });
  
    } else {
      console.log('Unable to get permission to notify.');
    }
  });;
}
