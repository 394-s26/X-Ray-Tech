import { useState, useEffect, useRef } from 'react';
import { auth } from '../services/firebase';
import type { AppUser } from '../types/auth';
import {
  updateUserProfile,
  checkUsernameAvailable,
  changeUsername,
  changePassword,
} from '../services/authService';
import { migrateAppliedCyclesForProfileChange } from '../services/certificateService';
import { computeArrtCycle, computeIemaCycle } from '../utils/cycles';
import { writeCyclesChangedNotice } from '../utils/cycleChangeNotice';
import { COLORS } from '../utils/colors';
import UserAvatar from '../components/UserAvatar';
import { BirthdayInput } from '../components/BirthdayInput';
import { PageHeader } from '../components/PageHeader';
import { UserIcon, EyeIcon, EyeOffIcon } from '../services/svgIcons';

interface ProfilePageProps {
  appUser: AppUser;
  onAppUserUpdate: (user: AppUser) => void;
}

// ── Shared helpers ────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const daysInMonth = (monthNum: number): number => {
  if (monthNum === 2) return 29;
  if ([4, 6, 9, 11].includes(monthNum)) return 30;
  return 31;
};

/**
 * Recent-year options. If `anchorMonth` (1-12) is provided AND it falls *after*
 * the current calendar month, the current year is excluded — the user's cycle
 * couldn't have started yet this year. (Mirrors the setup flow so the profile
 * editor enforces the same rule.) Birth month equal to the current month is
 * allowed because the cycle starts on the first of the month.
 */
const buildRecentYearOptions = (anchorMonth?: number | null): number[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const maxYear = anchorMonth && anchorMonth > currentMonth ? currentYear - 1 : currentYear;
  const years: number[] = [];
  for (let y = maxYear; y >= currentYear - 9; y--) years.push(y);
  return years;
};

const monthNumFromBirthday = (birthday: string | undefined | null): number | null => {
  if (!birthday) return null;
  const m = birthday.match(/^(\d{2})-\d{2}$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 12 ? n : null;
};

// ── Password helpers ──────────────────────────────────────────

interface PasswordStrength {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const checkPasswordStrength = (password: string): PasswordStrength => ({
  hasMinLength: password.length >= 8,
  hasLetter: /[a-zA-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[^a-zA-Z0-9]/.test(password),
});

const isPasswordValid = (s: PasswordStrength): boolean => Object.values(s).every(Boolean);

const StrengthPill = ({ met, label, mobileLabel }: { met: boolean; label: string; mobileLabel?: string }) => (
  <span
    className={`flex-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      met
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
    }`}
  >
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {met ? <path d="M20 6L9 17l-5-5" /> : <circle cx="12" cy="12" r="9" />}
    </svg>
    {mobileLabel ? (
      <>
        <span className="sm:hidden">{mobileLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </>
    ) : label}
  </span>
);

// ── Section card wrapper ──────────────────────────────────────

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="nb-card p-6 flex flex-col gap-5">
    <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--ink-900)] dark:text-[var(--fg)]">{title}</h2>
    {children}
  </div>
);

// ── ProfilePage ───────────────────────────────────────────────

export const ProfilePage = ({ appUser, onAppUserUpdate }: ProfilePageProps) => {
  const isEmailUser = auth.currentUser?.providerData[0]?.providerId === 'password';

  // If a save actually shifted the IEMA or ARRT cycle window, leave a one-shot
  // notice for the timeline page (/cycles) to surface as a banner. Compared on
  // the current-cycle startISO: an unchanged grid (e.g. an even-year anchor tweak
  // that rolls to the same window) leaves it identical, so no banner fires.
  const noteCycleChange = (nextUser: AppUser, realigned: number) => {
    const iemaMoved =
      computeIemaCycle(appUser)?.startISO !== computeIemaCycle(nextUser)?.startISO;
    const arrtMoved =
      computeArrtCycle(appUser)?.startISO !== computeArrtCycle(nextUser)?.startISO;
    if (iemaMoved || arrtMoved) writeCyclesChangedNotice({ realigned });
  };

  // ── Personal Info ─────────────────────────────────────────
  const [firstName, setFirstName] = useState(appUser.firstName ?? '');
  const [middleName, setMiddleName] = useState(appUser.middleName ?? '');
  const [lastName, setLastName] = useState(appUser.lastName ?? '');
  const [birthday, setBirthday] = useState(appUser.birthday ?? '');
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);

  const validatePersonal = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    const bd = birthday.match(/^(\d{2})-(\d{2})$/);
    if (!bd) {
      errs.birthday = 'Select your birth month and day.';
    } else {
      const m = parseInt(bd[1], 10);
      const d = parseInt(bd[2], 10);
      if (m < 1 || m > 12 || d < 1 || d > daysInMonth(m)) {
        errs.birthday = 'Select a valid birth month and day.';
      }
    }
    setPersonalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const savePersonal = async () => {
    if (!validatePersonal()) return;
    setPersonalSaving(true);
    try {
      const update = {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        birthday,
      };
      await updateUserProfile(appUser.uid, update);
      const nextUser = { ...appUser, ...update };
      // Birthday anchors the ARRT cycle (its birth month); if that shifts the
      // active cycle, re-point certs applied to it. Best-effort — a failure
      // here must not block the profile update from reflecting.
      let realigned = 0;
      try {
        realigned = await migrateAppliedCyclesForProfileChange(appUser.uid, appUser, nextUser);
      } catch (err) {
        console.error('Failed to migrate applied cycles after birthday change', err);
      }
      noteCycleChange(nextUser, realigned);
      onAppUserUpdate(nextUser);
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 2500);
    } finally {
      setPersonalSaving(false);
    }
  };

  // ── License Cycles & Identification ──────────────────────
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
  const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
  const [licenseSaving, setLicenseSaving] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState(false);

  // Year options mirror the setup flow: the anchor month (ARRT birth month /
  // IEMA end month) drops the current year when it falls after the current
  // month, so these react to a birthday or end-month change made on this page.
  const arrtMonthNum = monthNumFromBirthday(birthday);
  const arrtYearOptions = buildRecentYearOptions(arrtMonthNum);
  const iemaMonthNum = iemaMonth.trim() ? parseInt(iemaMonth, 10) : null;
  const iemaYearOptions = buildRecentYearOptions(iemaMonthNum);

  const validateLicense = (): boolean => {
    const errs: Record<string, string> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (arrtYear.trim()) {
      const y = parseInt(arrtYear, 10);
      if (!/^\d{4}$/.test(arrtYear) || y < 1980 || y > currentYear + 1) {
        errs.arrtYear = 'Enter a valid 4-digit year.';
      } else if (arrtMonthNum && arrtMonthNum > currentMonth && y >= currentYear) {
        errs.arrtYear = `Your ${MONTH_NAMES[arrtMonthNum - 1]} cycle for ${y} hasn't started yet. Pick ${currentYear - 1} or earlier.`;
      }
    }
    if (iemaYear.trim()) {
      const y = parseInt(iemaYear, 10);
      if (!/^\d{4}$/.test(iemaYear) || y < 1980 || y > currentYear + 1) {
        errs.iemaYear = 'Enter a valid 4-digit year.';
      } else if (iemaMonthNum && iemaMonthNum > currentMonth && y >= currentYear) {
        errs.iemaYear = `Your ${MONTH_NAMES[iemaMonthNum - 1]} cycle for ${y} hasn't started yet. Pick ${currentYear - 1} or earlier.`;
      }
    }
    if (iemaYear.trim() && !iemaMonth.trim()) errs.iemaMonth = 'Choose the cycle end month.';
    if (iemaMonth.trim() && !iemaYear.trim()) errs.iemaYear = 'Enter the year your IEMA cycle began.';
    setLicenseErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveLicense = async () => {
    if (!validateLicense()) return;
    setLicenseSaving(true);
    try {
      const update = {
        arrtCycleStartYear: arrtYear.trim() ? parseInt(arrtYear, 10) : null,
        iemaCycleStartYear: iemaYear.trim() ? parseInt(iemaYear, 10) : null,
        iemaCycleEndMonth: iemaMonth.trim() ? parseInt(iemaMonth, 10) : null,
        arrtIdNumber: arrtIdNumber.trim() || null,
        iemaIdNumber: iemaIdNumber.trim() || null,
      };
      await updateUserProfile(appUser.uid, update);
      const nextUser = { ...appUser, ...update };
      // Editing the cycle anchors can shift the active ARRT/IEMA window; keep
      // certs applied to it pointing at the now-current cycle. Best-effort — a
      // failure here must not block the profile update from reflecting.
      let realigned = 0;
      try {
        realigned = await migrateAppliedCyclesForProfileChange(appUser.uid, appUser, nextUser);
      } catch (err) {
        console.error('Failed to migrate applied cycles after license cycle change', err);
      }
      noteCycleChange(nextUser, realigned);
      onAppUserUpdate(nextUser);
      setLicenseSuccess(true);
      setTimeout(() => setLicenseSuccess(false), 2500);
    } finally {
      setLicenseSaving(false);
    }
  };

  // ── Avatar & Location ─────────────────────────────────────
  const [colorCode, setColorCode] = useState(appUser.colorCode ?? '#99a1af');
  const [hospitalAddress, setHospitalAddress] = useState(appUser.hospitalAddress ?? '');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const saveAvatar = async () => {
    setAvatarSaving(true);
    try {
      const update = { colorCode, hospitalAddress: hospitalAddress.trim() || null };
      await updateUserProfile(appUser.uid, update);
      onAppUserUpdate({ ...appUser, ...update });
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2500);
    } finally {
      setAvatarSaving(false);
    }
  };

  // ── Change Username ───────────────────────────────────────
  const [newUsername, setNewUsername] = useState('');
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkedAvailable, setCheckedAvailable] = useState<boolean | null>(null);
  const [usernameCheckError, setUsernameCheckError] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameStatus =
    newUsername.length === 0 ? 'idle'
    : newUsername === appUser.username ? 'same'
    : newUsername.length < 3 ? 'short'
    : usernameCheckError && newUsername === checkedUsername ? 'error'
    : newUsername === checkedUsername && checkedAvailable !== null
      ? (checkedAvailable ? 'available' : 'taken')
      : 'checking';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (newUsername.length < 3 || newUsername === appUser.username) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(newUsername);
        setUsernameCheckError(false);
        setCheckedUsername(newUsername);
        setCheckedAvailable(available);
      } catch {
        setUsernameCheckError(true);
        setCheckedUsername(newUsername);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [newUsername, appUser.username]);

  const usernameStatusMessage =
    usernameStatus === 'same' ? 'This is already your username.'
    : usernameStatus === 'short' ? 'Username must be at least 3 characters.'
    : usernameStatus === 'checking' ? 'Checking availability…'
    : usernameStatus === 'available' ? 'Username is available.'
    : usernameStatus === 'taken' ? 'Username is already taken.'
    : usernameStatus === 'error' ? 'Could not check availability.'
    : '';

  const usernameStatusColor =
    usernameStatus === 'available' ? 'text-green-600'
    : usernameStatus === 'taken' || usernameStatus === 'error' ? 'text-red-500'
    : 'text-slate-400';

  const canSaveUsername = usernameStatus === 'available' && !usernameSaving;

  const usernameInputClass = `form-input ${
    usernameStatus === 'taken' || usernameStatus === 'error' ? 'is-error' : ''
  }`;
  const usernameInputStyle =
    usernameStatus === 'available' ? { borderColor: 'var(--success-600)' } : undefined;

  const saveUsername = async () => {
    if (!canSaveUsername) return;
    setUsernameSaving(true);
    setUsernameError(null);
    try {
      await changeUsername(appUser.uid, appUser.username, newUsername);
      onAppUserUpdate({ ...appUser, username: newUsername });
      setUsernameSuccess(true);
      setNewUsername('');
      setCheckedUsername('');
      setCheckedAvailable(null);
      setTimeout(() => setUsernameSuccess(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setUsernameError(msg === 'Username taken' ? 'That username was just taken. Try another.' : 'Failed to update username. Please try again.');
    } finally {
      setUsernameSaving(false);
    }
  };

  // ── Change Password ───────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const pwStrength = checkPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const canSavePassword =
    currentPassword.length > 0 &&
    isPasswordValid(pwStrength) &&
    passwordsMatch &&
    !passwordSaving;

  const savePassword = async () => {
    if (!canSavePassword) return;
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError('Failed to update password. Please try again.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 flex flex-col gap-6">
      <PageHeader
        icon={<UserIcon size={22} />}
        title="Profile"
        subtitle="Manage your personal information and account settings."
        className="mb-0"
      />

      {/* Personal Info */}
      <SectionCard title="Personal Information">
        <div className="flex gap-4 flex-wrap">
          <div className="form-field flex-1 min-w-36">
            <label className="form-label">First name <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              type="text"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setPersonalErrors(p => ({ ...p, firstName: '' })); }}
            />
            {personalErrors.firstName && <p className="text-xs text-red-500 mt-1">{personalErrors.firstName}</p>}
          </div>
          <div className="form-field flex-1 min-w-36">
            <label className="form-label">Middle name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="form-input"
              type="text"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
            />
          </div>
          <div className="form-field flex-1 min-w-36">
            <label className="form-label">Last name <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              type="text"
              value={lastName}
              onChange={e => { setLastName(e.target.value); setPersonalErrors(p => ({ ...p, lastName: '' })); }}
            />
            {personalErrors.lastName && <p className="text-xs text-red-500 mt-1">{personalErrors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Birthday <span className="text-red-500">*</span></label>
          <BirthdayInput
            value={birthday}
            onChange={setBirthday}
            error={personalErrors.birthday}
            onErrorClear={() => setPersonalErrors(p => ({ ...p, birthday: '' }))}
          />
        </div>

        <div className="flex justify-end">
          <button
            className="global-btn default-btn px-5 py-2 rounded-xl min-w-24 text-sm"
            onClick={savePersonal}
            disabled={personalSaving}
          >
            {personalSuccess ? 'Saved!' : personalSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SectionCard>

      {/* License Cycles */}
      <SectionCard title="License Cycles">
        <div>
          <p className="text-sm font-semibold text-[var(--ink-800)] dark:text-[var(--fg-body)] mb-1">ARRT cycle</p>
          <p className="text-xs text-[var(--ink-500)] dark:text-[var(--fg-muted)] mb-3">
            {arrtMonthNum
              ? <>Your ARRT cycle starts on the first day of your birth month (<span className="font-semibold">{MONTH_NAMES[arrtMonthNum - 1]}</span>) and runs for 2 years.</>
              : <>Your ARRT cycle is anchored to your birth month and runs for 2 years.</>}
          </p>
          <div className="flex gap-4 flex-wrap">
            <div className="form-field max-w-60 flex-1">
              <label className="form-label">Year your current ARRT cycle began</label>
              <select className="form-input" value={arrtYear} onChange={e => { setArrtYear(e.target.value); setLicenseErrors(p => ({ ...p, arrtYear: '' })); }}>
                <option value="">Select year…</option>
                {arrtYearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              {licenseErrors.arrtYear && <p className="text-xs text-red-500 mt-1">{licenseErrors.arrtYear}</p>}
            </div>
            <div className="form-field max-w-60 flex-1">
              <label className="form-label">ARRT identification number <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. 1234567"
                value={arrtIdNumber}
                onChange={e => setArrtIdNumber(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--ink-800)] dark:text-[var(--fg-body)] mb-1">IEMA cycle</p>
          <p className="text-xs text-[var(--ink-500)] dark:text-[var(--fg-muted)] mb-3">
            Your IEMA cycle is anchored to the month you were first accredited and runs for 2 years.
          </p>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="form-field max-w-60 flex-1">
              <label className="form-label">Year your current IEMA cycle began</label>
              <select className="form-input" value={iemaYear} onChange={e => { setIemaYear(e.target.value); setLicenseErrors(p => ({ ...p, iemaYear: '', iemaMonth: '' })); }}>
                <option value="">Select year…</option>
                {iemaYearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              {licenseErrors.iemaYear && <p className="text-xs text-red-500 mt-1">{licenseErrors.iemaYear}</p>}
            </div>
            <div className="form-field max-w-60 flex-1">
              <label className="form-label">Month your IEMA cycle ends</label>
              <select className="form-input" value={iemaMonth} onChange={e => { setIemaMonth(e.target.value); setLicenseErrors(p => ({ ...p, iemaMonth: '' })); }}>
                <option value="">Select month…</option>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              {licenseErrors.iemaMonth && <p className="text-xs text-red-500 mt-1">{licenseErrors.iemaMonth}</p>}
            </div>
            <div className="form-field max-w-60 flex-1">
              <label className="form-label">IEMA identification number <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. IL-12345"
                value={iemaIdNumber}
                onChange={e => setIemaIdNumber(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="global-btn default-btn px-5 py-2 rounded-xl min-w-24 text-sm"
            onClick={saveLicense}
            disabled={licenseSaving}
          >
            {licenseSuccess ? 'Saved!' : licenseSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SectionCard>

      {/* Avatar & Location */}
      <SectionCard title="Avatar & Location">
        <div className="flex gap-10 flex-wrap">
          <div className="form-field">
            <label className="form-label">Preview</label>
            <UserAvatar
              user={{ ...appUser, firstName, lastName, colorCode }}
              size="xl"
            />
          </div>
          <div className="form-field flex-1">
            <label className="form-label">Avatar color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    colorCode === c.value
                      ? 'border-[var(--ink-900)] dark:border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onClick={() => setColorCode(c.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Hospital address <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. 123 Medical Dr, Chicago, IL"
            value={hospitalAddress}
            onChange={e => setHospitalAddress(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            className="global-btn default-btn px-5 py-2 rounded-xl min-w-24 text-sm"
            onClick={saveAvatar}
            disabled={avatarSaving}
          >
            {avatarSuccess ? 'Saved!' : avatarSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SectionCard>

      {/* Change Username */}
      <SectionCard title="Change Username">
        <p className="text-xs text-[var(--ink-500)] dark:text-[var(--fg-muted)] -mt-2">
          Current username: <span className="font-semibold text-[var(--ink-700)] dark:text-[var(--fg-body)]">@{appUser.username}</span>
        </p>
        <div className="form-field">
          <label className="form-label">New username</label>
          <input
            className={usernameInputClass}
            style={usernameInputStyle}
            type="text"
            placeholder="Enter new username (min. 3 characters)"
            value={newUsername}
            onChange={e => {
              setNewUsername(e.target.value);
              setUsernameError(null);
              setUsernameSuccess(false);
            }}
          />
          {newUsername.length > 0 && (
            <p className={`text-xs mt-1 ${usernameStatusColor}`}>{usernameStatusMessage}</p>
          )}
          {usernameSuccess && <p className="text-xs mt-1 text-green-600">Username updated successfully.</p>}
          {usernameError && <p className="text-xs mt-1 text-red-500">{usernameError}</p>}
        </div>
        <div className="flex justify-end">
          <button
            className="global-btn default-btn px-5 py-2 rounded-xl min-w-24 text-sm"
            onClick={saveUsername}
            disabled={!canSaveUsername}
          >
            {usernameSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="Change Password">
        {isEmailUser ? (
          <>
            <div className="form-field">
              <label className="form-label">Current password</label>
              <div className="relative">
                <input
                  className="form-input pr-11"
                  type={showCurrentPw ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setPasswordError(null); }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">New password</label>
              <div className="relative">
                <input
                  className="form-input pr-11"
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="flex flex-nowrap gap-1.5 mt-2">
                  <StrengthPill met={pwStrength.hasMinLength} label="8+ chars" />
                  <StrengthPill met={pwStrength.hasLetter} label="Letter" />
                  <StrengthPill met={pwStrength.hasNumber} label="Number" mobileLabel="Num" />
                  <StrengthPill met={pwStrength.hasSpecial} label="Special char" mobileLabel="Special" />
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Confirm new password</label>
              <input
                className={`form-input ${confirmPassword.length > 0 && !passwordsMatch ? 'is-error' : ''}`}
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            {passwordSuccess && <p className="text-xs text-green-600">Password updated successfully.</p>}
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}

            <div className="flex justify-end">
              <button
                className="global-btn default-btn px-5 py-2 rounded-xl min-w-24 text-sm"
                onClick={savePassword}
                disabled={!canSavePassword}
              >
                {passwordSaving ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-500)] dark:text-[var(--fg-muted)]">
            Your password is managed by Google. To change it, visit your Google account settings.
          </p>
        )}
      </SectionCard>

    </div>
  );
};

export default ProfilePage;
