import { useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { CopyIcon, RotateCwIcon, FilterIcon } from '../services/svgIcons';
import {
  getTeamByCode,
  fetchAppUser,
  updateTeamCode,
} from '../services/authService';
import { FAKE_TEAM, type TeamEmployee } from '../data/team';
import '../styles/components/AccountSetupFlow.css';

interface TeamManagementProps {
  appUser: AppUser;
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
      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
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

const TeamManagement = ({ appUser }: TeamManagementProps) => {
  const isManager = appUser.role === 'manager';

  const [team, setTeam] = useState<Team | null>(null);
  const [teamCode, setTeamCode] = useState(appUser.teamCode ?? '');
  const [leadName, setLeadName] = useState('');
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
      if (!appUser.teamCode) return;
      const t = await getTeamByCode(appUser.teamCode);
      if (cancelled || !t) return;
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

  return (
    <main className="min-h-[calc(100vh-6rem)] pb-16 px-5 lg:px-10 w-full max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mt-2 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-primary dark:text-slate-50 leading-tight tracking-tight">
            {team?.name ?? 'Your team'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
            {leadName && <span>Led by {leadName}</span>}
            {team && leadName && <span className="text-gray-300 dark:text-slate-600">·</span>}
            {team && (
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                  Team code
                </span>
                <span className="font-mono font-semibold text-primary dark:text-slate-200 tracking-widest">
                  {teamCode}
                </span>
                <button
                  type="button"
                  title={codeCopied ? 'Copied!' : 'Copy team code'}
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
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
                    className="text-gray-400 hover:text-primary dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <RotateCwIcon
                      size={14}
                      className={regenerateSpin ? 'setup-flow__regenerate-spin' : ''}
                    />
                  </button>
                )}
              </span>
            )}
          </div>
          {regenerateError && (
            <p className="text-xs text-red-500 mt-1">{regenerateError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          aria-label="Filter members"
          aria-expanded={filterOpen}
          className={
            'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
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
      </div>

      {filterOpen && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-4 flex flex-col gap-3">
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
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
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
      )}

      <section className="card card--md card--glass">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-primary dark:text-slate-100">
              Team members
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Sorted by soonest upcoming expiry
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            {filteredTeam.length}
            {filteredTeam.length !== sortedTeam.length && `/${sortedTeam.length}`} members
          </p>
        </div>

        {filteredTeam.length === 0 ? (
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
        )}
      </section>

      {selected && (
        <EmployeeModal employee={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
};

export default TeamManagement;
