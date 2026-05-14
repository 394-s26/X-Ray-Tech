import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '../services/svgIcons';
import { useCertifications } from '../hooks/useCertifications';
import type { Certification, CertificateCategory } from '../types/certification';
import type { AppUser } from '../types/auth';
import arrtLogo from '../assets/arrt.png';
import iemaLogo from '../assets/iema.png';

const IEMA_TOTAL = 24;

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

function formatShortDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

function formatDuration(days: number): { value: string; unit: string } {
  if (days < 0) return { value: '0', unit: 'd' };
  if (days < 60) return { value: String(days), unit: 'd' };
  if (days < 365) return { value: String(Math.round(days / 30)), unit: 'mo' };
  return { value: (days / 365).toFixed(1), unit: 'y' };
}

/** Returns the soft-brutalist tint class based on days remaining. */
type Tint = 'tint-rose' | 'tint-sun' | 'tint-mint';
function urgencyTint(days: number): Tint {
  if (days < 90)  return 'tint-rose';
  if (days < 365) return 'tint-sun';
  return 'tint-mint';
}

function statusGreeting(percent: number, firstName: string): string {
  if (percent >= 100) return `You're done, ${firstName}.`;
  if (percent >= 75)  return `You're on track, ${firstName}.`;
  if (percent >= 50)  return `Halfway there, ${firstName}.`;
  return `Let's catch up, ${firstName}.`;
}

function earliestExpiryFor(certs: Certification[], category: CertificateCategory): Certification | null {
  return certs
    .filter((c) => c.categories.includes(category) && daysUntil(c.expirationDate) >= 0)
    .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))[0]
    ?? null;
}

// ── Donut ────────────────────────────────────────────────────

interface DonutProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

function Donut({ percent, size = 88, strokeWidth = 11 }: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = clampPct(percent);
  const offset = circumference * (1 - pct / 100);

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
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--brand-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-mono-brand text-sm font-semibold text-[var(--ink-900)]">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

// ── Top stat cards ───────────────────────────────────────────

interface CePointsCardProps {
  completed: number;
  total: number;
}

function CePointsCard({ completed, total }: CePointsCardProps) {
  const pct = total === 0 ? 0 : (completed / total) * 100;
  const catATotal = 12;
  const catBTotal = 12;
  // Without a CAT A/B field in the data model, split roughly so CAT A fills first.
  const catA = Math.min(completed, catATotal);
  const catB = Math.max(0, Math.min(completed - catATotal, catBTotal));

  return (
    <Link to="/iema" className="@container nb-card is-clickable p-5 flex flex-col gap-4 min-w-0 overflow-hidden">
      <p className="overline text-[var(--brand-600)]">CE points</p>
      <div className="flex flex-col items-start gap-3 @[250px]:flex-row @[250px]:items-center @[250px]:gap-5 min-w-0">
        <Donut percent={pct} />
        <div className="font-mono-brand text-3xl xl:text-4xl font-semibold tracking-tight text-[var(--ink-900)] leading-none whitespace-nowrap">
          {completed}
          <span className="text-[var(--ink-300)] mx-1">/</span>
          {total}
        </div>
      </div>
      <p className="font-mono-brand text-[11px] text-[var(--ink-500)] tracking-wide">
        CAT A {catA}/{catATotal} · CAT B {catB}/{catBTotal}
      </p>
    </Link>
  );
}

interface RenewalCardProps {
  label: string;
  daysRemaining: number | null;
  renewalDate: string | null;
  logoSrc?: string;
  logoAlt?: string;
}

function RenewalCard({ label, daysRemaining, renewalDate, logoSrc, logoAlt }: RenewalCardProps) {
  const tint = daysRemaining == null ? 'tint-paper' : urgencyTint(daysRemaining);
  return (
    <div className={`nb-card ${tint} p-5 flex flex-col gap-4 min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <p className="overline text-[var(--ink-900)]">{label}</p>
        {logoSrc && (
          <img
            src={logoSrc}
            alt={logoAlt ?? ''}
            className="h-6 w-auto object-contain shrink-0 rounded-md bg-black/70 px-0.75 py-1"
          />
        )}
      </div>
      <div className="flex-1 flex items-end">
        <span className="font-mono-brand text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--ink-900)] leading-none">
          {daysRemaining == null ? '—' : daysRemaining}
        </span>
      </div>
      <p className="font-mono-brand text-[11px] text-[var(--ink-700)] tracking-wide">
        {renewalDate ? `RENEWS ${formatRenewalDate(renewalDate)}` : 'NO RENEWAL ON FILE'}
      </p>
    </div>
  );
}

interface CertCycleCardProps {
  label: string;
  daysRemaining: number | null;
  renewalDate: string | null;
  cycleNote: string;
  logoSrc?: string;
  logoAlt?: string;
}

function CertCycleCard({ label, daysRemaining, renewalDate, cycleNote, logoSrc, logoAlt }: CertCycleCardProps) {
  const tint = daysRemaining == null ? 'tint-paper' : urgencyTint(daysRemaining);
  const duration = daysRemaining == null ? null : formatDuration(daysRemaining);
  return (
    <div className={`nb-card ${tint} p-5 flex flex-col gap-4 min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <p className="overline text-[var(--ink-900)]">{label}</p>
        {logoSrc && (
          <img
            src={logoSrc}
            alt={logoAlt ?? ''}
            className="h-6 w-auto object-contain shrink-0 rounded-md bg-black/70 px-0.75 py-1"
          />
        )}
      </div>
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
        {cycleNote}
        {renewalDate && <> · NEXT {formatRenewalDate(renewalDate)}</>}
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
        <Link to="/credentials" className="text-xs font-medium text-[var(--brand-700)] hover:underline whitespace-nowrap">
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
                <span className="font-mono-brand text-xs font-semibold text-[var(--ink-700)] w-12 text-right shrink-0">
                  {cert.ceCredits.toFixed(1)} h
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
                    {cert.ceCredits ? <> · {cert.ceCredits.toFixed(1)} h</> : null}
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
  const { certifications, loading } = useCertifications();

  const iemaCredits = useMemo(
    () =>
      certifications
        .filter((c) => c.categories.includes('IEMA') && daysUntil(c.expirationDate) >= 0)
        .reduce((sum, c) => sum + c.ceCredits, 0),
    [certifications],
  );

  const earliestIema = useMemo(() => earliestExpiryFor(certifications, 'IEMA'), [certifications]);
  const earliestArrt = useMemo(() => earliestExpiryFor(certifications, 'ARRT'), [certifications]);

  const iemaDays = earliestIema ? daysUntil(earliestIema.expirationDate) : null;
  const arrtDays = earliestArrt ? daysUntil(earliestArrt.expirationDate) : null;

  const percent = (iemaCredits / IEMA_TOTAL) * 100;
  const remaining = Math.max(0, IEMA_TOTAL - iemaCredits);

  const firstName = appUser.firstName?.trim() || appUser.username || 'there';

  // Cycle window — bracket the user's current IEMA cycle around the earliest renewal.
  const cycleEndYear = earliestIema
    ? new Date(earliestIema.expirationDate + 'T00:00:00').getFullYear()
    : new Date().getFullYear() + 1;
  const cycleStartYear = cycleEndYear - 2;

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-5">
        <span className="inline-block w-8 h-8 rounded-full border-2 border-[var(--brand-600)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      {/* Header */}
      <p className="overline text-[var(--brand-600)] mb-4">
        Cycle {cycleStartYear} – {cycleEndYear}
        {iemaDays != null && (
          <>
            <span className="mx-2 text-[var(--ink-300)]">·</span>
            <span className="font-mono-brand">{iemaDays}</span> days remaining
          </>
        )}
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-7">
        <div className="min-w-0">
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--ink-900)] leading-tight">
            {statusGreeting(percent, firstName)}
          </h1>
          <p className="mt-2 text-sm lg:text-base text-[var(--ink-700)]">
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{iemaCredits}</span>
            {' '}of{' '}
            <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{IEMA_TOTAL}</span>
            {' '}CE points logged.{' '}
            {remaining > 0 && earliestIema ? (
              <>
                <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{remaining}</span>
                {' '}to go before your IEMA renews{' '}
                <span className="font-mono-brand font-semibold text-[var(--ink-900)]">{formatShortDate(earliestIema.expirationDate)}</span>.
              </>
            ) : (
              <>You&rsquo;ve hit this cycle&rsquo;s requirement.</>
            )}
          </p>
        </div>
        <Link
          to="/certificates/new"
          className="nb-btn self-start lg:self-auto shrink-0"
        >
          <PlusIcon size={16} />
          Add certification
        </Link>
      </div>

      {/* Top stat row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        <CePointsCard completed={iemaCredits} total={IEMA_TOTAL} />
        <RenewalCard
          label="Days to IEMA renewal"
          daysRemaining={iemaDays}
          renewalDate={earliestIema?.expirationDate ?? null}
          logoSrc={iemaLogo}
          logoAlt="IEMA"
        />
        <CertCycleCard
          label="ARRT certification"
          daysRemaining={arrtDays}
          renewalDate={earliestArrt?.expirationDate ?? null}
          cycleNote="BIENNIAL"
          logoSrc={arrtLogo}
          logoAlt="ARRT"
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
