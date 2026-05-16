export type NotificationSeverity = 'info' | 'warning' | 'urgent';

/** In-app notification row — reusable across bell dropdown and future surfaces */
export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  /** In-app route path */
  href?: string;
  /** Short tag (e.g. license or team) */
  scope?: string;
}
