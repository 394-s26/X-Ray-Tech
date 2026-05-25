import { useMemo } from 'react';
import { useCertifications } from '../hooks/useCertifications';
import { useSetupReminder } from '../components/setupReminderContext';
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
import iemaLogoBlack from '../assets/iemablacktext.png';
import iemaLogoWhite from '../assets/iemawhitetext.png';
import arrtLogoBlack from '../assets/arrtblacktext.png';
import arrtLogoWhite from '../assets/arrtwhitetext.png';

const PER_LICENSE = 24;

function formatRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  return `${fmt(start)} to ${fmt(end)}`;
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

interface CycleRowProps {
  cycle: CycleSummary;
  hours: number;
}

function CycleRow({ cycle, hours }: CycleRowProps) {
  const met = hours >= PER_LICENSE;
  const cappedPct = Math.min(100, (hours / PER_LICENSE) * 100);
  const barColor = met ? 'var(--success-600)' : 'var(--brand-600)';
  return (
    <li className="flex flex-col gap-2 py-4 border-t border-[var(--ink-200)] first:border-t-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono-brand text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border ${statusTone(cycle)}`}>
            {statusLabel(cycle)}
          </span>
          <span className="font-mono-brand text-[11px] text-[var(--ink-700)] tracking-wide truncate">
            {formatRange(cycle.startISO, cycle.endISO)}
          </span>
        </div>
        <span className="font-mono-brand text-sm font-semibold text-[var(--ink-900)] whitespace-nowrap">
          {Math.round(hours)}/{PER_LICENSE}h
          {met && <span className="ml-2 text-[var(--success-600)]">✓</span>}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--ink-200)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${cappedPct}%`, background: barColor, transition: 'width 0.6s ease-out' }}
        />
      </div>
    </li>
  );
}

interface LicenseHistoryProps {
  name: 'IEMA' | 'ARRT';
  cycles: CycleSummary[];
  certifications: Certification[];
  logoLight: string;
  logoDark: string;
  isSetup: boolean;
  onCompleteSetup: () => void;
}

function LicenseHistory({
  name,
  cycles,
  certifications,
  logoLight,
  logoDark,
  isSetup,
  onCompleteSetup,
}: LicenseHistoryProps) {
  const category = name as CertificateCategory;
  const newestFirst = [...cycles].reverse();

  return (
    <section className="nb-card p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-[var(--ink-900)]">{name} cycles</h2>
        <span className="inline-flex items-center justify-center shrink-0 rounded-md px-1 py-1 bg-[#e5e3ec] dark:bg-[#3D3F5C]">
          <img src={logoLight} alt={name} className="h-4 w-auto object-contain block dark:hidden" />
          <img src={logoDark} alt={name} className="h-4 w-auto object-contain hidden dark:block" />
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
      ) : newestFirst.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No cycles to display.</p>
      ) : (
        <ul className="flex flex-col">
          {newestFirst.map((cycle) => {
            const hours = creditsInCycle(certifications, category, cycle);
            return <CycleRow key={cycle.startISO} cycle={cycle} hours={hours} />;
          })}
        </ul>
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
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <p className="overline text-[var(--brand-600)] mb-4">License history</p>
      <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ink-900)] leading-tight mb-2">
        Cycles
      </h1>
      <p className="text-sm lg:text-base text-[var(--ink-700)] mb-7">
        Every IEMA and ARRT cycle you&rsquo;ve worked through, with the CE hours that landed in each. New cycles roll forward automatically once the previous one closes.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <LicenseHistory
          name="IEMA"
          cycles={iemaCycles}
          certifications={certifications}
          logoLight={iemaLogoBlack}
          logoDark={iemaLogoWhite}
          isSetup={isIemaSetup(appUser)}
          onCompleteSetup={openSetupModal}
        />
        <LicenseHistory
          name="ARRT"
          cycles={arrtCycles}
          certifications={certifications}
          logoLight={arrtLogoBlack}
          logoDark={arrtLogoWhite}
          isSetup={isArrtSetup(appUser)}
          onCompleteSetup={openSetupModal}
        />
      </div>
    </main>
  );
}
