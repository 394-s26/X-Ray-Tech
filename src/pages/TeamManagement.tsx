import { useState, useEffect } from 'react';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { TeamIcon } from '../services/svgIcons';
import { CopyIcon, RotateCwIcon } from '../services/svgIcons';
import {
  getTeamByCode,
  fetchAppUser,
  fetchUsersByUids,
  updateTeamCode,
} from '../services/authService';
import '../styles/components/AccountSetupFlow.css';

interface TeamManagementProps {
  appUser: AppUser;
}

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

const displayName = (u: AppUser): string =>
  u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username;

const TeamManagement = ({ appUser }: TeamManagementProps) => {
  const isManager = appUser.role === 'manager';

  const [team, setTeam] = useState<Team | null>(null);
  const [teamCode, setTeamCode] = useState(appUser.teamCode ?? '');
  const [leadName, setLeadName] = useState('');
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerateSpin, setRegenerateSpin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!appUser.teamCode) {
        if (!cancelled) setLoading(false);
        return;
      }
      const t = await getTeamByCode(appUser.teamCode!);
      if (cancelled) return;
      if (!t) { setLoading(false); return; }
      setTeam(t);
      setTeamCode(t.id);
      const lead = await fetchAppUser(t.teamLead);
      if (!cancelled && lead) setLeadName(displayName(lead));
      if (isManager && t.members.length > 0) {
        const m = await fetchUsersByUids(t.members);
        if (!cancelled) setMembers(m);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [appUser.teamCode, isManager]);

  const handleRegenerate = async () => {
    if (!team) return;
    setRegenerateError(null);
    const newCode = generateTeamId(new Set([teamCode]));
    setRegenerating(true);
    setRegenerateSpin(true);
    try {
      await updateTeamCode(teamCode, newCode, team, appUser.uid);
      setTeam(prev => prev ? { ...prev, id: newCode } : prev);
      setTeamCode(newCode);
    } catch {
      setRegenerateError('Failed to regenerate team code. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pb-16 px-5 lg:px-10 w-full max-w-5xl mx-auto">
      <header className="mt-2 mb-8 flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary">
          <TeamIcon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-50 leading-tight">
            {isManager ? 'Manage Team' : 'View Team'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isManager
              ? 'Invite teammates and review their certification progress.'
              : "Check out which team you're currently a part of."}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-500 dark:text-slate-400">Loading team…</p>
        </div>
      ) : !team ? (
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-700 dark:text-slate-200">
            You are not part of a team yet.
          </p>
        </div>
      ) : (
        <section className="card card--md card--glass flex flex-col gap-6">
          {/* Top row: team info left, team code right */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary dark:text-slate-100 leading-tight">
                {team.name}
              </h2>
              {leadName && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Led by {leadName}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <label className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                Team code
              </label>
              <div className="setup-flow__team-id-row">
                {isManager && (
                  <button
                    type="button"
                    className="setup-flow__team-code-btn"
                    title="Regenerate team code"
                    disabled={regenerating}
                    onClick={handleRegenerate}
                    onAnimationEnd={() => setRegenerateSpin(false)}
                  >
                    <RotateCwIcon
                      size={18}
                      className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''}
                    />
                  </button>
                )}
                <div className="relative group">
                  <button
                    type="button"
                    className={`setup-flow__team-code-btn${codeCopied ? ' setup-flow__team-code-btn--copied' : ''}`}
                    title="Copy team code"
                    onClick={handleCopy}
                  >
                    <CopyIcon size={18} />
                  </button>
                  <span className="setup-flow__copy-tooltip">
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </span>
                </div>
                <input
                  className="form-input font-mono tracking-widest w-32"
                  type="text"
                  value={teamCode}
                  readOnly
                />
              </div>
              {regenerateError && (
                <p className="text-xs text-red-500 mt-0.5">{regenerateError}</p>
              )}
            </div>
          </div>

          {/* Member section */}
          {isManager ? (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
                Members
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 italic">
                  No members yet.
                </p>
              ) : (
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">
                        Name
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr
                        key={m.uid}
                        className="border-b border-gray-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="py-2 text-gray-800 dark:text-slate-200">
                          {displayName(m)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-slate-300">
              This team has {team.members.length} member{team.members.length !== 1 ? 's' : ''}.
            </p>
          )}
        </section>
      )}
    </main>
  );
};

export default TeamManagement;
