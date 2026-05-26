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

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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
        <>
          <button
            type="button"
            className="notification-bell-scrim fixed inset-0 z-[55] bg-[rgba(14,11,31,0.35)] lg:hidden"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            className="notification-bell-panel fixed left-4 right-4 top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-[60] flex max-h-[min(70dvh,calc(100dvh-4.5rem-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper)] shadow-[0_4px_20px_rgba(14,11,31,0.1),0_1px_3px_rgba(14,11,31,0.06)] dark:border-[var(--ink-700)] dark:bg-[#14111F] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.3)] lg:absolute lg:left-auto lg:right-0 lg:top-[calc(100%+10px)] lg:w-[min(calc(100vw-2rem),22rem)] lg:max-h-none"
            role="dialog"
            aria-label="In-app notifications"
          >
            <div className="shrink-0 px-3 py-2.5 border-b border-[var(--ink-200)] dark:border-[var(--ink-700)] flex items-center justify-between gap-2">
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
        </>
      )}
    </div>
  );
}
