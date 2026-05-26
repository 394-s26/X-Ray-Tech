import { useEffect, useRef, useState } from 'react';
import type { AppUser } from '../types/auth';
import { BellIcon } from '../services/svgIcons';
import { useInAppNotifications } from '../hooks/useInAppNotifications';
import InAppNotificationList from './InAppNotificationList';

interface NotificationBellProps {
  appUser: AppUser;
}

function badgeLabel(count: number): string {
  if (count <= 0) return '';
  return count > 9 ? '9+' : String(count);
}

export default function NotificationBell({ appUser }: NotificationBellProps) {
  const { notifications, unreadCount, dismiss, loading } = useInAppNotifications(appUser);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = badgeLabel(unreadCount);

  return (
    <div className="notification-bell-root relative" ref={rootRef}>
      <button
        type="button"
        className="navbar-bell"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount > 9 ? 'more than 9' : unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon size={18} />
        {!loading && unreadCount > 0 && (
          <span className="navbar-bell__badge" aria-hidden="true">
            {label}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-bell-panel absolute right-0 top-[calc(100%+10px)] z-[60] w-[min(calc(100vw-1rem),22rem)] sm:w-[22rem] rounded-xl border border-gray-200 bg-[var(--paper)] shadow-lg dark:border-[var(--ink-700)] dark:bg-[#14111F] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          role="dialog"
          aria-label="In-app notifications"
        >
          <div className="px-3 py-2.5 border-b border-[var(--ink-200)] dark:border-[var(--ink-700)] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-600)] dark:text-[var(--ink-400)]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="font-mono-brand text-[11px] font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
                {unreadCount > 9 ? '9+' : unreadCount} active
              </span>
            )}
          </div>
          <InAppNotificationList notifications={notifications} onDismiss={dismiss} />
        </div>
      )}
    </div>
  );
}
