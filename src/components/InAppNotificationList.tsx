import { useCallback, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { InAppNotification } from '../types/notifications';

export interface InAppNotificationListProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
  /** Screen reader label for the dismiss control */
  dismissLabel?: string;
  emptyMessage?: string;
}

/** Beyond this, offer expand/collapse (approx. 2 short lines of body). */
const BODY_COLLAPSE_CHARS = 72;
const TITLE_COLLAPSE_CHARS = 44;

function needsExpandToggle(n: InAppNotification): boolean {
  return n.body.length > BODY_COLLAPSE_CHARS || n.title.length > TITLE_COLLAPSE_CHARS;
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
  const baseId = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-500)] px-4 py-8 text-center font-medium">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:max-h-[min(70vh,420px)]"
      role="list"
    >
      {notifications.map((n) => {
        const expandable = needsExpandToggle(n);
        const isOpen = expanded[n.id] === true;
        const regionId = `${baseId}-${n.id}-details`;

        return (
          <li
            key={n.id}
            className={`border-b border-[var(--ink-200)] dark:border-[var(--ink-700)] border-l-4 px-3 py-3 last:border-b-0 sm:px-2.5 sm:py-2 ${severityStyles(n.severity)}`}
            role="listitem"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {n.scope && (
                    <span className="font-mono-brand text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border border-[var(--ink-300)] text-[var(--ink-600)] dark:text-[var(--ink-300)] shrink-0">
                      {n.scope}
                    </span>
                  )}
                  <p
                    id={`${regionId}-title`}
                    className={`text-[13px] font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] leading-snug ${
                      expandable && !isOpen ? 'line-clamp-1 min-w-0 flex-1' : 'min-w-0 flex-1'
                    }`}
                  >
                    {n.title}
                  </p>
                </div>

                <p
                  id={regionId}
                  className="text-xs leading-snug text-[var(--ink-600)] dark:text-[var(--ink-400)]"
                >
                  {expandable && !isOpen ? `${n.body.slice(0, 30)}...` : n.body}
                </p>

                {(expandable || n.href) && (
                  <div className="mt-1 flex min-w-0 w-full flex-wrap items-baseline gap-x-3 gap-y-1">
                    {expandable && (
                      <button
                        type="button"
                        className="inline-flex items-center text-left text-[11px] font-semibold leading-none text-[var(--brand-700)] hover:underline dark:text-[var(--brand-300)]"
                        aria-expanded={isOpen}
                        aria-controls={regionId}
                        onClick={() => toggleExpanded(n.id)}
                      >
                        {isOpen ? 'Show less' : 'Show full message'}
                      </button>
                    )}
                    {n.href && (
                      <Link
                        to={n.href}
                        className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold leading-none text-[var(--brand-700)] hover:underline dark:text-[var(--brand-300)]"
                      >
                        <span>Open</span>
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="w-full shrink-0 px-3 py-2.5 text-xs font-semibold rounded-lg border border-[var(--ink-300)] text-[var(--ink-600)] hover:bg-[var(--brand-50)] hover:border-[var(--ink-900)] dark:border-[var(--ink-600)] dark:text-[var(--ink-300)] dark:hover:bg-[rgba(91,63,228,0.15)] sm:w-auto sm:px-2 sm:py-1 sm:text-[11px]"
                onClick={() => onDismiss(n.id)}
                aria-label={`${dismissLabel}: ${n.title}`}
              >
                Dismiss
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
