import { useState } from 'react';
import { ChevronRightIcon, CheckIcon } from '../services/svgIcons';

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

// Pastel red→green ring color for the donut.
function pastelRingColor(percent: number): string {
  const hue = Math.round(1.2 * clampPct(percent));
  return `hsl(${hue}, 65%, 68%)`;
}

function deepStatusColor(percent: number): string {
  const hue = Math.round(1.2 * clampPct(percent));
  return `hsl(${hue}, 50%, 42%)`;
}

// Purple tier palette for the ARRT/IEMA cards — darker = more done.
function purpleTier(percent: number): string {
  if (percent >= 100) return '#7C49D5';
  if (percent >= 75) return '#A876FF';
  if (percent >= 50) return '#C5A3FF';
  return '#E3D2FF';
}

function Donut({ percent }: { percent: number }) {
  const size = 280;
  const strokeWidth = 26;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = clampPct(percent);
  const offset = circumference * (1 - pct / 100);
  const ring = pastelRingColor(pct);
  const deep = deepStatusColor(pct);
  const meetingGoal = pct >= 100;

  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
      <svg viewBox={`0 0 ${size} ${size}`} className="relative w-full h-full overflow-visible">
        <defs>
          <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
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
          filter="url(#donut-glow)"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.6s ease-out' }}
        />
      </svg>

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
    </div>
  );
}

interface CertCardProps {
  name: string;
  fullName: string;
  completed: number;
  total: number;
}

function CertCard({ name, fullName, completed, total }: CertCardProps) {
  const pct = total === 0 ? 0 : (completed / total) * 100;
  const done = completed >= total;
  const accent = purpleTier(pct);

  return (
    <button
      type="button"
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
    </button>
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

export default function Dashboard() {
  const [arrtCompleted, setArrtCompleted] = useState(ARRT_TOTAL);
  const [iemaCompleted, setIemaCompleted] = useState(IEMA_TOTAL);

  const totalCompleted = arrtCompleted + iemaCompleted;
  const totalRequired = ARRT_TOTAL + IEMA_TOTAL;
  const percent = totalRequired === 0 ? 0 : (totalCompleted / totalRequired) * 100;

  const arrtPct = (arrtCompleted / ARRT_TOTAL) * 100;
  const iemaPct = (iemaCompleted / IEMA_TOTAL) * 100;

  return (
    <main className="min-h-screen pt-24 pb-16 px-5 w-full max-w-md mx-auto flex flex-col items-center">
      <section className="relative flex flex-col items-center w-full">
        <Donut percent={percent} />
        <p
          className="mt-7 text-3xl font-extrabold tracking-tight"
          style={{ color: deepStatusColor(percent), transition: 'color 0.6s ease-out' }}
        >
          {statusMessage(percent)}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {totalCompleted} of {totalRequired} credits complete
        </p>
      </section>

      <section className="mt-10 w-full grid grid-cols-2 gap-3">
        <CertCard
          name="ARRT"
          fullName="American Registry of Radiologic Technologists"
          completed={arrtCompleted}
          total={ARRT_TOTAL}
        />
        <CertCard
          name="IEMA"
          fullName="Illinois Emergency Management Agency"
          completed={iemaCompleted}
          total={IEMA_TOTAL}
        />
      </section>

      <section className="mt-10 w-full flex flex-col gap-4 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 p-4">
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
