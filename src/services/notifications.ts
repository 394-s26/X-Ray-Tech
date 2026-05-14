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

/**
 * Prompts for Web Notification permission only when the user has not
 * already granted or denied (browser "default" state).
 */
export function requestNotificationPermissionIfDefault(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  void Notification.requestPermission();
}
