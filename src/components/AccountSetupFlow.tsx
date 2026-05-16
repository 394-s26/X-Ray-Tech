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
}


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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
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

  const formatBirthdayPreview = (val: string): string | null => {
    const match = val.match(/^(\d{2})-(\d{2})$/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${monthName} ${day}${suffix}`;
  };

  const setField = <K extends keyof SetupFormData>(key: K, value: SetupFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined as unknown as string }));
  };

  const validatePage1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!formData.birthday.match(/^\d{2}-\d{2}$/)) errs.birthday = 'Enter a valid date (MM-DD).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePage2 = (): boolean => {
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

  const handleFinish = async (skip = false) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const update: Partial<AppUser> = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        birthday: formData.birthday,
        teamCode: teamMode === 'create' ? newTeamId : formData.teamCode.trim(),
        hospitalAddress: skip ? user.hospitalAddress ?? null : formData.hospitalAddress.trim() || null,
        colorCode: formData.colorCode,
        role: teamMode === 'create' ? 'manager' : 'member',
        setupCompleted: true,
      };
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
      await updateUserProfile(user.uid, update);
      onComplete({ ...user, ...update });
    } catch {
      setSubmitError('Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPage1 = () => (
    <>
      <h2 className="setup-flow__title">Let's set up your profile</h2>
      <p className="setup-flow__subtitle">What should we call you?</p>
      <div className="setup-flow__body">
        <div className="setup-flow__name-row flex gap-4 justify-between">
          <div className="form-field">
            <label className="form-label">First name</label>
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
            <label className="form-label">Last name</label>
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
          <p className="setup-flow__mini-title ">When is your birthday?</p>
          <p className="setup-flow__subtitle">We'll use this to determine when your license expires.</p>
        </div>

        <div className="setup-flow__birthday-field form-field max-w-45 w-full mt-2">
          <div className="relative">
            <input
              className="form-input"
              type="text"
              placeholder="MM-DD"
              maxLength={5}
              value={formData.birthday}
              onChange={e => {
                let val = e.target.value.replace(/[^\d-]/g, '');
                if (val.length === 2 && !val.includes('-') && formData.birthday.length === 1) {
                  val = val + '-';
                }
                setField('birthday', val);
              }}
            />
            {formatBirthdayPreview(formData.birthday) && (
              <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 italic pointer-events-none">
                {formatBirthdayPreview(formData.birthday)}
              </span>
            )}
          </div>
          <p className="setup-flow__field-error">{errors.birthday}</p>
        </div>
      </div>
    </>
  );

  const renderPage2 = () => (
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
            <p className="setup-flow__field-error">{errors.teamCode}</p>
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
            ) : (
              <p className="setup-flow__field-error">No matching team found for that code.</p>
            )
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

  const renderPage3 = () => (
    <>
      <h2 className="setup-flow__title">Almost done!</h2>
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

  return (
    <div className="setup-flow__overlay">
      <div className="setup-flow__panel">
        <div className="setup-flow__header">
          <div className="setup-flow__steps">
            {([1, 2, 3] as const).map(n => (
              <div
                key={n}
                className={`setup-flow__step-pip${n <= step ? ' setup-flow__step-pip--active' : ''}`}
              />
            ))}
          </div>
          <p className="setup-flow__step-label">Step {step} of 3</p>
        </div>
        {step === 1 && renderPage1()}
        {step === 2 && renderPage2()}
        {step === 3 && renderPage3()}
        {submitError && <p className="setup-flow__error">{submitError}</p>}
        <div className="setup-flow__actions">
          <div className="setup-flow__actions-back">
            {step > 1 && (
              <button className="global-btn cancel-btn min-w-30" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} disabled={submitting}>
                ← Back
              </button>
            )}
          </div>
          <div className="setup-flow__actions-next flex gap-3">
            {step === 3 && (
              <button className="global-btn default-btn outline min-w-30" onClick={() => handleFinish(true)} disabled={submitting}>
                Skip
              </button>
            )}
            {step < 3 ? (
              <button
                className="global-btn default-btn min-w-30"
                onClick={() => {
                  if (step === 1 && validatePage1()) setStep(2);
                  if (step === 2 && validatePage2()) setStep(3);
                }}
              >
                Next →
              </button>
            ) : (
              <button className="global-btn default-btn min-w-30" onClick={() => handleFinish(false)} disabled={submitting}>
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
