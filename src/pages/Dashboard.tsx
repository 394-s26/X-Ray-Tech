import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '../services/svgIcons';
import { useCertifications } from '../hooks/useCertifications';
import type { Certification, CertificateCategory } from '../types/certification';
import type { AppUser } from '../types/auth';
import { useSetupReminder } from '../components/setupReminderContext';
import arrtLogoWhite from '../assets/arrtwhitetext.png';
import iemaLogoWhite from '../assets/iemawhitetext.png';
import arrtLogoBlack from '../assets/arrtblacktext.png';
import iemaLogoBlack from '../assets/iemablacktext.png';
import { consumeNotificationPermissionPromptAfterLogin, requestNotificationPermissionIfDefault } from '../services/notifications';
import {
  PER_LICENSE,
  computeArrtCycle,
  computeIemaCycle,
  creditsInCycle,
  isArrtSetup,
  isIemaSetup,
  type CycleWindow,
} from '../utils/cycles';

const COMBINED_TOTAL = 48;

// ── Helpers ──────────────────────────────────────────────────

function clampPct(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + 'T00:00:00');
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
}

function formatBriefDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
}

function formatRenewalDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function formatCycleRange(startISO: string, endISO: string): string {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00')
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      .toUpperCase();
  return `${fmt(startISO)} TO ${fmt(endISO)}`;
}

function formatProbationDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(days: number): { value: string; unit: string } {
  if (days < 0) return { value: '0', unit: 'days' };
  if (days < 60) return { value: String(days), unit: days === 1 ? 'day' : 'days' };
  if (days < 365) {
    const months = Math.round(days / 30);
    return { value: String(months), unit: months === 1 ? 'month' : 'months' };
  }
  const years = days / 365;
  return { value: years.toFixed(1), unit: years === 1 ? 'year' : 'years' };
}

function pluralizeHours(value: number): string {
  return value === 1 ? 'hr' : 'hrs';
}

/** Returns the soft-brutalist tint class based on days remaining. */
type Tint = 'tint-rose' | 'tint-sun' | 'tint-mint';
function urgencyTint(days: number): Tint {
  if (days < 90)  return 'tint-rose';
  if (days < 365) return 'tint-sun';
  return 'tint-mint';
}

// ── Donut ────────────────────────────────────────────────────

interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  percent: number;
  segments?: DonutSegment[];
  total?: number;
  label?: React.ReactNode;
  size?: number;
  strokeWidth?: number;
}

function Donut({ percent, segments, total, label, size = 88, strokeWidth = 11 }: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = clampPct(percent);

  let arcs: { color: string; dasharray: string; dashoffset: number }[] = [];
  if (segments && total && total > 0) {
    let cumulative = 0;
    arcs = segments.map((seg) => {
      const portion = clampPct((seg.value / total) * 100) / 100;
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

// ── Top stat cards ───────────────────────────────────────────

const IEMA_COLOR = 'var(--brand-600)';
const ARRT_COLOR = '#a78ef3';

interface CePointsCardProps {
  iemaHours: number;
  arrtHours: number;
  iemaSetup: boolean;
  arrtSetup: boolean;
}

interface LicenseDonutProps {
  label: 'IEMA' | 'ARRT';
  hours: number;
  setup: boolean;
  color: string;
}

function LicenseDonut({ label, hours, setup, color }: LicenseDonutProps) {
  const capped = setup ? Math.min(hours, PER_LICENSE) : 0;
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <span className="font-mono-brand text-[11px] font-semibold tracking-wide text-[var(--ink-700)]">
        {label}
      </span>
      <Donut
        size={76}
        strokeWidth={10}
        percent={0}
        total={setup ? PER_LICENSE : undefined}
        segments={setup ? [{ value: capped, color }] : undefined}
        label={
          setup ? (
            <>
              {Math.round(hours)}
              <span className="text-[var(--ink-300)]">/</span>
              {PER_LICENSE}
            </>
          ) : (
            <span className="text-[var(--ink-400)]">—</span>
          )
        }
      />
    </div>
  );
}

function CePointsCard({ iemaHours, arrtHours, iemaSetup, arrtSetup }: CePointsCardProps) {
  const cappedTotal =
    (iemaSetup ? Math.min(iemaHours, PER_LICENSE) : 0) +
    (arrtSetup ? Math.min(arrtHours, PER_LICENSE) : 0);
  const neitherSetup = !iemaSetup && !arrtSetup;

  return (
    <Link
      to="/reporting"
      className="@container nb-card is-clickable p-5 flex flex-col gap-4 min-w-0 overflow-hidden"
    >
      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">CE points</p>
      <div className="flex-1 flex items-center justify-center gap-10 sm:gap-12 min-w-0">
        <LicenseDonut label="IEMA" hours={iemaHours} setup={iemaSetup} color={IEMA_COLOR} />
        <LicenseDonut label="ARRT" hours={arrtHours} setup={arrtSetup} color={ARRT_COLOR} />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--ink-200)]">
        <span className="text-[11px] text-[var(--ink-500)] flex-1">
          {neitherSetup ? 'Set your cycles to see progress' : 'Combined'}
        </span>
        <span className="font-mono-brand text-xs font-semibold text-[var(--ink-900)]">
          {neitherSetup ? '—' : `${Math.round(cappedTotal)}/${COMBINED_TOTAL}h`}
        </span>
      </div>
    </Link>
  );
}

interface LogoChipProps {
  srcLight?: string;
  srcDark?: string;
  alt?: string;
  tint?: 'tint-paper' | Tint;
}

const LOGO_CHIP_BG: Record<NonNullable<LogoChipProps['tint']>, string> = {
  'tint-mint':  'bg-[#c9d4c0]',
  'tint-rose':  'bg-[#e8c9cb]',
  'tint-sun':   'bg-[#f0e4c2]',
  'tint-paper': 'bg-[#e5e3ec]',
};

function LogoChip({ srcLight, srcDark, alt, tint = 'tint-paper' }: LogoChipProps) {
  const lightBg = LOGO_CHIP_BG[tint] ?? LOGO_CHIP_BG['tint-paper'];
  return (
    <span className={`inline-flex items-center justify-center shrink-0 rounded-md px-1 py-1 ${lightBg} dark:bg-[#3D3F5C]`}>
      {srcLight && (
        <img src={srcLight} alt={alt ?? ''} className="h-4 w-auto object-contain block dark:hidden" />
      )}
      {srcDark && (
        <img src={srcDark} alt={alt ?? ''} className="h-4 w-auto object-contain hidden dark:block" />
      )}
    </span>
  );
}

interface LicenseRenewalCardProps {
  title: string;
  cycle: CycleWindow | null;
  logoLight: string;
  logoDark: string;
  logoAlt: string;
  notSetLabel: string;
  probationEndsISO?: string | null;
}

function LicenseRenewalCard({
  title,
  cycle,
  logoLight,
  logoDark,
  logoAlt,
  notSetLabel,
  probationEndsISO,
}: LicenseRenewalCardProps) {
  const tint: 'tint-paper' | Tint = cycle == null ? 'tint-paper' : urgencyTint(cycle.daysRemaining);
  const duration = cycle ? formatDuration(Math.max(0, cycle.daysRemaining)) : null;
  return (
    <div className={`nb-card ${tint} p-5 flex flex-col gap-4 min-w-0`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{title}</p>
          {cycle && (
            <p className="font-mono-brand text-[10px] tracking-wide text-[var(--ink-700)] mt-0.5">
              {formatCycleRange(cycle.startISO, cycle.endISO)}
            </p>
          )}
        </div>
        <LogoChip srcLight={logoLight} srcDark={logoDark} alt={logoAlt} tint={tint} />
      </div>
      {probationEndsISO && (
        <span className="self-start inline-flex items-center text-[10px] font-mono-brand tracking-wide uppercase px-1.5 py-0.5 rounded border border-[var(--danger-600)] text-[var(--danger-600)]">
          On probation through {formatProbationDate(probationEndsISO)}
        </span>
      )}
      <div className="flex-1 flex items-end gap-2">
        {duration ? (
          <>
            <span className="font-mono-brand text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-900)] leading-none">
              {duration.value}
            </span>
            <span className="font-mono-brand text-2xl sm:text-3xl font-semibold text-[var(--ink-900)] leading-none mb-0.5">
              {duration.unit}
            </span>
          </>
        ) : (
          <span className="font-mono-brand text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-400)] leading-none">—</span>
        )}
      </div>
      <p className="font-mono-brand text-[11px] text-[var(--ink-700)] tracking-wide">
        {cycle ? `RENEWS ${formatRenewalDate(cycle.endISO)}` : notSetLabel}
      </p>
    </div>
  );
}

// ── Lower lists ──────────────────────────────────────────────

function CategoryBadge({ category }: { category: CertificateCategory | string }) {
  return (
    <span className="font-mono-brand text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded border border-[var(--ink-200)] text-[var(--ink-700)] bg-[var(--paper)]">
      {category}
    </span>
  );
}

function RecentCertifications({ certifications }: { certifications: Certification[] }) {
  const recent = useMemo(() => {
    return [...certifications]
      .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
      .slice(0, 5);
  }, [certifications]);

  return (
    <div className="nb-card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
          Recent certifications
          <span className="ml-2 text-xs font-normal text-[var(--ink-500)]">this cycle</span>
        </h3>
        <Link to="/certificates" className="text-xs font-medium text-[var(--brand-700)] hover:underline whitespace-nowrap">
          See all {certifications.length}{' '}›
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-[var(--ink-400)]">No certifications logged yet.</p>
      ) : (
        <ul className="flex flex-col">
          {recent.map((cert) => {
            const category = cert.categories[0] ?? '';
            return (
              <li key={cert.id} className="flex items-center gap-3 py-2 border-t border-[var(--ink-200)] first:border-t-0">
                <span className="font-mono-brand text-[11px] text-[var(--ink-500)] w-12 shrink-0 uppercase">
                  {formatBriefDate(cert.completedDate)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-900)] truncate">{cert.certificateName}</p>
                  <p className="text-[11px] text-[var(--ink-500)] truncate">{cert.providerName || category}</p>
                </div>
                {category && <CategoryBadge category={category} />}
                <span className="font-mono-brand text-xs font-semibold text-[var(--ink-700)] w-14 text-right shrink-0">
                  {Math.round(cert.ceCredits)} {pluralizeHours(Math.round(cert.ceCredits))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Upcoming({ certifications }: { certifications: Certification[] }) {
  const upcoming = useMemo(() => {
    return [...certifications]
      .filter((c) => {
        const d = daysUntil(c.expirationDate);
        return d >= 0 && d <= 90;
      })
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))
      .slice(0, 5);
  }, [certifications]);

  return (
    <div className="nb-card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
          Upcoming
          <span className="ml-2 text-xs font-normal text-[var(--ink-500)]">next 90 days</span>
        </h3>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-[var(--ink-400)]">Nothing renews in the next 90 days.</p>
      ) : (
        <ul className="flex flex-col">
          {upcoming.map((cert) => {
            const days = daysUntil(cert.expirationDate);
            const tier = days < 30 ? 'urgent' : days < 60 ? 'soon' : 'ok';
            const dotClass =
              tier === 'urgent'
                ? 'bg-[var(--danger-600)]'
                : tier === 'soon'
                  ? 'bg-[var(--warn-600)]'
                  : 'bg-[var(--success-600)]';
            const badgeClass =
              tier === 'urgent'
                ? 'text-[var(--danger-600)] border-[var(--danger-600)]'
                : tier === 'soon'
                  ? 'text-[var(--warn-600)] border-[var(--warn-600)]'
                  : 'text-[var(--success-600)] border-[var(--success-600)]';
            const badgeLabel = tier === 'urgent' ? 'Urgent' : tier === 'soon' ? 'Soon' : 'On track';
            const category = cert.categories[0] ?? '';
            return (
              <li key={cert.id} className="flex items-center gap-3 py-2 border-t border-[var(--ink-200)] first:border-t-0">
                <span className="font-mono-brand text-[11px] text-[var(--ink-500)] w-12 shrink-0 uppercase">
                  {formatBriefDate(cert.expirationDate)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-900)] truncate">{cert.certificateName}</p>
                  <p className="text-[11px] text-[var(--ink-500)] truncate">
                    {category}
                    {cert.ceCredits ? <> · {Math.round(cert.ceCredits)} {pluralizeHours(Math.round(cert.ceCredits))}</> : null}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[var(--paper)] ${badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {badgeLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

interface DashboardProps {
  appUser: AppUser;
}

export default function Dashboard({ appUser }: DashboardProps) {

  useEffect(() => {
    if (!consumeNotificationPermissionPromptAfterLogin()) return;
    void requestNotificationPermissionIfDefault();
  }, []);

  const { openModal: openSetupModal } = useSetupReminder();
  const { certifications, loading } = useCertifications();

  const iemaSetup = isIemaSetup(appUser);
  const arrtSetup = isArrtSetup(appUser);
  const bothSetup = iemaSetup && arrtSetup;

  const iemaCycle = useMemo(() => computeIemaCycle(appUser), [appUser]);
  const arrtCycle = useMemo(() => computeArrtCycle(appUser), [appUser]);

  const iemaHours = useMemo(() => {
    if (!iemaCycle) return 0;
    return creditsInCycle(certifications, 'IEMA', iemaCycle, appUser);
  }, [certifications, iemaCycle, appUser]);

  const arrtHours = useMemo(() => {
    if (!arrtCycle) return 0;
    return creditsInCycle(certifications, 'ARRT', arrtCycle, appUser);
  }, [certifications, arrtCycle, appUser]);

  const firstName = appUser.firstName?.trim() || appUser.username || 'there';

  const cappedIema = iemaSetup ? Math.min(iemaHours, PER_LICENSE) : 0;
  const cappedArrt = arrtSetup ? Math.min(arrtHours, PER_LICENSE) : 0;
  const iemaComplete = iemaSetup && iemaHours >= PER_LICENSE;
  const arrtComplete = arrtSetup && arrtHours >= PER_LICENSE;

  const greeting = (() => {
    if (!bothSetup) return `Welcome, ${firstName}.`;
    if (iemaComplete && arrtComplete) return `You're done, ${firstName}.`;
    const combinedPct = ((cappedIema + cappedArrt) / COMBINED_TOTAL) * 100;
    if (combinedPct >= 75) return `You're on track, ${firstName}.`;
    if (combinedPct >= 50) return `Halfway there, ${firstName}.`;
    return `Let's catch up, ${firstName}.`;
  })();

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-5">
        <span className="inline-block w-8 h-8 rounded-full border-2 border-[var(--brand-600)] border-t-transparent animate-spin" />
      </main>
    );
  }

  const iemaRemaining = Math.max(0, PER_LICENSE - Math.round(iemaHours));
  const arrtRemaining = Math.max(0, PER_LICENSE - Math.round(arrtHours));

  const renderSubline = () => {
    if (!iemaSetup && !arrtSetup) {
      return (
        <>
          Track your IEMA and ARRT cycles separately.{' '}
          <button type="button" onClick={openSetupModal} className="nb-link-accent">
            Complete setup
          </button>{' '}
          to get started.
        </>
      );
    }
    if (iemaSetup && !arrtSetup) {
      return (
        <>
          <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{Math.round(iemaHours)}</span> of{' '}
          <span className="font-mono-brand font-semibold text-[var(--ink-900)]">24</span> IEMA hours logged this cycle.{' '}
          <button type="button" onClick={openSetupModal} className="nb-link-accent">
            Finish setup
          </button>{' '}
          to track ARRT too.
        </>
      );
    }
    if (arrtSetup && !iemaSetup) {
      return (
        <>
          <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{Math.round(arrtHours)}</span> of{' '}
          <span className="font-mono-brand font-semibold text-[var(--ink-900)]">24</span> ARRT hours logged this cycle.{' '}
          <button type="button" onClick={openSetupModal} className="nb-link-accent">
            Finish setup
          </button>{' '}
          to track IEMA too.
        </>
      );
    }
    if (iemaComplete && arrtComplete) {
      return <>You&rsquo;ve met the 24 hour requirement on both licenses.</>;
    }
    return (
      <>
        <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{Math.round(iemaHours)}</span> of{' '}
        <span className="font-mono-brand font-semibold text-[var(--ink-900)]">24</span> IEMA hours and{' '}
        <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{Math.round(arrtHours)}</span> of{' '}
        <span className="font-mono-brand font-semibold text-[var(--ink-900)]">24</span> ARRT hours logged.{' '}
        {iemaRemaining > 0 && arrtRemaining > 0 && (
          <>
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{iemaRemaining}</span> IEMA and{' '}
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{arrtRemaining}</span> ARRT to go.
          </>
        )}
        {iemaRemaining > 0 && arrtRemaining === 0 && (
          <>
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{iemaRemaining}</span> IEMA to go. ARRT is done.
          </>
        )}
        {arrtRemaining > 0 && iemaRemaining === 0 && (
          <>
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{arrtRemaining}</span> ARRT to go. IEMA is done.
          </>
        )}
      </>
    );
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      {/* Header */}
      {bothSetup && iemaCycle && arrtCycle && (
        <p className="overline text-[var(--brand-600)] mb-4">
          IEMA {new Date(iemaCycle.startISO + 'T00:00:00').getFullYear()} to {new Date(iemaCycle.endISO + 'T00:00:00').getFullYear()}
          <span className="mx-2 text-[var(--ink-300)]">·</span>
          ARRT {new Date(arrtCycle.startISO + 'T00:00:00').getFullYear()} to {new Date(arrtCycle.endISO + 'T00:00:00').getFullYear()}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-7">
        <div className="min-w-0">
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ink-900)] leading-tight">
            {greeting}
          </h1>
          <p className="mt-2 text-sm lg:text-base text-[var(--ink-700)]">
            {renderSubline()}
          </p>
        </div>
        <div className="flex gap-2 self-start lg:self-auto shrink-0 flex-wrap">
          <Link
            to="/certificates/new"
            className="nb-btn"
          >
            <PlusIcon size={16} />
            Add certification
          </Link>
        </div>
      </div>

      {/* Top stat row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        <CePointsCard
          iemaHours={iemaHours}
          arrtHours={arrtHours}
          iemaSetup={iemaSetup}
          arrtSetup={arrtSetup}
        />
        <LicenseRenewalCard
          title="New IEMA Cycle In"
          cycle={iemaCycle}
          logoLight={iemaLogoBlack}
          logoDark={iemaLogoWhite}
          logoAlt="IEMA"
          notSetLabel="IEMA CYCLE NOT SET"
        />
        <LicenseRenewalCard
          title="New ARRT Cycle In"
          cycle={arrtCycle}
          logoLight={arrtLogoBlack}
          logoDark={arrtLogoWhite}
          logoAlt="ARRT"
          notSetLabel="ARRT CYCLE NOT SET"
          probationEndsISO={arrtCycle?.isOnProbation ? arrtCycle.probationEndsISO : null}
        />
      </section>

      {/* Bottom lists */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mt-5">
        <RecentCertifications certifications={certifications} />
        <Upcoming certifications={certifications} />
      </section>
    </main>
  );
}
