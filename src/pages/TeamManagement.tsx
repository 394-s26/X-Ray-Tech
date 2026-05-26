import { useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { CopyIcon, RotateCwIcon, FilterIcon, TeamIcon } from '../services/svgIcons';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import {
  getTeamByCode,
  fetchAppUser,
  updateTeamCode,
} from '../services/authService';
import { TeamSetupCard } from '../components/TeamSetupCard';
import { FAKE_TEAM, type TeamEmployee } from '../data/team';
import '../styles/components/AccountSetupFlow.css';

interface TeamManagementProps {
  appUser: AppUser;
  onAppUserUpdate?: (user: AppUser) => void;
}

type Tier = 'red' | 'yellow' | 'green';

const DOT_COLOR: Record<Tier, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
};

const TEXT_COLOR: Record<Tier, string> = {
  red: 'text-red-600 dark:text-red-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  green: 'text-emerald-600 dark:text-emerald-400',
};

const STATUS_LABEL: Record<Tier, string> = {
  red: 'Action needed',
  yellow: 'Expiring soon',
  green: 'Licensed',
};

const RANK: Record<Tier, number> = { red: 0, yellow: 1, green: 2 };

function tierFromDate(dateString: string): Tier {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateString + 'T00:00:00');
  const days = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 30) return 'red';
  if (days < 90) return 'yellow';
  return 'green';
}

function overallTier(e: TeamEmployee): Tier {
  const a = tierFromDate(e.arrt.earliestExpiry);
  const i = tierFromDate(e.iema.earliestExpiry);
  return RANK[a] < RANK[i] ? a : i;
}

function soonestExpiry(e: TeamEmployee): string {
  return e.arrt.earliestExpiry <= e.iema.earliestExpiry
    ? e.arrt.earliestExpiry
    : e.iema.earliestExpiry;
}

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatBirthday(mmdd: string): string {
  const [m, d] = mmdd.split('-');
  if (!m || !d) return mmdd;
  const dt = new Date(2000, Number(m) - 1, Number(d));
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
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

const displayName = (e: TeamEmployee): string => `${e.firstName} ${e.lastName}`;

function darkenHex(hex: string, amount = 0.4): string {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount));
  const b = Math.round((num & 0xff) * (1 - amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

interface CategoryRowProps {
  label: string;
  expiryDate: string;
}

function CategoryRow({ label, expiryDate }: CategoryRowProps) {
  const tier = tierFromDate(expiryDate);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[tier]}`} />
      <span className="text-sm font-bold text-primary dark:text-slate-100 w-16 shrink-0">
        {label}
      </span>
      <span className={`text-sm font-semibold ml-auto ${TEXT_COLOR[tier]}`}>
        {formatDate(expiryDate)}
      </span>
    </div>
  );
}

interface EmployeeModalProps {
  employee: TeamEmployee;
  onClose: () => void;
}

function EmployeeModal({ employee, onClose }: EmployeeModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const overall = overallTier(employee);

  return (
    <div className="overlay-center" onClick={onClose}>
      <div
        className="overlay-panel overlay-panel--sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-primary dark:text-slate-100 tracking-tight">
              {displayName(employee)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Born {formatBirthday(employee.birthday)}
            </p>
          </div>
          <span
            className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${TEXT_COLOR[overall]}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
          >
            <span className={`w-2 h-2 rounded-full ${DOT_COLOR[overall]}`} />
            {STATUS_LABEL[overall]}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-2">
            Categories
          </p>
          <div>
            <CategoryRow label="ARRT" expiryDate={employee.arrt.earliestExpiry} />
            <CategoryRow label="IEMA" expiryDate={employee.iema.earliestExpiry} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="global-btn cancel-btn w-auto px-4"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface EmployeeRowProps {
  employee: TeamEmployee;
  onClick: () => void;
}

function EmployeeRow({ employee, onClick }: EmployeeRowProps) {
  const tier = overallTier(employee);
  const date = soonestExpiry(employee);
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
    >
      <span className={`w-3 h-3 rounded-full shrink-0 ${DOT_COLOR[tier]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-primary dark:text-slate-100 truncate">
          {displayName(employee)}
        </p>
        <p className={`text-[11px] font-semibold ${TEXT_COLOR[tier]}`}>
          {STATUS_LABEL[tier]}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Next expiry
        </p>
        <p className={`text-sm font-semibold ${TEXT_COLOR[tier]}`}>
          {formatDate(date)}
        </p>
      </div>
    </button>
  );
}

const TeamManagement = ({ appUser, onAppUserUpdate }: TeamManagementProps) => {
  const isManager = appUser.role === 'manager';

  const [team, setTeam] = useState<Team | null>(null);
  const [teamCode, setTeamCode] = useState(appUser.teamCode ?? '');
  const [leadName, setLeadName] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerateSpin, setRegenerateSpin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const [selected, setSelected] = useState<TeamEmployee | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Tier>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!appUser.teamCode) {
        if (!cancelled) {
          setTeam(null);
          setLoading(false);
        }
        return;
      }
      const t = await getTeamByCode(appUser.teamCode);
      if (cancelled) return;
      if (!t) {
        setLoading(false);
        return;
      }
      setTeam(t);
      setTeamCode(t.id);
      const lead = await fetchAppUser(t.teamLead);
      if (!cancelled && lead) {
        setLeadName(
          lead.firstName && lead.lastName
            ? `${lead.firstName} ${lead.lastName}`
            : lead.username,
        );
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser.teamCode]);

  const sortedTeam = useMemo(
    () =>
      [...FAKE_TEAM].sort((a, b) =>
        soonestExpiry(a).localeCompare(soonestExpiry(b)),
      ),
    [],
  );

  const filteredTeam = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedTeam.filter((emp) => {
      if (q && !displayName(emp).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && overallTier(emp) !== statusFilter) return false;
      return true;
    });
  }, [sortedTeam, search, statusFilter]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const handleRegenerate = async () => {
    if (!team) return;
    setRegenerateError(null);
    const newCode = generateTeamId(new Set([teamCode]));
    setRegenerating(true);
    setRegenerateSpin(true);
    try {
      const updatedTeam = await updateTeamCode(teamCode, newCode, appUser.uid);
      setTeam(updatedTeam);
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

  const hasNoTeam = !appUser.teamCode;

  // No-team state: show the setup card with its own header (no breadcrumb since there's no team to crumb to)
  if (hasNoTeam) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="You're not part of a team yet. Join one with a code, or create your own."
        />
        <TeamSetupCard
          appUser={appUser}
          onJoined={(updated) => onAppUserUpdate?.(updated)}
        />
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <Breadcrumb items={[{ name: 'Team', to: '' }]} />
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="Loading…"
        />
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-500 dark:text-slate-400">Loading team…</p>
        </div>
      </main>
    );
  }

  // Team code exists but team couldn't be found
  if (!team) {
    return (
      <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
        <Breadcrumb items={[{ name: 'Team', to: '' }]} />
        <PageHeader
          icon={<TeamIcon size={22} />}
          title="Your team"
          subtitle="We couldn't load your team."
        />
        <div className="card card--md card--glass">
          <p className="text-sm text-gray-700 dark:text-slate-200">
            We couldn't find the team for code{' '}
            <span className="font-mono">{appUser.teamCode}</span>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: team.name, to: '' }]} />

      <PageHeader
        icon={<TeamIcon size={22} />}
        title={team.name}
        subtitle={
          isManager
            ? 'Invite teammates and review their certification progress.'
            : 'View and manage your team members.'
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500 dark:text-slate-400">
          {leadName && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold"
              style={
                team.color
                  ? { backgroundColor: `${team.color}22`, color: darkenHex(team.color) }
                  : undefined
              }
            >
              Led by {leadName}
            </span>
          )}
          {leadName && <span className="text-gray-300 dark:text-slate-600">·</span>}
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
              Team code
            </span>
            <span
              className="font-mono font-semibold tracking-widest"
              style={team.color ? { color: darkenHex(team.color) } : undefined}
            >
              {teamCode}
            </span>
            <button
              type="button"
              title={codeCopied ? 'Copied!' : 'Copy team code'}
              onClick={handleCopy}
              className="cursor-pointer text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
            >
              <CopyIcon size={14} />
            </button>
            {isManager && (
              <button
                type="button"
                title="Regenerate team code"
                disabled={regenerating}
                onClick={handleRegenerate}
                onAnimationEnd={() => setRegenerateSpin(false)}
                className="cursor-pointer text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
              >
                <RotateCwIcon
                  size={14}
                  className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''}
                />
              </button>
            )}
          </span>
          {isManager && <span className="text-gray-300 dark:text-slate-600">·</span>}
          {isManager && (
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-label="Filter members"
              aria-expanded={filterOpen}
              className={
                'sm:ml-auto w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
                (filterOpen || activeFilterCount > 0
                  ? 'border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]')
              }
            >
              <FilterIcon size={14} />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[#7C49D5] dark:bg-[#A876FF] text-white text-[10px] tabular-nums leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
        {regenerateError && (
          <p className="text-xs text-red-500 mt-1">{regenerateError}</p>
        )}
      </div>

      {isManager && filterOpen && (
        <div className="mb-6">
          <div className="rounded-2xl glass-panel p-4 w-full">
            <div className="flex flex-col gap-3">
              <div className="form-field">
                <label className="form-label">Search by name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Member name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'red', 'yellow', 'green'] as const).map((s) => {
                    const active = statusFilter === s;
                    const label = s === 'all' ? 'All' : STATUS_LABEL[s as Tier];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={
                          'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ' +
                          (active
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600')
                        }
                      >
                        {s !== 'all' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s as Tier]}`} />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="card card--md card--glass">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-primary dark:text-slate-100">
              Team members
            </h2>
            {isManager && (
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                Sorted by soonest upcoming expiry
              </p>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            {isManager
              ? `${filteredTeam.length}${filteredTeam.length !== sortedTeam.length ? `/${sortedTeam.length}` : ''} members`
              : `${sortedTeam.length} members`}
          </p>
        </div>

        {isManager && (
          filteredTeam.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">
              No members match these filters.
            </p>
          ) : (
            <ul className="flex flex-col">
              {filteredTeam.map((emp) => (
                <li key={emp.id}>
                  <EmployeeRow employee={emp} onClick={() => setSelected(emp)} />
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {isManager && selected && (
        <EmployeeModal employee={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
};

export default TeamManagement;