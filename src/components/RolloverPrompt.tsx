import { useMemo, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { Certification, CertificateCategory } from '../types/certification';
import {
  PER_LICENSE,
  computeArrtCycle,
  computeIemaCycle,
  creditsInCycle,
  getEffectiveAppliedCycles,
} from '../utils/cycles';
import { isArchived, isCategoryA } from '../services/archiveLogic';
import { updateCertificationRecord } from '../services/certificateService';
import { XIcon, ArrowRightIcon } from '../services/svgIcons';

type License = Exclude<CertificateCategory, 'CPR'>;

interface OrphanCert {
  cert: Certification;
  rollableInto: License[];
}

interface RolloverPromptProps {
  certifications: Certification[];
  appUser: AppUser;
}

export function RolloverPrompt({ certifications, appUser }: RolloverPromptProps) {
  const [open, setOpen] = useState(false);
  const [busyCertId, setBusyCertId] = useState<string | null>(null);

  const { orphans, currentByLicense } = useMemo(() => {
    const iemaCurrent = computeIemaCycle(appUser);
    const arrtCurrent = computeArrtCycle(appUser);
    const usedNow = {
      ARRT: arrtCurrent ? creditsInCycle(certifications, 'ARRT', arrtCurrent, appUser) : Number.POSITIVE_INFINITY,
      IEMA: iemaCurrent ? creditsInCycle(certifications, 'IEMA', iemaCurrent, appUser) : Number.POSITIVE_INFINITY,
    };
    const currentByLicense: Record<License, { startISO: string; endISO: string } | null> = {
      ARRT: arrtCurrent ? { startISO: arrtCurrent.startISO, endISO: arrtCurrent.endISO } : null,
      IEMA: iemaCurrent ? { startISO: iemaCurrent.startISO, endISO: iemaCurrent.endISO } : null,
    };

    const result: OrphanCert[] = [];
    for (const cert of certifications) {
      if (!isCategoryA(cert)) continue;
      if (isArchived(cert)) continue;
      const applied = getEffectiveAppliedCycles(cert, appUser);
      const rollable: License[] = [];
      (['ARRT', 'IEMA'] as const).forEach((cat) => {
        const cur = currentByLicense[cat];
        if (!cur) return;
        const assigned = applied[cat];
        if (!assigned) return;
        if (assigned >= cur.startISO) return; // already current or future
        if (usedNow[cat] >= PER_LICENSE) return; // new cycle already full
        rollable.push(cat);
      });
      if (rollable.length > 0) result.push({ cert, rollableInto: rollable });
    }
    return { orphans: result, currentByLicense };
  }, [certifications, appUser]);

  if (orphans.length === 0) return null;

  const applyToCurrent = async (cert: Certification, license: License) => {
    const cur = currentByLicense[license];
    if (!cur) return;
    setBusyCertId(cert.id);
    try {
      const existing = getEffectiveAppliedCycles(cert, appUser);
      await updateCertificationRecord(cert.id, {
        appliedCycles: { ...existing, [license]: cur.startISO },
      });
    } catch (err) {
      console.error('RolloverPrompt update failed', err);
    } finally {
      setBusyCertId(null);
    }
  };

  return (
    <>
      <div
        role="status"
        className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
      >
        <span>
          <strong className="font-semibold">{orphans.length}</strong>{' '}
          {orphans.length === 1 ? 'certificate' : 'certificates'} from a past cycle can now be applied to your new ARRT/IEMA cycle.
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 dark:bg-amber-700/40 px-3 py-1 text-xs font-semibold hover:bg-amber-300 dark:hover:bg-amber-600/40 transition-colors"
        >
          Review
          <ArrowRightIcon size={12} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Apply past-cycle certificates to current cycles"
        >
          <div
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-[var(--paper)] dark:bg-[var(--bg-surface,#14111F)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-[var(--ink-500)] hover:bg-[var(--ink-100)] dark:hover:bg-[var(--ink-700)]"
            >
              <XIcon size={16} />
            </button>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] mb-1 pr-8">
              Reapply to current cycle
            </h2>
            <p className="text-xs text-[var(--ink-600)] dark:text-[var(--ink-400)] mb-4">
              These certificates were applied to a past cycle. Move them to the current cycle to count toward your active 24-credit goal.
            </p>

            <ul className="flex flex-col gap-3">
              {orphans.map(({ cert, rollableInto }) => (
                <li
                  key={cert.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--ink-200)] dark:border-[var(--ink-700)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm text-[var(--ink-900)] dark:text-[var(--ink-100)] truncate">
                      {cert.certificateName}
                    </span>
                    <span className="text-xs text-[var(--ink-500)] tabular-nums whitespace-nowrap">
                      {cert.ceCredits} pts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rollableInto.map((license) => (
                      <button
                        key={license}
                        type="button"
                        disabled={busyCertId === cert.id}
                        onClick={() => applyToCurrent(cert, license)}
                        className="rounded-full border border-[var(--brand-600)] text-[var(--brand-700)] px-3 py-1 text-[11px] font-semibold hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] disabled:opacity-50 transition-colors"
                      >
                        Apply to current {license} cycle
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
