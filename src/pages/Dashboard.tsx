import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, CheckIcon } from '../services/svgIcons';
import { useCertifications } from '../hooks/useCertifications';
import type { Certification } from '../types/certification';

const ARRT_TOTAL = 24;
const IEMA_TOTAL = 24;

function statusMessage(percent: number): string {
  if (percent >= 100) return 'Fully certified!';
  if (percent > 85) return 'Almost there!';
  if (percent > 70) return 'Getting close!';
  return 'Needs work';
}

function clampPct(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

const PURPLE_STOPS: { p: number; color: [number, number, number] }[] = [
  { p: 0,   color: [235, 225, 250] },
  { p: 50,  color: [167, 139, 218] },
  { p: 75,  color: [118,  96, 160] },
  { p: 100, color: [104,  72, 154] },
];

const PURPLE_DEEP_STOPS: { p: number; color: [number, number, number] }[] = [
  { p: 0,   color: [118,  96, 160] },
  { p: 50,  color: [104,  72, 154] },
  { p: 75,  color: [91,   57, 144] },
  { p: 100, color: [78,   42, 132] },
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

function purpleTier(percent: number): string {
  if (percent >= 100) return 'var(--color-primary-light)';
  if (percent >= 75)  return 'var(--color-brand)';
  if (percent >= 50)  return 'var(--color-tertiary)';
  return 'color-mix(in srgb, var(--color-slate-100) 45%, white)';
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
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>

      {showCenter && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-7xl font-black tracking-tight leading-none"
            style={{ color: deep }}
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
      className="group relative w-full h-full text-left rounded-2xl glass-panel hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden p-4 pt-5 flex flex-col gap-2.5"
      style={done ? { boxShadow: '0 6px 20px -8px rgba(100,116,139,0.45)' } : undefined}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary dark:bg-secondary transition-colors" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold tracking-wide text-primary dark:text-slate-200">
          {name}
        </p>
        {done ? (
          <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-white bg-primary dark:bg-secondary px-2 py-1 rounded-full">
            <CheckIcon size={10} />
            Done
          </span>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary dark:text-slate-100">
            {Math.round(pct)}%
          </span>
        )}
      </div>

      <p className="text-[11px] leading-snug text-gray-500 dark:text-slate-300 line-clamp-2 min-h-[2.2em]">
        {fullName}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-300 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary dark:bg-secondary"
            style={{ width: `${pct}%` }}
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

function UpcomingExpirations({ certifications }: { certifications: Certification[] }) {
  const upcoming = useMemo(() => {
    return [...certifications]
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))
      .slice(0, 4);
  }, [certifications]);

  return (
    <div className="rounded-2xl glass-panel p-5 flex flex-col">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500 mb-4">
        Upcoming
      </h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">No certificates yet.</p>
      ) : (
        <ul className="flex flex-col gap-3.5 mb-6">
          {upcoming.map((cert) => {
            const status = tierFromDate(cert.expirationDate);
            const category = cert.categories[0] ?? '';
            return (
              <li key={cert.id} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[status.tier]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary dark:text-slate-100 truncate">
                    {cert.certificateName}
                  </p>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1.5">
                    <span className={`font-semibold ${TIER_TEXT[status.tier]}`}>
                      {status.tier === 'expired'
                        ? `Expired ${formatShortDate(cert.expirationDate)}`
                        : `${formatShortDate(cert.expirationDate)}`}
                    </span>
                    <span className="text-gray-400 dark:text-slate-500">
                      · {category}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        to="/credentials"
        className="global-btn default-btn ounded-full mt-auto text-center"
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
    <div className="rounded-2xl glass-panel p-5 flex flex-col">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500 mb-1">
        Browse courses
      </h3>
      <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-4">
        Find your next certification
      </p>
      <ul className="flex flex-col gap-2.5 mb-5 flex-1">
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
        className="global-btn default-btn outline rounded-full"
      >
        Explore catalog
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { certifications, loading } = useCertifications();

  const arrtCredits = useMemo(
    () =>
      certifications
        .filter((c) => c.categories.includes('ARRT'))
        .reduce((sum, c) => sum + c.ceCredits, 0),
    [certifications],
  );

  const iemaCredits = useMemo(
    () =>
      certifications
        .filter((c) => c.categories.includes('IEMA'))
        .reduce((sum, c) => sum + c.ceCredits, 0),
    [certifications],
  );

  const totalCompleted = arrtCredits + iemaCredits;
  const totalRequired = ARRT_TOTAL + IEMA_TOTAL;
  const percent = totalRequired === 0 ? 0 : (totalCompleted / totalRequired) * 100;

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-4 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-5xl mx-auto flex items-center justify-center">
        <span className="inline-block w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-4 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-5xl mx-auto">
      <section className="flex flex-col items-center">
        <Donut percent={percent} filterId="main-donut" />
        <p
          className="mt-7 text-3xl font-extrabold tracking-tight"
          style={{ color: donutDeepColor(percent) }}
        >
          {statusMessage(percent)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {totalCompleted} of {totalRequired} credits complete
        </p>
      </section>

      <section className="mt-10 w-full lg:max-w-3xl lg:mx-auto grid grid-cols-2 gap-3 lg:gap-4">
        <CertCard
          name="ARRT"
          fullName="American Registry of Radiologic Technologists"
          completed={arrtCredits}
          total={ARRT_TOTAL}
          to="/arrt"
        />
        <CertCard
          name="IEMA"
          fullName="Illinois Emergency Management Agency"
          completed={iemaCredits}
          total={IEMA_TOTAL}
          to="/iema"
        />
      </section>

      <section className="hidden lg:grid lg:grid-cols-2 lg:gap-4 mt-8 lg:max-w-3xl lg:mx-auto">
        <UpcomingExpirations certifications={certifications} />
        <BrowseCourses />
      </section>
    </main>
  );
}
