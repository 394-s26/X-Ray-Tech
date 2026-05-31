import type { ReactNode } from 'react';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  percent: number;
  segments?: DonutSegment[];
  total?: number;
  label?: ReactNode;
  size?: number;
  strokeWidth?: number;
}

function clampPct(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

/**
 * Ring chart. With `segments` + `total` it renders a multi-colour breakdown
 * (each segment an arc proportional to its value); otherwise it falls back to a
 * single `percent` arc. Shared by the Dashboard CE-points card and the
 * Certificate Reporting cycle summaries.
 */
export function Donut({ percent, segments, total, label, size = 88, strokeWidth = 11 }: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = clampPct(percent);

  let arcs: { color: string; dasharray: string; dashoffset: number }[] = [];
  if (segments && total && total > 0) {
    // `cumulative` is kept in [0, 1] and each segment is clamped to the space
    // still left in the ring. Without this, when segments sum past `total`
    // (e.g. 31 pts against a 24 cap) the arcs wrap around and a later segment
    // visually overruns the remainder instead of being truncated at the cap.
    let cumulative = 0;
    arcs = segments.map((seg) => {
      const remaining = Math.max(0, 1 - cumulative);
      const portion = Math.max(0, Math.min(seg.value / total, remaining));
      const arcLength = portion * circumference;
      const arc = {
        color: seg.color,
        dasharray: `${arcLength} ${circumference}`,
        dashoffset: -cumulative * circumference,
      };
      cumulative += portion;
      return arc;
    });
  }

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, flex: `0 0 ${size}px` }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="var(--ink-200)"
        />
        {arcs.length > 0 ? (
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={arc.dasharray}
              strokeDashoffset={arc.dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.6s ease-out, stroke-dashoffset 0.6s ease-out' }}
            />
          ))
        ) : (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--brand-600)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-mono-brand text-sm font-semibold text-[var(--ink-900)]">
          {label ?? `${Math.round(pct)}%`}
        </span>
      </div>
    </div>
  );
}

export default Donut;
