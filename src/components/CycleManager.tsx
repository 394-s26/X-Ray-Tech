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
  type CycleWindow,
} from '../utils/cycles';
import { isCategoryA, unusedPointsByLicense } from '../services/archiveLogic';
import { updateCertificationRecord } from '../services/certificateService';
import { CreditBar } from './CreditBar';

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

export function CycleManager({ certifications, appUser }: CycleManagerProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

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
  const eligible = useMemo(() => {
    return certifications
      .filter((c) => !isExpired(c))
      .sort((a, b) => {
        // Unassigned (zero categories) first, then newest completion date first.
        const aEmpty = a.categories.length === 0 ? 0 : 1;
        const bEmpty = b.categories.length === 0 ? 0 : 1;
        if (aEmpty !== bEmpty) return aEmpty - bEmpty;
        return b.completedDate.localeCompare(a.completedDate);
      });
  }, [certifications]);

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
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-base sm:text-lg font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
            {license} current cycle
          </p>
          <p className="font-mono-brand text-2xl sm:text-3xl font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums">
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
  ) => {
    const cls = [
      'flex h-9 w-20 shrink-0 items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-colors',
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
      </label>
    );
  };

  const renderCertRow = (cert: Certification) => {
    const isA = isCategoryA(cert);
    const cprChecked = cert.categories.includes('CPR');
    const arrtChecked = !!arrtCycle && cert.appliedCycles?.ARRT === arrtCycle.startISO;
    const iemaChecked = !!iemaCycle && cert.appliedCycles?.IEMA === iemaCycle.startISO;
    const busy = busyKey === cert.id;

    const arrtFull = used.ARRT >= PER_LICENSE;
    const iemaFull = used.IEMA >= PER_LICENSE;

    const arrtDisabled =
      busy || !arrtCycle || cprChecked || (!arrtChecked && (arrtFull || !isA));
    const iemaDisabled =
      busy || !iemaCycle || cprChecked || (!iemaChecked && (iemaFull || !isA));
    const cprDisabled = busy || arrtChecked || iemaChecked;

    const arrtTitle = !arrtCycle
      ? 'Set up ARRT in your profile.'
      : cprChecked
        ? 'Uncheck CPR first.'
        : !arrtChecked && !isA
          ? 'Only Category A or A+ count toward CE.'
          : !arrtChecked && arrtFull
            ? 'ARRT current cycle is full.'
            : undefined;
    const iemaTitle = !iemaCycle
      ? 'Set up IEMA in your profile.'
      : cprChecked
        ? 'Uncheck CPR first.'
        : !iemaChecked && !isA
          ? 'Only Category A or A+ count toward CE.'
          : !iemaChecked && iemaFull
            ? 'IEMA current cycle is full.'
            : undefined;
    const cprTitle =
      arrtChecked || iemaChecked ? 'Uncheck ARRT and IEMA first.' : undefined;

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
          {renderChip('ARRT', arrtChecked, arrtDisabled, () => toggleLicense(cert, 'ARRT', !arrtChecked), arrtTitle)}
          {renderChip('IEMA', iemaChecked, iemaDisabled, () => toggleLicense(cert, 'IEMA', !iemaChecked), iemaTitle)}
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
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
            Active certificates
          </p>
          <p className="text-[11px] text-[var(--ink-500)] tabular-nums">
            {eligible.length} {eligible.length === 1 ? 'certificate' : 'certificates'}
          </p>
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
