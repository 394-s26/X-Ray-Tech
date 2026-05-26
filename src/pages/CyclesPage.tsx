import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useCertifications } from '../hooks/useCertifications';
import { useSetupReminder } from '../components/setupReminderContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { ArrowLeftIcon, ArrowRightIcon } from '../services/svgIcons';
import type { AppUser } from '../types/auth';
import type { Certification, CertificateCategory } from '../types/certification';
import {
  creditsInCycle,
  isArrtSetup,
  isIemaSetup,
  listArrtCycles,
  listIemaCycles,
  type CycleSummary,
} from '../utils/cycles';
import iemaLogo from '../assets/iema.png';
import arrtLogo from '../assets/arrt.png';

const PER_LICENSE = 24;

function formatRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  return `${fmt(start)} → ${fmt(end)}`;
}

function statusLabel(cycle: CycleSummary): string {
  if (cycle.isCurrent) return 'CURRENT';
  if (cycle.isPast) return 'PAST';
  return 'UPCOMING';
}

function statusTone(cycle: CycleSummary): string {
  if (cycle.isCurrent) return 'text-[var(--brand-700)] border-[var(--brand-600)]';
  if (cycle.isPast) return 'text-[var(--ink-500)] border-[var(--ink-300)]';
  return 'text-[var(--ink-700)] border-[var(--ink-200)]';
}

function dotColor(cycle: CycleSummary): string {
  if (cycle.isCurrent) return 'var(--brand-600)';
  if (cycle.isPast) return 'var(--ink-400)';
  return 'var(--ink-300)';
}

interface CycleCardProps {
  cycle: CycleSummary;
  hours: number;
}

function CycleCard({ cycle, hours }: CycleCardProps) {
  const met = hours >= PER_LICENSE;
  const cappedPct = Math.min(100, (hours / PER_LICENSE) * 100);
  const barColor = met ? 'var(--success-600)' : 'var(--brand-600)';
  return (
    <article
      data-cycle-card
      className="flex-shrink-0 w-full sm:w-[calc((100%-2*1rem)/3)] snap-center sm:snap-start flex flex-col gap-3 p-4 rounded-3xl bg-[var(--surface)] dark:bg-[var(--bg-surface)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono-brand text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border ${statusTone(cycle)}`}
        >
          {statusLabel(cycle)}
        </span>
        {met && <span className="text-[var(--success-600)] text-sm">✓</span>}
      </div>
      <div className="font-mono-brand text-[11px] text-[var(--ink-700)] tracking-wide">
        {formatRange(cycle.startISO, cycle.endISO)}
      </div>
      <div className="font-mono-brand text-2xl font-semibold text-[var(--ink-900)]">
        {Math.round(hours)}
        <span className="text-base text-[var(--ink-500)]">/{PER_LICENSE}h</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--ink-200)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${cappedPct}%`, background: barColor, transition: 'width 0.6s ease-out' }}
        />
      </div>
    </article>
  );
}

interface CycleTimelineProps {
  cycles: CycleSummary[];
  certifications: Certification[];
  category: CertificateCategory;
}

function CycleTimeline({ cycles, certifications, category }: CycleTimelineProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    let idx = cycles.findIndex((c) => c.isCurrent);
    if (idx === -1) {
      const lastPast = [...cycles].reverse().findIndex((c) => c.isPast);
      idx = lastPast === -1 ? 0 : cycles.length - 1 - lastPast;
    }
    const cardEl = track.children[idx] as HTMLElement | undefined;
    if (cardEl) {
      const isMobile = window.innerWidth < 640;
      viewport.scrollLeft = isMobile
        ? cardEl.offsetLeft
        : cardEl.offsetLeft - (viewport.clientWidth - cardEl.clientWidth) / 2;
    }
    updateEdges();
  }, [cycles, updateEdges]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => updateEdges();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  if (cycles.length === 0) {
    return <p className="text-sm text-[var(--ink-500)]">No cycles to display.</p>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={atStart}
        aria-label="Previous cycles"
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--ink-300)] dark:bg-[var(--ink-600)] text-[var(--ink-900)] dark:text-[var(--fg)] shadow-sm transition-opacity ${
          atStart ? 'opacity-30 pointer-events-none' : 'opacity-100 hover:bg-[var(--ink-400)] dark:hover:bg-[var(--ink-500)]'
        }`}
      >
        <ArrowLeftIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={atEnd}
        aria-label="Next cycles"
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--ink-300)] dark:bg-[var(--ink-600)] text-[var(--ink-900)] dark:text-[var(--fg)] shadow-sm transition-opacity ${
          atEnd ? 'opacity-30 pointer-events-none' : 'opacity-100 hover:bg-[var(--ink-400)] dark:hover:bg-[var(--ink-500)]'
        }`}
      >
        <ArrowRightIcon size={16} />
      </button>

      <div
        aria-hidden
        className="absolute bottom-[10px] h-[1.5px] bg-[var(--ink-900)] dark:bg-[var(--fg)] pointer-events-none inset-x-0 sm:left-[-100vw] sm:right-[-100vw]"
      />

      <div
        ref={viewportRef}
        className="no-scrollbar overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-12"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div ref={trackRef} className="flex gap-4 pb-6 relative">
          {cycles.map((cycle) => {
            const hours = creditsInCycle(certifications, category, cycle);
            return <CycleCard key={cycle.startISO} cycle={cycle} hours={hours} />;
          })}
        </div>
        <div className="relative flex gap-4 items-center h-5 px-1">
          {cycles.map((cycle) => (
            <div
              key={cycle.startISO}
              className="flex-shrink-0 w-full sm:w-[calc((100%-2*1rem)/3)] flex justify-center relative"
            >
              <span
                className="w-5 h-5 rounded-full border-[2px] border-[var(--paper)] dark:border-[var(--card-bg)]"
                style={{ background: dotColor(cycle) }}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LicenseHistoryProps {
  name: 'IEMA' | 'ARRT';
  cycles: CycleSummary[];
  certifications: Certification[];
  logo: string;
  isSetup: boolean;
  onCompleteSetup: () => void;
}

function LicenseHistory({
  name,
  cycles,
  certifications,
  logo,
  isSetup,
  onCompleteSetup,
}: LicenseHistoryProps) {
  const category = name as CertificateCategory;

  return (
    <section className="p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-lg px-3 py-2 bg-[var(--surface)] dark:bg-[var(--bg-surface)]">
          <img src={logo} alt={`${name} cycles`} className="h-8 w-auto object-contain" />
        </span>
      </div>
      {!isSetup ? (
        <p className="text-sm text-[var(--ink-700)]">
          You haven&rsquo;t set your {name} cycle yet.{' '}
          <button type="button" onClick={onCompleteSetup} className="nb-link-accent">
            Complete setup
          </button>{' '}
          to start tracking it.
        </p>
      ) : (
        <CycleTimeline cycles={cycles} certifications={certifications} category={category} />
      )}
    </section>
  );
}

interface CyclesPageProps {
  appUser: AppUser;
}

export default function CyclesPage({ appUser }: CyclesPageProps) {
  const { openModal: openSetupModal } = useSetupReminder();
  const { certifications, loading } = useCertifications();

  const iemaCycles = useMemo(() => listIemaCycles(appUser), [appUser]);
  const arrtCycles = useMemo(() => listArrtCycles(appUser), [appUser]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-5">
        <span className="inline-block w-8 h-8 rounded-full border-2 border-[var(--brand-600)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto overflow-x-clip">
      <Breadcrumb items={[{ name: 'License history', to: '' }]} />
      <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ink-900)] leading-tight mb-2 mt-4">
        Cycles
      </h1>
      <p className="text-sm lg:text-base text-[var(--ink-700)] mb-7">
        Every IEMA and ARRT cycle you&rsquo;ve worked through, with the CE hours that landed in each. New cycles roll forward automatically once the previous one closes.
      </p>

      <div className="flex flex-col gap-4 lg:gap-5">
        <LicenseHistory
          name="IEMA"
          cycles={iemaCycles}
          certifications={certifications}
          logo={iemaLogo}
          isSetup={isIemaSetup(appUser)}
          onCompleteSetup={openSetupModal}
        />
        <LicenseHistory
          name="ARRT"
          cycles={arrtCycles}
          certifications={certifications}
          logo={arrtLogo}
          isSetup={isArrtSetup(appUser)}
          onCompleteSetup={openSetupModal}
        />
      </div>
    </main>
  );
}
