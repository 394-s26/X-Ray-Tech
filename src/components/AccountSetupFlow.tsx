import { useState, useEffect } from 'react';
import type { AppUser } from '../types/auth';
import { updateUserProfile, createTeam, getTeamByCode, fetchUsersByUids, addMemberToTeam } from '../services/authService';
import UserAvatar from './UserAvatar';
import { CopyIcon, RotateCwIcon } from '../services/svgIcons';
import { COLORS } from '../utils/colors';
import '../styles/components/AccountSetupFlow.css';

interface AccountSetupFlowProps {
  user: AppUser;
  onComplete: (updated: AppUser) => void;
}

interface SetupFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
  teamCode: string;
  hospitalAddress: string;
  colorCode: string | null;
  arrtCycleStartYear: string;
  iemaCycleStartYear: string;
  iemaCycleEndMonth: string;
  arrtIdNumber: string;
  iemaIdNumber: string;
}

type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const daysInMonth = (monthNum: number): number => {
  if (monthNum === 2) return 29;
  if ([4, 6, 9, 11].includes(monthNum)) return 30;
  return 31;
};

const buildRecentYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 9; y--) years.push(y);
  return years;
};

const monthLabelFromBirthday = (birthday: string | undefined | null): string | null => {
  if (!birthday) return null;
  const match = birthday.match(/^(\d{2})-\d{2}$/);
  if (!match) return null;
  const m = parseInt(match[1], 10);
  if (m < 1 || m > 12) return null;
  return MONTH_NAMES[m - 1];
};


const generateTeamId = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  return (
    letters[Math.floor(Math.random() * 26)] +
    letters[Math.floor(Math.random() * 26)] +
    Array.from({ length: 5 }, () => digits[Math.floor(Math.random() * 10)]).join('')
  );
};

interface TeamCardProps {
  name: string;
  code: string;
  manager: string;
  color: string;
}

const TeamCard = ({ name, code, manager, color }: TeamCardProps) => (
  <div className="setup-flow__team-card">
    <div className="setup-flow__team-card-stripe" style={{ backgroundColor: color }} />
    <div className="setup-flow__team-card-body">
      <div className="flex flex-col gap-0.5">
        <span className="setup-flow__team-name">{name}</span>
        <span className="setup-flow__team-code">{code}</span>
      </div>
      <span className="setup-flow__team-manager">{manager}</span>
    </div>
  </div>
);

export const AccountSetupFlow = ({ user, onComplete }: AccountSetupFlowProps) => {
  const [step, setStep] = useState<Step>(1);
  const [skippedSteps, setSkippedSteps] = useState<Set<Step>>(new Set());
  const [teamMode, setTeamMode] = useState<'join' | 'create'>('join');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamId, setNewTeamId] = useState(() => generateTeamId());
  const [newTeamColor, setNewTeamColor] = useState<string | null>(null);
  const [newTeamErrors, setNewTeamErrors] = useState<Record<string, string>>({});
  const [regenerateSpin, setRegenerateSpin] = useState(false);
  const [teamIdCopied, setTeamIdCopied] = useState(false);
  const [formData, setFormData] = useState<SetupFormData>({
    firstName: user.firstName ?? '',
    middleName: user.middleName ?? '',
    lastName: user.lastName ?? '',
    birthday: user.birthday ?? '',
    teamCode: user.teamCode ?? '',
    hospitalAddress: user.hospitalAddress ?? '',
    colorCode: user.colorCode ?? '#99a1af',
    arrtCycleStartYear: user.arrtCycleStartYear != null ? String(user.arrtCycleStartYear) : '',
    iemaCycleStartYear: user.iemaCycleStartYear != null ? String(user.iemaCycleStartYear) : '',
    iemaCycleEndMonth: user.iemaCycleEndMonth != null ? String(user.iemaCycleEndMonth) : '',
    arrtIdNumber: user.arrtIdNumber ?? '',
    iemaIdNumber: user.iemaIdNumber ?? '',
  });
  const initialBdMatch = (user.birthday ?? '').match(/^(\d{2})-(\d{2})$/);
  const [birthMonth, setBirthMonth] = useState<string>(initialBdMatch ? initialBdMatch[1] : '');
  const [birthDay, setBirthDay] = useState<string>(initialBdMatch ? initialBdMatch[2] : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const next = birthMonth && birthDay ? `${birthMonth}-${birthDay}` : '';
    setFormData(prev => (prev.birthday === next ? prev : { ...prev, birthday: next }));
  }, [birthMonth, birthDay]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [foundTeam, setFoundTeam] = useState<{ name: string; manager: string; color: string } | null>(null);
  const [teamLookupLoading, setTeamLookupLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const code = formData.teamCode.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (!code) {
        setFoundTeam(null);
        setTeamLookupLoading(false);
        return;
      }
      setTeamLookupLoading(true);
      const team = await getTeamByCode(code);
      if (cancelled) return;
      if (!team) {
        setFoundTeam(null);
        setTeamLookupLoading(false);
        return;
      }
      const leads = await fetchUsersByUids([team.teamLead]);
      if (cancelled) return;
      const lead = leads[0];
      const managerName = lead
        ? [lead.firstName, lead.lastName].filter(Boolean).join(' ') || (lead.email ?? 'Unknown')
        : 'Unknown';
      setFoundTeam({ name: team.name, manager: managerName, color: team.color ?? '' });
      setTeamLookupLoading(false);
    }, code ? 400 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [formData.teamCode]);

  const setField = <K extends keyof SetupFormData>(key: K, value: SetupFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined as unknown as string }));
  };

  const validatePage1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';
    const bd = formData.birthday.match(/^(\d{2})-(\d{2})$/);
    if (!bd) {
      errs.birthday = 'Select your birth month and day.';
    } else {
      const m = parseInt(bd[1], 10);
      const d = parseInt(bd[2], 10);
      if (m < 1 || m > 12 || d < 1 || d > daysInMonth(m)) {
        errs.birthday = 'Select a valid birth month and day.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLicenseStep = (): boolean => {
    const errs: Record<string, string> = {};
    const currentYear = new Date().getFullYear();
    if (formData.arrtCycleStartYear.trim()) {
      const y = parseInt(formData.arrtCycleStartYear, 10);
      if (!/^\d{4}$/.test(formData.arrtCycleStartYear) || y < 1980 || y > currentYear + 1) {
        errs.arrtCycleStartYear = 'Enter a valid 4-digit year.';
      }
    }
    if (formData.iemaCycleStartYear.trim()) {
      const y = parseInt(formData.iemaCycleStartYear, 10);
      if (!/^\d{4}$/.test(formData.iemaCycleStartYear) || y < 1980 || y > currentYear + 1) {
        errs.iemaCycleStartYear = 'Enter a valid 4-digit year.';
      }
    }
    if (formData.iemaCycleStartYear.trim() && !formData.iemaCycleEndMonth.trim()) {
      errs.iemaCycleEndMonth = 'Choose the cycle end month.';
    }
    if (formData.iemaCycleEndMonth.trim() && !formData.iemaCycleStartYear.trim()) {
      errs.iemaCycleStartYear = 'Enter the year your IEMA cycle began.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateTeamStep = (): boolean => {
    if (teamMode === 'join') {
      const code = formData.teamCode.trim();
      if (!code) {
        setErrors({ teamCode: 'Team code is required.' });
        return false;
      }
      if (!foundTeam) {
        setErrors({});
        return false;
      }
      return true;
    } else {
      const errs: Record<string, string> = {};
      if (!newTeamName.trim()) errs.newTeamName = 'Team name is required.';
      setNewTeamErrors(errs);
      return Object.keys(errs).length === 0;
    }
  };

  const markSkipped = (s: Step) => {
    setSkippedSteps(prev => {
      const next = new Set(prev);
      next.add(s);
      return next;
    });
  };

  const handleFinish = async (teamSkipped: boolean) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const licenseSkipped = skippedSteps.has(2);
      const avatarSkipped = skippedSteps.has(3);

      const update: Partial<AppUser> = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        birthday: formData.birthday,
        teamCode: teamSkipped ? null : (teamMode === 'create' ? newTeamId : formData.teamCode.trim()),
        hospitalAddress: avatarSkipped ? user.hospitalAddress ?? null : formData.hospitalAddress.trim() || null,
        colorCode: avatarSkipped ? user.colorCode ?? null : formData.colorCode,
        role: teamSkipped ? null : (teamMode === 'create' ? 'manager' : 'member'),
        arrtCycleStartYear: licenseSkipped || !formData.arrtCycleStartYear.trim()
          ? null
          : parseInt(formData.arrtCycleStartYear, 10),
        iemaCycleStartYear: licenseSkipped || !formData.iemaCycleStartYear.trim()
          ? null
          : parseInt(formData.iemaCycleStartYear, 10),
        iemaCycleEndMonth: licenseSkipped || !formData.iemaCycleEndMonth.trim()
          ? null
          : parseInt(formData.iemaCycleEndMonth, 10),
        arrtIdNumber: formData.arrtIdNumber.trim() || null,
        iemaIdNumber: formData.iemaIdNumber.trim() || null,
        setupCompleted: true,
      };
      if (!teamSkipped) {
        if (teamMode === 'create') {
          await createTeam({
            id: newTeamId,
            name: newTeamName,
            color: newTeamColor ?? '',
            teamLead: user.uid,
            members: [],
          });
        } else {
          await addMemberToTeam(formData.teamCode.trim(), user.uid);
        }
      }
      await updateUserProfile(user.uid, update);
      onComplete({ ...user, ...update });
    } catch {
      setSubmitError('Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProfileStep = () => (
    <>
      <div>
        <h2 className="setup-flow__title" style={{ marginBottom: 0 }}>Let's set up your profile</h2>
        <p className="setup-flow__subtitle mt-1">What should we call you?</p>
      </div>
      <div className="setup-flow__body">
        <div className="setup-flow__name-row flex gap-4 justify-between">
          <div className="form-field">
            <label className="form-label">First name <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={e => setField('firstName', e.target.value)}
            />
            <p className="setup-flow__field-error">{errors.firstName}</p>
          </div>
          <div className="form-field">
            <label className="form-label">Middle name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Michael"
              value={formData.middleName}
              onChange={e => setField('middleName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Last name <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={e => setField('lastName', e.target.value)}
            />
            <p className="setup-flow__field-error">{errors.lastName}</p>
          </div>
        </div>

        <div className="w-full mt-10">
          <p className="setup-flow__mini-title">When is your birthday? <span className="text-red-500">*</span></p>
          <p className="setup-flow__subtitle">This is used to determine your ARRT cycle.</p>
        </div>

        <div className="setup-flow__birthday-field form-field w-full mt-2">
          <div className="flex gap-3">
            <div className="flex-1 max-w-50">
              <select
                className="form-input"
                value={birthMonth}
                onChange={e => {
                  const m = e.target.value;
                  setBirthMonth(m);
                  if (m && birthDay && parseInt(birthDay, 10) > daysInMonth(parseInt(m, 10))) {
                    setBirthDay('');
                  }
                  setErrors(prev => ({ ...prev, birthday: undefined as unknown as string }));
                }}
              >
                <option value="">Month</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <select
                className="form-input"
                value={birthDay}
                onChange={e => {
                  setBirthDay(e.target.value);
                  setErrors(prev => ({ ...prev, birthday: undefined as unknown as string }));
                }}
              >
                <option value="">Day</option>
                {Array.from(
                  { length: birthMonth ? daysInMonth(parseInt(birthMonth, 10)) : 31 },
                  (_, i) => i + 1,
                ).map(d => (
                  <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="setup-flow__field-error">{errors.birthday}</p>
        </div>
      </div>
    </>
  );

  const renderLicenseStep = () => {
    const birthMonth = monthLabelFromBirthday(formData.birthday);
    const iemaYearOptions = buildRecentYearOptions();
    return (
      <>
        <h2 className="setup-flow__title">Your license cycles</h2>
        <p className="setup-flow__subtitle">
          We use this to track your CE compliance against the right deadlines. You can skip and add this later.
        </p>
        <div className="setup-flow__body">
          <div className="w-full">
            <p className="setup-flow__mini-title">ARRT cycle</p>
            <p className="setup-flow__field-hint" style={{ marginLeft: 0, marginTop: 4 }}>
              {birthMonth
                ? <>Your ARRT cycle starts on the first day of your birth month (<span className="font-semibold">{birthMonth}</span>) and runs for 2 years.</>
                : <>Your ARRT cycle is anchored to your birth month and runs for 2 years.</>}
            </p>
          </div>
          <div className="form-field max-w-60 w-full">
            <label className="form-label">Year your current ARRT cycle began</label>
            <select
              className="form-input"
              value={formData.arrtCycleStartYear}
              onChange={e => setField('arrtCycleStartYear', e.target.value)}
            >
              <option value="">Select year…</option>
              {iemaYearOptions.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <p className="setup-flow__field-error">{errors.arrtCycleStartYear}</p>
          </div>

          <div className="w-full mt-6">
            <p className="setup-flow__mini-title">IEMA cycle</p>
            <p className="setup-flow__field-hint" style={{ marginLeft: 0, marginTop: 4 }}>
              Your IEMA cycle is anchored to the month you were first accredited and runs for 2 years.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="form-field max-w-60 w-full">
              <label className="form-label">Year your current IEMA cycle began</label>
              <select
                className="form-input"
                value={formData.iemaCycleStartYear}
                onChange={e => setField('iemaCycleStartYear', e.target.value)}
              >
                <option value="">Select year…</option>
                {iemaYearOptions.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
              <p className="setup-flow__field-error">{errors.iemaCycleStartYear}</p>
            </div>
            <div className="form-field max-w-60 w-full">
              <label className="form-label">Month your IEMA cycle ends</label>
              <select
                className="form-input"
                value={formData.iemaCycleEndMonth}
                onChange={e => setField('iemaCycleEndMonth', e.target.value)}
              >
                <option value="">Select month…</option>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <p className="setup-flow__field-hint">This is the same month you were first accredited.</p>
              <p className="setup-flow__field-error">{errors.iemaCycleEndMonth}</p>
            </div>
          </div>

          <div className="w-full mt-6">
            <p className="setup-flow__mini-title">Identification numbers</p>
            <p className="setup-flow__field-hint" style={{ marginLeft: 0, marginTop: 4 }}>
              Optional — your ARRT and IEMA registry or state ID numbers.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
            <div className="form-field w-full">
              <label className="form-label">
                ARRT identification number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. 1234567"
                value={formData.arrtIdNumber}
                onChange={e => setField('arrtIdNumber', e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="form-field w-full">
              <label className="form-label">
                IEMA identification number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. IL-12345"
                value={formData.iemaIdNumber}
                onChange={e => setField('iemaIdNumber', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderTeamStep = () => (
    <>
      <div className="setup-flow__mode-toggle">
        <button
          type="button"
          className={`setup-flow__mode-btn${teamMode === 'join' ? ' setup-flow__mode-btn--active' : ''}`}
          onClick={() => { setTeamMode('join'); setNewTeamErrors({}); setErrors({}); }}
        >
          Join a team
        </button>
        <button
          type="button"
          className={`setup-flow__mode-btn${teamMode === 'create' ? ' setup-flow__mode-btn--active' : ''}`}
          onClick={() => { setTeamMode('create'); setErrors({}); setNewTeamErrors({}); }}
        >
          Create a team
        </button>
      </div>

      <h2 className="setup-flow__title">
        {teamMode === 'join' ? 'Join your team' : 'Create a team'}
      </h2>
      <p className="setup-flow__subtitle">
        {teamMode === 'join'
          ? 'Enter the code provided by your team administrator.'
          : 'Set up a new team and invite others with the generated code.'}
      </p>

      {teamMode === 'join' ? (
        <div className="setup-flow__body">
          <div className="form-field">
            <label className="form-label">Team code</label>
            <input
              className="form-input"
              type="text"
              placeholder="AB12345"
              value={formData.teamCode}
              onChange={e => setField('teamCode', e.target.value.toUpperCase())}
            />
            <p className="setup-flow__field-error">
              {errors.teamCode
                || (formData.teamCode.trim() && !teamLookupLoading && !foundTeam
                  ? 'No matching team found for that code.'
                  : '')}
            </p>
          </div>

          {formData.teamCode.trim() && (
            teamLookupLoading ? (
              <p className="setup-flow__field-hint">Looking up team…</p>
            ) : foundTeam ? (
              <TeamCard
                name={foundTeam.name}
                code={formData.teamCode.trim()}
                manager={foundTeam.manager}
                color={foundTeam.color}
              />
            ) : null
          )}
        </div>
      ) : (
        <div className="setup-flow__body">
          <div className="form-field">
            <label className="form-label">Team name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Northwestern Radiology"
              value={newTeamName}
              onChange={e => { setNewTeamName(e.target.value); setNewTeamErrors(prev => ({ ...prev, newTeamName: '' })); }}
            />
            <p className="setup-flow__field-error">{newTeamErrors.newTeamName}</p>
          </div>

          <div className="form-field">
            <label className="form-label">Team ID</label>
            <div className="setup-flow__team-id-row">
              <input
                className="form-input"
                type="text"
                value={newTeamId}
                readOnly
              />
              <button
                type="button"
                className="setup-flow__team-code-btn"
                onClick={() => {
                  setNewTeamId(generateTeamId());
                  setRegenerateSpin(true);
                }}
                onAnimationEnd={() => setRegenerateSpin(false)}
              >
                <RotateCwIcon
                  size={18}
                  className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''}
                />
              </button>
              <div className="relative group">
                <button
                  type="button"
                  className={`setup-flow__team-code-btn${teamIdCopied ? ' setup-flow__team-code-btn--copied' : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(newTeamId);
                    setTeamIdCopied(true);
                    setTimeout(() => setTeamIdCopied(false), 2000);
                  }}
                >
                  <CopyIcon size={18} />
                </button>
                <span className="setup-flow__copy-tooltip">
                  {teamIdCopied ? 'Copied!' : 'Copy'}
                </span>
              </div>
            </div>
            <p className="setup-flow__field-hint">Auto-generated — share this with your team members.</p>
          </div>

          <div className="form-field">
            <label className="form-label">Team color <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="setup-flow__color-swatches">
              <button
                type="button"
                className={`setup-flow__color-swatch setup-flow__color-swatch--none${newTeamColor === null ? ' setup-flow__color-swatch--selected' : ''}`}
                title="No color"
                onClick={() => setNewTeamColor(null)}
              >
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
                  <line x1="9" y1="9" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`setup-flow__color-swatch${newTeamColor === c.value ? ' setup-flow__color-swatch--selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onClick={() => setNewTeamColor(prev => prev === c.value ? null : c.value)}
                />
              ))}
            </div>
          </div>


        </div>
      )}
    </>
  );

  const renderAvatarStep = () => (
    <>
      <h2 className="setup-flow__title">Make it yours</h2>
      <p className="setup-flow__subtitle">These fields are optional — you can always update them later.</p>
      <div className="setup-flow__body">

        <div className="w-full">
          <p className="setup-flow__mini-title">Customize your user avatar</p>
        </div>


        <div className="flex gap-12">
          <div className="form-field">
            <label className="form-label">Preview</label>
            <UserAvatar user={{ ...user, firstName: formData.firstName, lastName: formData.lastName, colorCode: formData.colorCode }} size="xl" />
          </div>
          <div className="form-field">
            <label className="form-label">Avatar color</label>
            <div className="setup-flow__color-swatches">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`setup-flow__color-swatch${formData.colorCode === c.value ? ' setup-flow__color-swatch--selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onClick={() => setField('colorCode', c.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full mt-10">
          <p className="setup-flow__mini-title">Where do you work?</p>
          <p className="setup-flow__subtitle">This helps team leaders keep track of their members.</p>
        </div>


        <div className="form-field">
          <label className="form-label">Hospital address</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. 123 Medical Dr, Chicago, IL"
            value={formData.hospitalAddress}
            onChange={e => setField('hospitalAddress', e.target.value)}
          />
        </div>
      </div>
    </>
  );

  const advance = () => {
    if (step === 1) {
      if (validatePage1()) setStep(2);
      return;
    }
    if (step === 2) {
      if (validateLicenseStep()) {
        setSkippedSteps(prev => {
          const next = new Set(prev);
          next.delete(2);
          return next;
        });
        setStep(3);
      }
      return;
    }
    if (step === 3) {
      setSkippedSteps(prev => {
        const next = new Set(prev);
        next.delete(3);
        return next;
      });
      setStep(4);
      return;
    }
    if (step === 4) {
      if (validateTeamStep()) handleFinish(false);
    }
  };

  const skipCurrent = () => {
    if (step === 4) {
      markSkipped(4);
      handleFinish(true);
      return;
    }
    markSkipped(step);
    setErrors({});
    setStep((step + 1) as Step);
  };

  const skippableStep = step === 2 || step === 3 || step === 4;

  return (
    <div className="setup-flow__overlay">
      <div className="setup-flow__panel">
        <div className="setup-flow__header">
          <div className="setup-flow__steps">
            {([1, 2, 3, 4] as const).map(n => (
              <div
                key={n}
                className={`setup-flow__step-pip${n <= step ? ' setup-flow__step-pip--active' : ''}`}
              />
            ))}
          </div>
          <p className="setup-flow__step-label">Step {step} of {TOTAL_STEPS}</p>
        </div>
        {step === 1 && renderProfileStep()}
        {step === 2 && renderLicenseStep()}
        {step === 3 && renderAvatarStep()}
        {step === 4 && renderTeamStep()}
        {submitError && <p className="setup-flow__error">{submitError}</p>}
        <div className="setup-flow__actions">
          <div className="setup-flow__actions-back">
            {step > 1 && (
              <button className="global-btn cancel-btn min-w-30" onClick={() => setStep(s => (s - 1) as Step)} disabled={submitting}>
                ← Back
              </button>
            )}
          </div>
          <div className="setup-flow__actions-next flex gap-3">
            {skippableStep && (
              <button className="global-btn default-btn outline min-w-30" onClick={skipCurrent} disabled={submitting}>
                Skip
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                className="global-btn default-btn min-w-30"
                onClick={advance}
                disabled={submitting}
              >
                Next →
              </button>
            ) : (
              <button className="global-btn default-btn min-w-30" onClick={advance} disabled={submitting}>
                {submitting ? 'Saving…' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupFlow;
