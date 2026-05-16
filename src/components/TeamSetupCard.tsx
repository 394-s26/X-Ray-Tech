import { useState, useEffect } from 'react';
import type { AppUser } from '../types/auth';
import { CopyIcon, RotateCwIcon } from '../services/svgIcons';
import {
  getTeamByCode,
  fetchUsersByUids,
  createTeam,
  addMemberToTeam,
  updateUserProfile,
} from '../services/authService';
import { COLORS } from '../utils/colors';

const generateTeamId = (existingIds: Set<string>): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let id: string;
  do {
    id =
      letters[Math.floor(Math.random() * 26)] +
      letters[Math.floor(Math.random() * 26)] +
      Array.from({ length: 5 }, () => digits[Math.floor(Math.random() * 10)]).join('');
  } while (existingIds.has(id));
  return id;
};

interface TeamSetupCardProps {
  appUser: AppUser;
  onJoined: (updated: AppUser) => void;
  /** When 'plain', omits the outer card wrapper so a parent surface (modal, panel) can host it. */
  variant?: 'card' | 'plain';
  /** Hide the heading + description (useful when the parent already provides context). */
  hideHeading?: boolean;
}

export const TeamSetupCard = ({
  appUser,
  onJoined,
  variant = 'card',
  hideHeading = false,
}: TeamSetupCardProps) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [foundTeam, setFoundTeam] = useState<{ name: string; manager: string; color: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamId, setNewTeamId] = useState(() => generateTeamId(new Set()));
  const [newTeamColor, setNewTeamColor] = useState<string | null>(null);
  const [regenerateSpin, setRegenerateSpin] = useState(false);
  const [teamIdCopied, setTeamIdCopied] = useState(false);

  useEffect(() => {
    const trimmed = code.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (!trimmed) { setFoundTeam(null); setLookupLoading(false); return; }
      setLookupLoading(true);
      const team = await getTeamByCode(trimmed);
      if (cancelled) return;
      if (!team) { setFoundTeam(null); setLookupLoading(false); return; }
      const leads = await fetchUsersByUids([team.teamLead]);
      if (cancelled) return;
      const lead = leads[0];
      const managerName = lead
        ? [lead.firstName, lead.lastName].filter(Boolean).join(' ') || (lead.email ?? 'Unknown')
        : 'Unknown';
      setFoundTeam({ name: team.name, manager: managerName, color: team.color ?? '' });
      setLookupLoading(false);
    }, trimmed ? 400 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code]);

  const handleJoin = async () => {
    if (!code.trim()) { setErrors({ code: 'Team code is required.' }); return; }
    if (!foundTeam) { setErrors({ code: 'No matching team found for that code.' }); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addMemberToTeam(code.trim(), appUser.uid);
      const update: Partial<AppUser> = { teamCode: code.trim().toUpperCase(), role: 'member' };
      await updateUserProfile(appUser.uid, update);
      onJoined({ ...appUser, ...update });
    } catch {
      setSubmitError('Could not join team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!newTeamName.trim()) { setErrors({ newTeamName: 'Team name is required.' }); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createTeam({
        id: newTeamId,
        name: newTeamName.trim(),
        color: newTeamColor ?? '',
        teamLead: appUser.uid,
        members: [],
      });
      const update: Partial<AppUser> = { teamCode: newTeamId, role: 'manager' };
      await updateUserProfile(appUser.uid, update);
      onJoined({ ...appUser, ...update });
    } catch {
      setSubmitError('Could not create team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inner = (
    <>
      {!hideHeading && (
        <div>
          <h2 className="text-xl font-bold text-primary dark:text-slate-100">
            Get connected with a team
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Ask your X-Ray technologist manager or team leader to share their unique team code so you can join. Don't have one? Create a team and invite others yourself.
          </p>
        </div>
      )}

      <div className="setup-flow__mode-toggle self-start">
        <button
          type="button"
          className={`setup-flow__mode-btn${mode === 'join' ? ' setup-flow__mode-btn--active' : ''}`}
          onClick={() => { setMode('join'); setErrors({}); setSubmitError(null); }}
        >
          Join a team
        </button>
        <button
          type="button"
          className={`setup-flow__mode-btn${mode === 'create' ? ' setup-flow__mode-btn--active' : ''}`}
          onClick={() => { setMode('create'); setErrors({}); setSubmitError(null); }}
        >
          Create a team
        </button>
      </div>

      {mode === 'join' ? (
        <div className="flex flex-col gap-4">
          <div className="form-field max-w-sm">
            <label className="form-label">
              Team code <span className="text-red-500">*</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="AB12345"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setErrors({}); }}
            />
            <p className="setup-flow__field-error">
              {errors.code
                || (code.trim() && !lookupLoading && !foundTeam
                  ? 'No matching team found for that code.'
                  : '')}
            </p>
          </div>

          {code.trim() && (
            lookupLoading ? (
              <p className="setup-flow__field-hint">Looking up team…</p>
            ) : foundTeam ? (
              <div className="setup-flow__team-card max-w-md">
                <div className="setup-flow__team-card-stripe" style={{ backgroundColor: foundTeam.color }} />
                <div className="setup-flow__team-card-body">
                  <div className="flex flex-col gap-0.5">
                    <span className="setup-flow__team-name">{foundTeam.name}</span>
                    <span className="setup-flow__team-code">{code.trim()}</span>
                  </div>
                  <span className="setup-flow__team-manager">{foundTeam.manager}</span>
                </div>
              </div>
            ) : null
          )}

          {submitError && <p className="text-xs text-red-500">{submitError}</p>}

          <button
            type="button"
            className="global-btn default-btn self-start min-w-30"
            onClick={handleJoin}
            disabled={submitting}
          >
            {submitting ? 'Joining…' : 'Join team'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-md">
          <div className="form-field">
            <label className="form-label">
              Team name <span className="text-red-500">*</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Northwestern Radiology"
              value={newTeamName}
              onChange={e => { setNewTeamName(e.target.value); setErrors(prev => ({ ...prev, newTeamName: '' })); }}
            />
            <p className="setup-flow__field-error">{errors.newTeamName}</p>
          </div>

          <div className="form-field">
            <label className="form-label">Team ID</label>
            <div className="setup-flow__team-id-row">
              <input className="form-input" type="text" value={newTeamId} readOnly />
              <button
                type="button"
                className="setup-flow__team-code-btn"
                onClick={() => { setNewTeamId(generateTeamId(new Set([newTeamId]))); setRegenerateSpin(true); }}
                onAnimationEnd={() => setRegenerateSpin(false)}
              >
                <RotateCwIcon size={18} className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''} />
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

          {submitError && <p className="text-xs text-red-500">{submitError}</p>}

          <button
            type="button"
            className="global-btn default-btn self-start min-w-30"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create team'}
          </button>
        </div>
      )}
    </>
  );

  if (variant === 'plain') {
    return <div className="flex flex-col gap-4">{inner}</div>;
  }

  return (
    <div className="card card--md card--glass flex flex-col gap-4">
      {inner}
    </div>
  );
};

export default TeamSetupCard;
