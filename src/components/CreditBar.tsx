import { PER_LICENSE } from '../utils/cycles';

interface CreditBarProps {
  /** Credits already used in the cycle from other certs. */
  used: number;
  /** Preview credits being added by this cert (0 if none). */
  incoming?: number;
  /** Cap for the cycle. Defaults to PER_LICENSE (24). */
  cap?: number;
  /** Optional accessible label. */
  label?: string;
}

export function CreditBar({ used, incoming = 0, cap = PER_LICENSE, label }: CreditBarProps) {
  const total = used + incoming;
  // Scale the bar so overflow is visible — extend domain to whichever is bigger.
  const domain = Math.max(cap, total) || cap;
  const usedPct = Math.min(100, (used / domain) * 100);
  const incomingPct = Math.min(100, (Math.max(0, total - used) / domain) * 100);
  const capTickPct = Math.min(100, (cap / domain) * 100);
  const overflow = total > cap;
  const usedColor = used >= cap ? 'var(--success-600)' : 'var(--brand-600)';
  const incomingColor = overflow ? 'var(--amber-500, #f59e0b)' : 'var(--brand-400, var(--brand-600))';

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div
        className="relative w-full h-2 rounded-full bg-[var(--ink-200)] dark:bg-[var(--ink-700)] overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(total)}
        aria-valuemin={0}
        aria-valuemax={cap}
      >
        {/* Used segment (solid) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${usedPct}%`,
            background: usedColor,
            transition: 'width 0.3s ease-out',
          }}
        />
        {/* Incoming preview segment */}
        {incoming > 0 && (
          <div
            className="absolute inset-y-0 rounded-r-full"
            style={{
              left: `${usedPct}%`,
              width: `${incomingPct}%`,
              background: incomingColor,
              opacity: overflow ? 0.85 : 0.55,
              transition: 'width 0.3s ease-out, left 0.3s ease-out',
            }}
          />
        )}
        {/* Cap tick */}
        <div
          aria-hidden
          className="absolute inset-y-0 w-px bg-[var(--ink-900)] dark:bg-[var(--ink-100)] opacity-60"
          style={{ left: `${capTickPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono-brand text-[11px] text-[var(--ink-700)] dark:text-[var(--ink-300)] tabular-nums">
        <span>
          {Math.round(used)}
          {incoming > 0 && (
            <>
              {' + '}
              <span style={{ color: incomingColor }}>{Math.round(incoming)}</span>
            </>
          )}
          <span className="text-[var(--ink-500)]">{` / ${cap}h`}</span>
        </span>
        {overflow && (
          <span className="text-[var(--amber-600,#d97706)] font-semibold">
            +{Math.round(total - cap)} over cap
          </span>
        )}
      </div>
    </div>
  );
}
