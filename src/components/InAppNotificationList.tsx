import { Link } from 'react-router-dom';
import type { InAppNotification } from '../types/notifications';

export interface InAppNotificationListProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
  /** Screen reader label for the dismiss control */
  dismissLabel?: string;
  emptyMessage?: string;
}

function severityStyles(severity: InAppNotification['severity']): string {
  switch (severity) {
    case 'urgent':
      return 'border-l-[var(--danger-600)] bg-[color-mix(in_srgb,var(--danger-600)_6%,transparent)]';
    case 'warning':
      return 'border-l-[var(--warn-600)] bg-[color-mix(in_srgb,var(--warn-600)_8%,transparent)]';
    default:
      return 'border-l-[var(--brand-500)] bg-[var(--surface)]';
  }
}

export default function InAppNotificationList({
  notifications,
  onDismiss,
  dismissLabel = 'Dismiss notification',
  emptyMessage = "You're all caught up.",
}: InAppNotificationListProps) {
  if (notifications.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-500)] px-4 py-8 text-center font-medium">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className="flex flex-col max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain"
      role="list"
    >
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`border-b border-[var(--ink-200)] dark:border-[var(--ink-700)] border-l-4 pl-3 pr-2 py-3 last:border-b-0 ${severityStyles(n.severity)}`}
          role="listitem"
        >
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {n.scope && (
                  <span className="font-mono-brand text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border border-[var(--ink-300)] text-[var(--ink-600)] dark:text-[var(--ink-300)] shrink-0">
                    {n.scope}
                  </span>
                )}
                <p className="text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] leading-snug">
                  {n.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--ink-600)] dark:text-[var(--ink-400)] leading-relaxed">
                {n.body}
              </p>
              {n.href && (
                <Link
                  to={n.href}
                  className="inline-block mt-2 text-xs font-semibold text-[var(--brand-700)] hover:underline dark:text-[var(--brand-300)]"
                >
                  Open →
                </Link>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 mt-0.5 px-2 py-1 text-[11px] font-semibold rounded-lg border border-[var(--ink-300)] text-[var(--ink-600)] hover:bg-[var(--brand-50)] hover:border-[var(--ink-900)] dark:border-[var(--ink-600)] dark:text-[var(--ink-300)] dark:hover:bg-[rgba(91,63,228,0.15)]"
              onClick={() => onDismiss(n.id)}
              aria-label={`${dismissLabel}: ${n.title}`}
            >
              Dismiss
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
