import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppUser } from '../types/auth';
import { updateUserProfile } from '../services/authService';
import { TeamSetupCard } from './TeamSetupCard';
import { SetupReminderContext } from './setupReminderContext';

// ── Helpers ────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const buildRecentYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 9; y--) years.push(y);
  return years;
};

const isLicenseMissing = (u: AppUser): boolean =>
  u.arrtCycleStartYear == null ||
  u.iemaCycleStartYear == null ||
  u.iemaCycleEndMonth == null;

const isTeamMissing = (u: AppUser): boolean => !u.teamCode;

const isSetupIncompleteFor = (u: AppUser): boolean =>
  isLicenseMissing(u) || isTeamMissing(u);

const birthMonthLabel = (birthday: string | null | undefined): string | null => {
  if (!birthday) return null;
  const m = birthday.match(/^(\d{2})-\d{2}$/);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  return idx >= 0 && idx < 12 ? MONTH_NAMES[idx] : null;
};

// ── Provider ────────────────────────────────────────────────────

interface SetupReminderProviderProps {
  appUser: AppUser;
  onAppUserUpdate: (u: AppUser) => void;
  children: ReactNode;
}

export const SetupReminderProvider = ({
  appUser,
  onAppUserUpdate,
  children,
}: SetupReminderProviderProps) => {
  const [open, setOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const hasAutoOpened = useRef(false);

  const incomplete = isSetupIncompleteFor(appUser);

  // Auto-open the modal once per session when the user first signs in
  // with incomplete setup.
  useEffect(() => {
    if (!hasAutoOpened.current && incomplete) {
      hasAutoOpened.current = true;
      setOpen(true);
    }
  }, [incomplete]);

  const openModal = useCallback(() => setOpen(true), []);

  return (
    <SetupReminderContext.Provider value={{ openModal, isSetupIncomplete: incomplete }}>
      {children}
      {open && (
        <SetupModal
          appUser={appUser}
          onAppUserUpdate={onAppUserUpdate}
          onClose={() => setOpen(false)}
        />
      )}
      {!open && incomplete && !bannerDismissed && (
        <SetupBottomBanner
          onContinue={() => setOpen(true)}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
    </SetupReminderContext.Provider>
  );
};

// ── Bottom banner ────────────────────────────────────────────────

interface SetupBottomBannerProps {
  onContinue: () => void;
  onDismiss: () => void;
}

const SetupBottomBanner = ({ onContinue, onDismiss }: SetupBottomBannerProps) => (
  <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md">
    <div
      className="flex items-center gap-3 rounded-full pl-4 pr-2 py-2 shadow-lg border"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--ink-200)',
        boxShadow: '0 8px 24px rgba(14, 11, 31, 0.18)',
      }}
    >
      <span
        className="grid place-items-center w-7 h-7 rounded-full shrink-0"
        style={{ background: '#FEEFCB', color: '#B45309' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <p className="flex-1 min-w-0 text-sm text-[var(--ink-900)]">
        Complete your setup to unlock all features
      </p>
      <button
        type="button"
        className="nb-btn is-accent shrink-0"
        style={{ padding: '6px 14px', fontSize: 13, boxShadow: 'none', borderRadius: 999 }}
        onClick={onContinue}
      >
        Complete setup
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 grid place-items-center w-7 h-7 rounded-full text-[var(--ink-500)] hover:bg-[var(--ink-100)] cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
);

// ── Modal ────────────────────────────────────────────────────────

interface SetupModalProps {
  appUser: AppUser;
  onAppUserUpdate: (u: AppUser) => void;
  onClose: () => void;
}

const SetupModal = ({ appUser, onAppUserUpdate, onClose }: SetupModalProps) => {
  const licenseMissing = isLicenseMissing(appUser);
  const teamMissing = isTeamMissing(appUser);
  const iemaYearOptions = buildRecentYearOptions();

  const [arrtYear, setArrtYear] = useState(
    appUser.arrtCycleStartYear != null ? String(appUser.arrtCycleStartYear) : '',
  );
  const [iemaYear, setIemaYear] = useState(
    appUser.iemaCycleStartYear != null ? String(appUser.iemaCycleStartYear) : '',
  );
  const [iemaMonth, setIemaMonth] = useState(
    appUser.iemaCycleEndMonth != null ? String(appUser.iemaCycleEndMonth) : '',
  );
  const [arrtIdNumber, setArrtIdNumber] = useState(appUser.arrtIdNumber ?? '');
  const [iemaIdNumber, setIemaIdNumber] = useState(appUser.iemaIdNumber ?? '');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [savingLicense, setSavingLicense] = useState(false);

  const birth = birthMonthLabel(appUser.birthday);

  const handleSaveLicense = async () => {
    setLicenseError(null);
    const currentYear = new Date().getFullYear();
    const validYear = (v: string) =>
      /^\d{4}$/.test(v) && parseInt(v, 10) >= 1980 && parseInt(v, 10) <= currentYear + 1;

    if (arrtYear.trim() && !validYear(arrtYear)) { setLicenseError('Enter a valid 4-digit ARRT year.'); return; }
    if (iemaYear.trim() && !validYear(iemaYear)) { setLicenseError('Enter a valid 4-digit IEMA year.'); return; }
    if (iemaYear.trim() && !iemaMonth.trim()) { setLicenseError('Pick the IEMA cycle end month.'); return; }
    if (iemaMonth.trim() && !iemaYear.trim()) { setLicenseError('Enter the year your IEMA cycle began.'); return; }

    const update: Partial<AppUser> = {
      arrtIdNumber: arrtIdNumber.trim() || null,
      iemaIdNumber: iemaIdNumber.trim() || null,
    };
    if (arrtYear.trim()) update.arrtCycleStartYear = parseInt(arrtYear, 10);
    if (iemaYear.trim()) update.iemaCycleStartYear = parseInt(iemaYear, 10);
    if (iemaMonth.trim()) update.iemaCycleEndMonth = parseInt(iemaMonth, 10);

    const hasCycle =
      update.arrtCycleStartYear != null ||
      update.iemaCycleStartYear != null ||
      update.iemaCycleEndMonth != null;
    const hasId = !!(update.arrtIdNumber || update.iemaIdNumber);

    if (!hasCycle && !hasId) {
      setLicenseError('Add cycle dates or ID numbers, or click "Maybe later" to skip.');
      return;
    }

    setSavingLicense(true);
    try {
      await updateUserProfile(appUser.uid, update);
      onAppUserUpdate({ ...appUser, ...update });
    } catch {
      setLicenseError('Could not save. Please try again.');
    } finally {
      setSavingLicense(false);
    }
  };

  // Close the modal automatically once both sections are completed.
  useEffect(() => {
    if (!licenseMissing && !teamMissing) {
      // Setup is now complete — nothing left to do here.
      // The provider will hide the banner.
    }
  }, [licenseMissing, teamMissing]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-[6vh]"
      style={{ background: 'rgba(14, 11, 31, 0.55)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--paper)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full text-[var(--ink-700)] hover:bg-[var(--ink-100)] cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="px-6 sm:px-8 pt-6 pb-3">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-900)]">
            Finish setting up your account
          </h2>
        </div>

        <div className="px-6 sm:px-8 pb-5 flex flex-col gap-3">
          {/* Profile (always done by this point) */}
          <ChecklistRow done title="Create your account" />
          <ChecklistRow done title="Tell us about you" />

          {/* License cycles */}
          {licenseMissing ? (
            <ChecklistSection
              done={false}
              title="Add your license cycles"
              subtitle="So we can pin CE deadlines to the right dates."
            >
              <div className="form-field">
                <label className="form-label">
                  Year your ARRT cycle began
                </label>
                <select
                  className="form-input"
                  value={arrtYear}
                  onChange={(e) => setArrtYear(e.target.value)}
                  disabled={savingLicense}
                >
                  <option value="">Select year…</option>
                  {iemaYearOptions.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {birth
                    ? <>Cycle starts in your birth month ({birth}).</>
                    : 'Cycle is anchored to your birth month.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">
                    Year your IEMA cycle began
                  </label>
                  <select
                    className="form-input"
                    value={iemaYear}
                    onChange={(e) => setIemaYear(e.target.value)}
                    disabled={savingLicense}
                  >
                    <option value="">Select year…</option>
                    {iemaYearOptions.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">
                    Month your IEMA cycle ends
                  </label>
                  <select
                    className="form-input"
                    value={iemaMonth}
                    onChange={(e) => setIemaMonth(e.target.value)}
                    disabled={savingLicense}
                  >
                    <option value="">Select month…</option>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Same month you were first accredited.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">
                    ARRT identification number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. 1234567"
                    value={arrtIdNumber}
                    onChange={(e) => setArrtIdNumber(e.target.value)}
                    disabled={savingLicense}
                    autoComplete="off"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">
                    IEMA identification number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. IL-12345"
                    value={iemaIdNumber}
                    onChange={(e) => setIemaIdNumber(e.target.value)}
                    disabled={savingLicense}
                    autoComplete="off"
                  />
                </div>
              </div>

              {licenseError && (
                <p className="text-xs text-red-600 dark:text-red-400">{licenseError}</p>
              )}

              <button
                type="button"
                className="global-btn default-btn self-start min-w-30"
                onClick={handleSaveLicense}
                disabled={savingLicense}
              >
                {savingLicense ? 'Saving…' : 'Save license info'}
              </button>
            </ChecklistSection>
          ) : (
            <ChecklistRow done title="Add your license cycles" />
          )}

          {/* Team */}
          {teamMissing ? (
            <ChecklistSection
              done={false}
              title="Join or create a team"
              subtitle="Connect with your X-Ray technologist manager or team leader."
            >
              <TeamSetupCard
                appUser={appUser}
                onJoined={onAppUserUpdate}
                variant="plain"
                hideHeading
              />
            </ChecklistSection>
          ) : (
            <ChecklistRow done title="Join or create a team" />
          )}
        </div>

        <div
          className="px-6 sm:px-8 py-4 flex flex-col items-center gap-2 border-t"
          style={{ borderColor: 'var(--ink-200)', background: 'var(--paper)' }}
        >
          <button
            type="button"
            className={`nb-btn w-full max-w-md justify-center setup-modal__finish${
              !licenseMissing && !teamMissing ? ' is-accent' : ''
            }`}
            disabled={licenseMissing || teamMissing}
            onClick={onClose}
          >
            Complete setup
          </button>
          <button
            type="button"
            className="text-sm text-[var(--ink-500)] hover:underline cursor-pointer"
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Checklist primitives ────────────────────────────────────────

interface ChecklistRowProps {
  done: boolean;
  title: string;
}

const ChecklistRow = ({ done, title }: ChecklistRowProps) => (
  <div
    className="flex items-center gap-3 px-4 py-3 rounded-xl border"
    style={{
      borderColor: 'var(--ink-200)',
      background: done ? 'var(--brand-50, var(--paper))' : 'var(--paper)',
    }}
  >
    <CheckmarkDot done={done} />
    <span
      className={`text-sm ${done ? 'text-[var(--ink-500)] line-through' : 'text-[var(--ink-900)] font-medium'}`}
    >
      {title}
    </span>
  </div>
);

interface ChecklistSectionProps {
  done: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const ChecklistSection = ({ done, title, subtitle, children }: ChecklistSectionProps) => (
  <div
    className="rounded-xl border overflow-hidden"
    style={{ borderColor: 'var(--ink-200)' }}
  >
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--paper)' }}>
      <CheckmarkDot done={done} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-[var(--ink-500)] line-through' : 'text-[var(--ink-900)]'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--ink-500)] mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {!done && (
      <div className="px-4 pb-4 pt-1 flex flex-col gap-4 border-t" style={{ borderColor: 'var(--ink-200)' }}>
        {children}
      </div>
    )}
  </div>
);

const CheckmarkDot = ({ done }: { done: boolean }) => (
  <span
    className="grid place-items-center w-6 h-6 rounded-full shrink-0"
    style={{
      background: done ? 'var(--brand-600)' : 'transparent',
      border: done ? '1.5px solid var(--brand-600)' : '1.5px solid var(--ink-300)',
      color: done ? 'var(--fg-on-brand, #fff)' : 'transparent',
    }}
  >
    {done && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </span>
);

export default SetupReminderProvider;
