import { useMemo, useState } from 'react';
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
import { isCategoryA, unusedPointsByLicense } from '../services/archiveLogic';
import { updateCertificationRecord } from '../services/certificateService';
import { CreditBar } from './CreditBar';
import { XIcon } from '../services/svgIcons';

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

  const arrtCycle = useMemo(() => computeArrtCycle(appUser), [appUser]);
  const iemaCycle = useMemo(() => computeIemaCycle(appUser), [appUser]);

  const used = useMemo(
    () => ({
      ARRT: arrtCycle ? creditsInCycle(certifications, 'ARRT', arrtCycle, appUser) : 0,
      IEMA: iemaCycle ? creditsInCycle(certifications, 'IEMA', iemaCycle, appUser) : 0,
    }),
    [certifications, appUser, arrtCycle, iemaCycle],
  );

  const unused = useMemo(
    () => unusedPointsByLicense(certifications, appUser),
    [certifications, appUser],
  );

  // Show every non-expired cert. Fully-spent certs stay visible so the user can unapply.
  // Sort excludes chip state by default (newest first) so rows don't reshuffle on toggle.
  const eligible = useMemo(() => {
    const list = certifications.filter((c) => !isExpired(c));
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
  }, [certifications, sortKey]);

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

  const renderSummary = (license: License, cycle: CycleWindow | null) => {
    if (!cycle) {
      return (
        <div className="flex flex-col gap-2 py-4 sm:py-5">
          <p className="font-display text-base sm:text-lg font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
            {license} current cycle
          </p>
          <p className="text-sm text-[var(--ink-500)]">
            Set up {license} in your profile to track credits.
          </p>
        </div>
      );
    }
    const usedRounded = Math.round(used[license]);
    const unusedRounded = Math.round(unused[license === 'ARRT' ? 'arrt' : 'iema']);
    return (
      <div className="flex flex-col gap-3 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-display text-base sm:text-lg font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
              {license} current cycle
            </p>
            <p className="font-mono-brand text-[11px] sm:text-xs text-[var(--ink-500)] tabular-nums">
              {formatCycleRange(cycle)}
            </p>
          </div>
          <p className="font-mono-brand text-2xl sm:text-3xl font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums shrink-0">
            {usedRounded}
            <span className="text-base sm:text-lg text-[var(--ink-500)] font-normal">{` / ${PER_LICENSE}h`}</span>
          </p>
        </div>
        <CreditBar used={used[license]} cap={PER_LICENSE} label={`${license} current cycle credits`} />
        <p className="text-xs text-[var(--ink-500)] tabular-nums">
          {unusedRounded} pts unused
        </p>
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
  ) => {
    const cls = [
      'relative flex h-9 w-20 shrink-0 items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-colors',
      checked
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
          <p className="text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] truncate">
            {cert.certificateName}
          </p>
          <p className="text-[11px] text-[var(--ink-500)] tabular-nums">
            {cert.ceCredits} pts
            {cert.categoryType ? ` · ${cert.categoryType}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {renderChip('ARRT', arrtChecked, arrtDisabled, () => toggleLicense(cert, 'ARRT', !arrtChecked), arrtTitle, arrtSpent)}
          {renderChip('IEMA', iemaChecked, iemaDisabled, () => toggleLicense(cert, 'IEMA', !iemaChecked), iemaTitle, iemaSpent)}
          {renderChip('CPR', cprChecked, cprDisabled, () => toggleCpr(cert, !cprChecked), cprTitle)}
        </div>
      </li>
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col divide-y divide-[var(--ink-200)] dark:divide-[var(--ink-700)]">
        {renderSummary('ARRT', arrtCycle)}
        {renderSummary('IEMA', iemaCycle)}
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
    </section>
  );
}
