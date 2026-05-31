import { useMemo, useRef, useState } from 'react';
import type {
  AppliedCycles,
  Certification,
  CertificateCategory,
} from '../types/certification';
import type { AppUser } from '../types/auth';
import {
  PER_LICENSE,
  computeArrtCycle,
  computeIemaCycle,
  creditsInCycle,
  getEffectiveAppliedCycles,
  type CycleWindow,
} from '../utils/cycles';
import { isCategoryA } from '../services/archiveLogic';
import { updateCertificationRecord } from '../services/certificateService';
import { Donut } from './Donut';
import { CertDetailOverlay } from './CertDetailOverlay';
import { PhotoOverlay } from './PhotoOverlay';
import { ChevronRightIcon, XIcon } from '../services/svgIcons';
import arrtLogoBlack from '../assets/arrtblacktext.png';
import arrtLogoWhite from '../assets/arrtwhitetext.png';
import iemaLogoBlack from '../assets/iemablacktext.png';
import iemaLogoWhite from '../assets/iemawhitetext.png';

// Black-text logos for light mode, white-text for dark mode.
const LICENSE_LOGO: Record<License, { light: string; dark: string }> = {
  ARRT: { light: arrtLogoBlack, dark: arrtLogoWhite },
  IEMA: { light: iemaLogoBlack, dark: iemaLogoWhite },
};

function formatCycleRange(cycle: CycleWindow): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  return `${fmt(cycle.startISO)} → ${fmt(cycle.endISO)}`;
}

type License = Exclude<CertificateCategory, 'CPR'>;

interface CycleSegment {
  cert: Certification;
  value: number;
  color: string;
}

/**
 * Fixed-height footer for a cycle donut card: shows the reported certificates
 * one at a time (so the card never grows with the count), with prev/next
 * buttons and horizontal swipe on touch devices.
 */
function ReportedCertsCarousel({ segments }: { segments: CycleSegment[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = segments.length;

  if (count === 0) {
    return (
      <div className="flex h-14 w-full items-center justify-center border-t border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[10px] text-[var(--ink-500)]">
        No certificates applied yet.
      </div>
    );
  }

  const safe = Math.min(index, count - 1);
  const seg = segments[safe];
  const go = (delta: number) => setIndex(() => (safe + delta + count) % count);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const navBtn =
    'grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--ink-600)] transition-all duration-150 hover:bg-[var(--ink-100)] hover:text-[var(--brand-700)] active:scale-90 active:bg-[var(--brand-50)] active:text-[var(--brand-700)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-600)] disabled:active:scale-100 disabled:active:bg-transparent dark:text-[var(--ink-300)] dark:hover:bg-[var(--ink-800)] dark:hover:text-[var(--ink-100)] dark:active:bg-[rgba(91,63,228,0.25)] dark:active:text-[var(--ink-100)]';

  return (
    <div
      className="flex h-14 w-full flex-col justify-center gap-0.5 border-t border-[var(--ink-200)] dark:border-[var(--ink-700)] pt-2"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => go(-1)} disabled={count <= 1} aria-label="Previous certificate" className={navBtn}>
          <ChevronRightIcon size={20} className="rotate-180" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
          <span
            className="min-w-0 flex-1 truncate text-[10px] text-[var(--ink-700)] dark:text-[var(--ink-200)]"
            title={seg.cert.certificateName}
          >
            {seg.cert.certificateName}
          </span>
          <span className="font-mono-brand shrink-0 text-[10px] font-semibold tabular-nums text-[var(--ink-900)] dark:text-[var(--ink-100)]">
            {Math.round(seg.value)} points
          </span>
        </div>
        <button type="button" onClick={() => go(1)} disabled={count <= 1} aria-label="Next certificate" className={navBtn}>
          <ChevronRightIcon size={20} />
        </button>
      </div>
      {/* Always rendered (invisible when there's only one) so the button row
          above keeps a fixed position instead of jumping when the counter appears. */}
      <p
        className={`text-center font-mono-brand text-[9px] tabular-nums text-[var(--ink-400)] ${
          count > 1 ? '' : 'invisible'
        }`}
      >
        {safe + 1} / {count}
      </p>
    </div>
  );
}

const formatDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

function WarningIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-px shrink-0"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

interface CycleManagerProps {
  certifications: Certification[];
  appUser: AppUser;
}

const startOfTodayMs = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isExpired = (cert: Certification): boolean => {
  const exp = new Date(`${cert.expirationDate}T00:00:00`).getTime();
  return Number.isFinite(exp) && exp < startOfTodayMs();
};

// 24 distinct colours (one per possible cycle point) for the certificate
// segments in the cycle donuts, so individual contributions are easy to tell
// apart. Evenly spaced hues at a mid tone that reads on both light and dark.
const SEGMENT_COLORS = Array.from(
  { length: 24 },
  (_, i) => `hsl(${i * 15}, 68%, 52%)`,
);

// Deterministic colour per certificate id, so a cert keeps the same colour
// regardless of how many other certs are applied or how they're sorted. (Index-
// by-rank reshuffled every colour whenever a cert was added/removed.)
function colorForCert(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return SEGMENT_COLORS[hash % SEGMENT_COLORS.length];
}

type SortKey = 'newest' | 'oldest' | 'name' | 'unassigned';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  name: 'Name (A → Z)',
  unassigned: 'Unassigned first',
};

export function CycleManager({ certifications, appUser }: CycleManagerProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [editTarget, setEditTarget] = useState<Certification | null>(null);
  const [photoTarget, setPhotoTarget] = useState<Certification | null>(null);

  const arrtCycle = useMemo(() => computeArrtCycle(appUser), [appUser]);
  const iemaCycle = useMemo(() => computeIemaCycle(appUser), [appUser]);

  const used = useMemo(
    () => ({
      ARRT: arrtCycle ? creditsInCycle(certifications, 'ARRT', arrtCycle, appUser) : 0,
      IEMA: iemaCycle ? creditsInCycle(certifications, 'IEMA', iemaCycle, appUser) : 0,
    }),
    [certifications, appUser, arrtCycle, iemaCycle],
  );

  // Licenses whose *current* cycle this cert is still counting toward. An
  // expired cert sticks around only while at least one of these is true, so it
  // drops off once each applied cycle rolls over to a new one (and if it's on
  // both ARRT and IEMA, it stays until both have rolled).
  const licensesCountingNow = (cert: Certification): License[] => {
    const eff = getEffectiveAppliedCycles(cert, appUser);
    const out: License[] = [];
    if (arrtCycle && eff.ARRT === arrtCycle.startISO) out.push('ARRT');
    if (iemaCycle && eff.IEMA === iemaCycle.startISO) out.push('IEMA');
    return out;
  };

  // Show every non-expired cert, plus expired certs still counting toward a
  // current cycle — those carry a warning telling the user to delete them to
  // un-report. Fully-spent certs stay visible so they can unapply.
  // Sort excludes chip state by default (newest first) so rows don't reshuffle on toggle.
  const eligible = useMemo(() => {
    const list = certifications.filter(
      (c) => !isExpired(c) || licensesCountingNow(c).length > 0,
    );
    const sorted = [...list];
    switch (sortKey) {
      case 'newest':
        sorted.sort((a, b) => b.completedDate.localeCompare(a.completedDate));
        break;
      case 'oldest':
        sorted.sort((a, b) => a.completedDate.localeCompare(b.completedDate));
        break;
      case 'name':
        sorted.sort((a, b) =>
          a.certificateName.localeCompare(b.certificateName, undefined, { sensitivity: 'base' }),
        );
        break;
      case 'unassigned':
        sorted.sort((a, b) => {
          const aEmpty = a.categories.length === 0 ? 0 : 1;
          const bEmpty = b.categories.length === 0 ? 0 : 1;
          if (aEmpty !== bEmpty) return aEmpty - bEmpty;
          return b.completedDate.localeCompare(a.completedDate);
        });
        break;
    }
    return sorted;
    // licensesCountingNow derives from appUser/cycles; certifications/sortKey drive the rest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certifications, sortKey, appUser, arrtCycle, iemaCycle]);

  // Non-blocking heads-up messages shown inside a cert card. Each has a short
  // label (always visible) and the full text (revealed on hover via title).
  const certWarnings = (cert: Certification): { short: string; full: string }[] => {
    const licenses = licensesCountingNow(cert);
    if (licenses.length === 0) return [];
    const label = licenses.join(' and ');
    const out: { short: string; full: string }[] = [];

    if (isExpired(cert)) {
      out.push({
        short: 'Expired but still counting',
        full: `Expired ${formatDate(cert.expirationDate)}, but it's still counting toward ${label}. To stop reporting it, delete it from your Archive.`,
      });
      return out;
    }

    if (!isCategoryA(cert)) {
      out.push({
        short: 'Might not count',
        full: `This isn't Category A or A+, so it might not count toward ${label}.`,
      });
    }

    const expMs = new Date(`${cert.expirationDate}T00:00:00`).getTime();
    const daysLeft = Math.ceil((expMs - startOfTodayMs()) / 86_400_000);
    if (Number.isFinite(daysLeft) && daysLeft >= 0 && daysLeft <= 30) {
      out.push({
        short: `Expires in ${daysLeft}d`,
        full: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — after that you'll need to delete it to stop reporting it.`,
      });
    }
    return out;
  };

  // Matches the license chips (same height/width, neutral unchecked variant).
  const editButton = (cert: Certification) => (
    <button
      type="button"
      onClick={() => setEditTarget(cert)}
      className="flex h-9 w-20 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--ink-200)] bg-[var(--paper)] text-xs font-semibold text-[var(--ink-800)] transition-colors hover:border-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--bg-surface,#14111F)] dark:text-[var(--ink-200)]"
    >
      Edit
    </button>
  );

  // Renders the cert name with any warnings as small badges to its right. The
  // short label is always visible; hovering reveals the full message (title).
  const nameWithWarnings = (cert: Certification) => {
    const warnings = certWarnings(cert);
    return (
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
          {cert.certificateName}
        </p>
        {warnings.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            {warnings.map((w, i) => (
              <span
                key={i}
                title={w.full}
                className="flex cursor-help items-center gap-1 text-[10px] leading-snug text-amber-700 dark:text-amber-400"
              >
                <WarningIcon size={11} />
                <span className="underline decoration-dotted underline-offset-2">{w.short}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Controls column: Edit sits to the left of the three chips, but below ~410px
  // the row gets too tight, so Edit stacks above them (top-left, same size).
  const controlsClass =
    'flex flex-col items-start gap-2 shrink-0 min-[410px]:flex-row min-[410px]:items-center';

  const writeUpdate = async (
    cert: Certification,
    nextCategories: Set<CertificateCategory>,
    nextApplied: AppliedCycles,
  ) => {
    setBusyKey(cert.id);
    try {
      await updateCertificationRecord(cert.id, {
        categories: [...nextCategories],
        appliedCycles: nextApplied,
      });
    } catch (err) {
      console.error('CycleManager update failed', err);
    } finally {
      setBusyKey(null);
    }
  };

  const toggleLicense = (cert: Certification, license: License, on: boolean) => {
    const cycle = license === 'ARRT' ? arrtCycle : iemaCycle;
    if (!cycle) return;
    const nextCategories = new Set(cert.categories);
    const nextApplied: AppliedCycles = { ...(cert.appliedCycles ?? {}) };
    if (on) {
      nextCategories.add(license);
      nextCategories.delete('CPR');
      delete nextApplied.CPR;
      nextApplied[license] = cycle.startISO;
    } else {
      nextCategories.delete(license);
      delete nextApplied[license];
    }
    void writeUpdate(cert, nextCategories, nextApplied);
  };

  const toggleCpr = (cert: Certification, on: boolean) => {
    const nextCategories = new Set(cert.categories);
    const nextApplied: AppliedCycles = { ...(cert.appliedCycles ?? {}) };
    if (on) {
      nextCategories.add('CPR');
      nextCategories.delete('ARRT');
      nextCategories.delete('IEMA');
      delete nextApplied.ARRT;
      delete nextApplied.IEMA;
    } else {
      nextCategories.delete('CPR');
    }
    void writeUpdate(cert, nextCategories, nextApplied);
  };

  // Certs counting toward this license's current cycle, each tagged with a
  // stable per-cert colour so the donut breakdown reads clearly (a 4-pt cert is
  // plainly 4 of the filled points) and a cert keeps its colour as others are
  // added or removed. Sorted largest-first for a readable arrangement.
  const cycleSegments = (license: License, cycle: CycleWindow): CycleSegment[] =>
    certifications
      .filter((c) => {
        const eff = getEffectiveAppliedCycles(c, appUser);
        return eff[license] === cycle.startISO && (c.ceCredits || 0) > 0;
      })
      .sort((a, b) => (b.ceCredits || 0) - (a.ceCredits || 0))
      .map((cert) => ({
        cert,
        value: cert.ceCredits || 0,
        color: colorForCert(cert.id),
      }));

  const renderSummary = (license: License, cycle: CycleWindow | null) => {
    const setup = !!cycle;
    const segs = setup ? cycleSegments(license, cycle) : [];
    const usedRounded = Math.round(used[license]);
    // Past the cap the ring is full, so scale segments to the total applied (not
    // just the cap). This keeps every cert proportional — a 1-pt cert stays
    // small and a 10-pt cert stays large — instead of dropping over-cap certs.
    const segSum = segs.reduce((sum, s) => sum + s.value, 0);
    const donutTotal = Math.max(PER_LICENSE, segSum);
    const logo = LICENSE_LOGO[license];
    return (
      <div className="relative flex flex-col items-center gap-3 rounded-xl border border-[var(--ink-200)] dark:border-[var(--ink-700)] bg-[var(--paper)] dark:bg-[var(--bg-surface,#14111F)] p-4 pt-9">
        <img src={logo.light} alt={`${license} logo`} className="absolute left-3 top-3 h-4 w-auto dark:hidden" />
        <img src={logo.dark} alt="" aria-hidden="true" className="absolute left-3 top-3 h-4 w-auto hidden dark:block" />
        <div className="flex w-full flex-col items-center gap-0.5 text-center">
          <p className="font-display text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
            {license}
          </p>
          {setup ? (
            <p className="font-mono-brand text-[10px] text-[var(--ink-500)] tabular-nums">
              {formatCycleRange(cycle)}
            </p>
          ) : (
            <p className="text-[10px] text-[var(--ink-500)]">Set up in your profile</p>
          )}
        </div>
        <Donut
          size={100}
          strokeWidth={12}
          percent={0}
          total={setup ? donutTotal : undefined}
          segments={setup ? segs.map((s) => ({ value: s.value, color: s.color })) : undefined}
          label={
            setup ? (
              <>
                {usedRounded}
                <span className="text-[var(--ink-300)]">/</span>
                {PER_LICENSE}
              </>
            ) : (
              <span className="text-[var(--ink-400)]">—</span>
            )
          }
        />
        {setup && <ReportedCertsCarousel segments={segs} />}
      </div>
    );
  };

  const renderChip = (
    label: CertificateCategory,
    checked: boolean,
    disabled: boolean,
    onChange: () => void,
    titleText?: string,
    spent?: boolean,
    muted?: boolean,
  ) => {
    const cls = [
      'relative flex h-9 w-20 shrink-0 items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-colors',
      // `muted` keeps the greyed/unselectable look even when checked, so an
      // expired cert can still show its check marks without looking active.
      muted
        ? 'cursor-not-allowed border-[var(--ink-200)] bg-[var(--ink-100)] text-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--ink-800)] dark:text-[var(--ink-500)]'
        : checked
          ? 'border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)] dark:bg-[rgba(91,63,228,0.18)] dark:text-[var(--ink-100)]'
          : disabled
            ? 'cursor-not-allowed border-[var(--ink-200)] bg-[var(--ink-100)] text-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--ink-800)] dark:text-[var(--ink-500)]'
            : 'cursor-pointer border-[var(--ink-200)] bg-[var(--paper)] text-[var(--ink-800)] hover:border-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--bg-surface,#14111F)] dark:text-[var(--ink-200)]',
    ].join(' ');
    return (
      <label className={cls} title={titleText}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="form-checkbox h-3.5 w-3.5"
        />
        {label}
        {spent && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-red-500/80 dark:text-red-400/80"
            aria-hidden="true"
          >
            <XIcon size={28} />
          </span>
        )}
      </label>
    );
  };

  const renderCertRow = (cert: Certification) => {
    const isA = isCategoryA(cert);
    const cprChecked = cert.categories.includes('CPR');
    const busy = busyKey === cert.id;
    const expired = isExpired(cert);

    // Expired certs can't be toggled here (an expired cert can't be re-applied or
    // un-applied — the user must delete it). We still show the chips with their
    // check marks, but greyed/unselectable, plus Edit and the hover warning.
    if (expired) {
      const eff = getEffectiveAppliedCycles(cert, appUser);
      const expiredTitle = 'Expired — delete the certificate to change its reporting.';
      return (
        <li
          key={cert.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-[var(--ink-200)] dark:border-[var(--ink-700)]"
        >
          <div className="min-w-0 flex-1">
            {nameWithWarnings(cert)}
            <p className="text-[11px] text-[var(--ink-500)] tabular-nums">
              {cert.ceCredits} pts
              {cert.categoryType ? ` · ${cert.categoryType}` : ''}
            </p>
          </div>
          <div className={controlsClass}>
            {editButton(cert)}
            <div className="flex gap-2">
              {renderChip('ARRT', !!eff.ARRT, true, () => {}, expiredTitle, false, true)}
              {renderChip('IEMA', !!eff.IEMA, true, () => {}, expiredTitle, false, true)}
              {renderChip('CPR', cprChecked, true, () => {}, expiredTitle, false, true)}
            </div>
          </div>
        </li>
      );
    }

    // Both `checked` (current-cycle attribution) and `spent` (past-cycle
    // attribution, per license_ce_logic.md — a cert can never be re-applied to
    // a license it already spent) read from the same effective attribution
    // map, so legacy certs (no explicit appliedCycles) and new certs behave
    // identically and the two states are mutually exclusive.
    const effective = getEffectiveAppliedCycles(cert, appUser);
    const arrtChecked = !!arrtCycle && effective.ARRT === arrtCycle.startISO;
    const iemaChecked = !!iemaCycle && effective.IEMA === iemaCycle.startISO;
    const arrtSpent =
      !arrtChecked && !!effective.ARRT && (!arrtCycle || effective.ARRT !== arrtCycle.startISO);
    const iemaSpent =
      !iemaChecked && !!effective.IEMA && (!iemaCycle || effective.IEMA !== iemaCycle.startISO);

    const arrtFull = used.ARRT >= PER_LICENSE;
    const iemaFull = used.IEMA >= PER_LICENSE;

    const arrtDisabled =
      busy || !arrtCycle || cprChecked || arrtSpent || (!arrtChecked && (arrtFull || !isA));
    const iemaDisabled =
      busy || !iemaCycle || cprChecked || iemaSpent || (!iemaChecked && (iemaFull || !isA));
    // CPR is mutually exclusive with ARRT/IEMA. If the cert is already attached
    // to either license — currently applied OR spent in a past cycle — it can
    // never be reclassified as CPR.
    const cprDisabled = busy || arrtChecked || iemaChecked || arrtSpent || iemaSpent;

    const arrtTitle = !arrtCycle
      ? 'Set up ARRT in your profile.'
      : cprChecked
        ? 'Uncheck CPR first.'
        : arrtSpent
          ? 'Already used in a previous ARRT cycle. Cannot reuse.'
          : !arrtChecked && !isA
            ? 'Only Category A or A+ count toward CE.'
            : !arrtChecked && arrtFull
              ? 'ARRT current cycle is full.'
              : undefined;
    const iemaTitle = !iemaCycle
      ? 'Set up IEMA in your profile.'
      : cprChecked
        ? 'Uncheck CPR first.'
        : iemaSpent
          ? 'Already used in a previous IEMA cycle. Cannot reuse.'
          : !iemaChecked && !isA
            ? 'Only Category A or A+ count toward CE.'
            : !iemaChecked && iemaFull
              ? 'IEMA current cycle is full.'
              : undefined;
    const cprTitle =
      arrtSpent || iemaSpent
        ? 'Cert is already attached to an ARRT or IEMA cycle and cannot be reclassified as CPR.'
        : arrtChecked || iemaChecked
          ? 'Uncheck ARRT and IEMA first.'
          : undefined;

    return (
      <li
        key={cert.id}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-[var(--ink-200)] dark:border-[var(--ink-700)]"
      >
        <div className="min-w-0 flex-1">
          {nameWithWarnings(cert)}
          <p className="text-[11px] text-[var(--ink-500)] tabular-nums">
            {cert.ceCredits} pts
            {cert.categoryType ? ` · ${cert.categoryType}` : ''}
          </p>
        </div>
        <div className={controlsClass}>
          {editButton(cert)}
          <div className="flex gap-2">
            {renderChip('ARRT', arrtChecked, arrtDisabled, () => toggleLicense(cert, 'ARRT', !arrtChecked), arrtTitle, arrtSpent)}
            {renderChip('IEMA', iemaChecked, iemaDisabled, () => toggleLicense(cert, 'IEMA', !iemaChecked), iemaTitle, iemaSpent)}
            {renderChip('CPR', cprChecked, cprDisabled, () => toggleCpr(cert, !cprChecked), cprTitle)}
          </div>
        </div>
      </li>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 min-[500px]:grid-cols-2 gap-3">
        {renderSummary('IEMA', iemaCycle)}
        {renderSummary('ARRT', arrtCycle)}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
              Active certificates
            </p>
            <p className="text-[11px] text-[var(--ink-500)] tabular-nums">
              {eligible.length}
            </p>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-[var(--ink-600)] dark:text-[var(--ink-400)]">
            <span className="font-semibold uppercase tracking-wider">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-[var(--ink-200)] dark:border-[var(--ink-700)] bg-[var(--paper)] dark:bg-[var(--bg-surface,#14111F)] px-2 py-1 text-[11px] text-[var(--ink-800)] dark:text-[var(--ink-200)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-600)]"
              aria-label="Sort active certificates"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {eligible.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)] text-center py-6">
            No active certificates. Add one via the + button.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {eligible.map(renderCertRow)}
          </ul>
        )}
      </div>

      {editTarget && (
        <CertDetailOverlay
          cert={editTarget}
          startEditing
          onClose={() => setEditTarget(null)}
          onPhotoView={(c) => {
            setEditTarget(null);
            setPhotoTarget(c);
          }}
          onCancelEdit={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}

      {photoTarget && (
        <PhotoOverlay
          cert={photoTarget}
          onClose={() => setPhotoTarget(null)}
          onEdit={(c) => {
            setPhotoTarget(null);
            setEditTarget(c);
          }}
        />
      )}
    </section>
  );
}
