import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, CheckIcon } from '../services/svgIcons';
import { ARRT_RECORDS, IEMA_RECORDS, type CertRecord } from '../data/certs';

const ARRT_TOTAL = 24;
const IEMA_TOTAL = 12;

function statusMessage(percent: number): string {
  if (percent >= 100) return 'Fully certified!';
  if (percent > 75) return 'Almost there!';
  if (percent > 50) return 'Getting close!';
  return 'Needs work';
}

function clampPct(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

const PURPLE_STOPS: { p: number; color: [number, number, number] }[] = [
  { p: 0, color: [227, 210, 255] },   // #E3D2FF
  { p: 50, color: [197, 163, 255] },  // #C5A3FF
  { p: 75, color: [168, 118, 255] },  // #A876FF
  { p: 100, color: [124, 73, 213] },  // #7C49D5
];

const PURPLE_DEEP_STOPS: { p: number; color: [number, number, number] }[] = [
  { p: 0, color: [128, 105, 165] },   // dusty
  { p: 50, color: [102, 71, 165] },
  { p: 75, color: [88, 53, 170] },
  { p: 100, color: [74, 40, 138] },   // deep
];

function interpolate(stops: typeof PURPLE_STOPS, percent: number): string {
  const p = clampPct(percent);
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i].p) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (p - a.p) / (b.p - a.p);
      const r = Math.round(a.color[0] + t * (b.color[0] - a.color[0]));
      const g = Math.round(a.color[1] + t * (b.color[1] - a.color[1]));
      const bl = Math.round(a.color[2] + t * (b.color[2] - a.color[2]));
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }
  const last = stops[stops.length - 1].color;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

function donutRingColor(percent: number): string {
  return interpolate(PURPLE_STOPS, percent);
}

function donutDeepColor(percent: number): string {
  return interpolate(PURPLE_DEEP_STOPS, percent);
}

// Discrete purple tiers for the ARRT/IEMA cards.
function purpleTier(percent: number): string {
  if (percent >= 100) return '#7C49D5';
  if (percent >= 75) return '#A876FF';
  if (percent >= 50) return '#C5A3FF';
  return '#E3D2FF';
}

interface DonutProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  showCenter?: boolean;
  filterId: string;
}

function Donut({ percent, size = 280, strokeWidth = 26, showCenter = true, filterId }: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = clampPct(percent);
  const offset = circumference * (1 - pct / 100);
  const ring = donutRingColor(pct);
  const deep = donutDeepColor(pct);
  const meetingGoal = pct >= 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor={ring} floodOpacity="0.45" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-slate-700"
          stroke="currentColor"
        />

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy}) translate(0 ${size}) scale(1 -1)`}
          filter={`url(#${filterId})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.6s ease-out' }}
        />
      </svg>

      {showCenter && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-7xl font-black tracking-tight leading-none"
            style={{ color: deep, transition: 'color 0.6s ease-out' }}
          >
            {Math.round(pct)}%
          </span>
          <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-slate-400">
            {meetingGoal ? 'Meeting goal' : 'Not meeting goal'}
          </span>
        </div>
      )}
    </div>
  );
}

interface CertCardProps {
  name: string;
  fullName: string;
  completed: number;
  total: number;
  to: string;
}

function CertCard({ name, fullName, completed, total, to }: CertCardProps) {
  const pct = total === 0 ? 0 : (completed / total) * 100;
  const done = completed >= total;
  const accent = purpleTier(pct);

  return (
    <Link
      to={to}
      className="group relative w-full h-full text-left rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden p-4 pt-5 flex flex-col gap-2.5"
      style={done ? { boxShadow: `0 6px 20px -8px ${accent}` } : undefined}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: accent, transition: 'background 0.4s ease-out' }}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold tracking-wide text-primary dark:text-slate-100">
          {name}
        </p>
        {done ? (
          <span
            className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-white px-2 py-1 rounded-full"
            style={{ background: accent }}
          >
            <CheckIcon size={10} />
            Done
          </span>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            {Math.round(pct)}%
          </span>
        )}
      </div>

      <p className="text-[11px] leading-snug text-gray-500 dark:text-slate-400 line-clamp-2 min-h-[2.2em]">
        {fullName}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: done ? accent : '#6b7280' }}
          >
            {completed}/{total}
          </span>
          <ChevronRightIcon
            size={16}
            className="text-gray-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}

interface DemoSliderProps {
  label: string;
  value: number;
  max: number;
  accent: string;
  onChange: (value: number) => void;
}

function DemoSlider({ label, value, max, accent, onChange }: DemoSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-bold w-12 shrink-0 text-primary dark:text-slate-200">
        {label}
      </label>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: accent }}
        className="flex-1 h-2 cursor-pointer"
      />
      <span
        className="text-xs font-semibold tabular-nums w-12 text-right"
        style={{ color: accent }}
      >
        {value}/{max}
      </span>
    </div>
  );
}

// ── Side widgets (desktop only) ──────────────────────────────

type ExpiryTier = 'expired' | 'urgent' | 'warn' | 'ok';

function tierFromDate(dateString: string): { tier: ExpiryTier; days: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateString + 'T00:00:00');
  const days = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { tier: 'expired', days };
  if (days < 30) return { tier: 'urgent', days };
  if (days < 90) return { tier: 'warn', days };
  return { tier: 'ok', days };
}

const TIER_TEXT: Record<ExpiryTier, string> = {
  expired: 'text-red-600 dark:text-red-400',
  urgent: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-600 dark:text-amber-400',
  ok: 'text-emerald-600 dark:text-emerald-400',
};

const TIER_DOT: Record<ExpiryTier, string> = {
  expired: 'bg-red-500',
  urgent: 'bg-red-500',
  warn: 'bg-amber-500',
  ok: 'bg-emerald-500',
};

function formatShortDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function UpcomingExpirations() {
  const upcoming = useMemo(() => {
    const all: Array<CertRecord & { type: 'ARRT' | 'IEMA' }> = [
      ...ARRT_RECORDS.map((r) => ({ ...r, type: 'ARRT' as const })),
      ...IEMA_RECORDS.map((r) => ({ ...r, type: 'IEMA' as const })),
    ];
    all.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
    return all.slice(0, 4);
  }, []);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500 mb-4">
        Upcoming
      </h3>
      <ul className="flex flex-col gap-3.5">
        {upcoming.map((record) => {
          const status = tierFromDate(record.expiryDate);
          return (
            <li key={record.id} className="flex items-start gap-3">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[status.tier]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary dark:text-slate-100 truncate">
                  {record.name}
                </p>
                <p className="text-[11px] mt-0.5 flex items-center gap-1.5">
                  <span className={`font-semibold ${TIER_TEXT[status.tier]}`}>
                    {status.tier === 'expired'
                      ? `Expired ${formatShortDate(record.expiryDate)}`
                      : `${formatShortDate(record.expiryDate)}`}
                  </span>
                  <span className="text-gray-400 dark:text-slate-500">
                    · {record.type}
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        to="/arrt"
        className="mt-5 block w-full text-center px-3 py-2 rounded-full bg-[#7C49D5] hover:bg-[#6A3CC1] text-white text-xs font-bold tracking-wide transition-colors"
      >
        View all certificates
      </Link>
    </div>
  );
}

const SAMPLE_COURSES = [
  { name: 'Advanced CT Imaging', length: '4 weeks' },
  { name: 'Pediatric Radiography', length: '3 weeks' },
  { name: 'Quality Assurance Methods', length: '2 weeks' },
];

function BrowseCourses() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500 mb-1">
        Browse courses
      </h3>
      <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-4">
        Find your next certification
      </p>
      <ul className="flex flex-col gap-2.5 mb-5">
        {SAMPLE_COURSES.map((course) => (
          <li
            key={course.name}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="font-semibold text-primary dark:text-slate-100 truncate">
              {course.name}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
              {course.length}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="block w-full text-center px-3 py-2 rounded-full border-2 border-[#7C49D5] text-[#7C49D5] dark:text-[#A876FF] dark:border-[#A876FF] hover:bg-[#7C49D5]/10 text-xs font-bold tracking-wide transition-colors"
      >
        Explore catalog
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [arrtCompleted, setArrtCompleted] = useState(ARRT_TOTAL);
  const [iemaCompleted, setIemaCompleted] = useState(IEMA_TOTAL);

  const totalCompleted = arrtCompleted + iemaCompleted;
  const totalRequired = ARRT_TOTAL + IEMA_TOTAL;
  const percent = totalRequired === 0 ? 0 : (totalCompleted / totalRequired) * 100;

  const arrtPct = (arrtCompleted / ARRT_TOTAL) * 100;
  const iemaPct = (iemaCompleted / IEMA_TOTAL) * 100;

  return (
    <main className="min-h-screen pt-24 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-5xl mx-auto">
      <section className="flex flex-col items-center">
        <Donut percent={percent} filterId="main-donut" />
        <p
          className="mt-7 text-3xl font-extrabold tracking-tight"
          style={{ color: donutDeepColor(percent), transition: 'color 0.6s ease-out' }}
        >
          {statusMessage(percent)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {totalCompleted} of {totalRequired} credits complete
        </p>
      </section>

      <section className="mt-10 w-full lg:max-w-4xl lg:mx-auto grid grid-cols-2 gap-3 lg:gap-4">
        <CertCard
          name="ARRT"
          fullName="American Registry of Radiologic Technologists"
          completed={arrtCompleted}
          total={ARRT_TOTAL}
          to="/arrt"
        />
        <CertCard
          name="IEMA"
          fullName="Illinois Emergency Management Agency"
          completed={iemaCompleted}
          total={IEMA_TOTAL}
          to="/iema"
        />
      </section>

      <section className="hidden lg:grid lg:grid-cols-2 lg:gap-4 mt-8">
        <UpcomingExpirations />
        <BrowseCourses />
      </section>

      <section className="mt-10 w-full max-w-md mx-auto flex flex-col gap-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500">
          Demo controls
        </p>
        <DemoSlider
          label="ARRT"
          value={arrtCompleted}
          max={ARRT_TOTAL}
          accent={purpleTier(arrtPct)}
          onChange={setArrtCompleted}
        />
        <DemoSlider
          label="IEMA"
          value={iemaCompleted}
          max={IEMA_TOTAL}
          accent={purpleTier(iemaPct)}
          onChange={setIemaCompleted}
        />
      </section>
    </main>
  );
}
