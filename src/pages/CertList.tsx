import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FilterIcon,
} from '../services/svgIcons';
import type { CertRecord } from '../data/certs';

export interface CertListProps {
  name: string;
  fullName: string;
  accent: string;
  records: CertRecord[];
}

type ExpiryTier = 'expired' | 'urgent' | 'warn' | 'ok';

interface ExpiryStatus {
  tier: ExpiryTier;
  days: number;
}

function expiryStatus(dateString: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateString + 'T00:00:00');
  const days = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { tier: 'expired', days };
  if (days < 30) return { tier: 'urgent', days };
  if (days < 90) return { tier: 'warn', days };
  return { tier: 'ok', days };
}

const TEXT_COLOR: Record<ExpiryTier, string> = {
  expired: 'text-red-600 dark:text-red-400',
  urgent: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-600 dark:text-amber-400',
  ok: 'text-emerald-600 dark:text-emerald-400',
};

const STRIPE_COLOR: Record<ExpiryTier, string> = {
  expired: 'bg-red-500',
  urgent: 'bg-red-500',
  warn: 'bg-amber-500',
  ok: 'bg-emerald-500',
};

function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysLabel(status: ExpiryStatus): string {
  if (status.tier === 'expired') {
    const n = Math.abs(status.days);
    return n === 1 ? '1 day ago' : `${n} days ago`;
  }
  if (status.days === 0) return 'today';
  return status.days === 1 ? 'in 1 day' : `in ${status.days} days`;
}

interface IconButtonProps {
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}

function IconButton({ label, danger, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        'w-8 h-8 flex items-center justify-center rounded-full transition-colors ' +
        (danger
          ? 'text-gray-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10'
          : 'text-gray-500 dark:text-slate-400 hover:text-primary hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-700')
      }
    >
      {children}
    </button>
  );
}

function CertRow({ record }: { record: CertRecord }) {
  const status = expiryStatus(record.expiryDate);
  return (
    <article className="relative rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex items-stretch">
      <div className={`w-1.5 shrink-0 ${STRIPE_COLOR[status.tier]}`} />
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-primary dark:text-slate-100 leading-tight min-w-0">
            {record.name}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <IconButton label="View photo">
              <PhotoIcon size={15} />
            </IconButton>
            <IconButton label="View record">
              <EyeIcon size={15} />
            </IconButton>
            <IconButton label="Edit record">
              <PencilIcon size={15} />
            </IconButton>
            <IconButton label="Delete record" danger>
              <TrashIcon size={15} />
            </IconButton>
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            {status.tier === 'expired' ? 'Expired' : 'Expires'}
          </span>
          <span className={`text-lg font-extrabold tracking-tight ${TEXT_COLOR[status.tier]}`}>
            {formatDate(record.expiryDate)}
          </span>
          <span className={`text-xs font-medium ${TEXT_COLOR[status.tier]} opacity-80`}>
            · {daysLabel(status)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function CertList({ name, fullName, accent, records }: CertListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expiryBefore, setExpiryBefore] = useState('');
  const [addedAfter, setAddedAfter] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (expiryBefore && r.expiryDate > expiryBefore) return false;
      if (addedAfter && r.addedDate < addedAfter) return false;
      return true;
    });
  }, [records, search, expiryBefore, addedAfter]);

  const activeCount =
    (search.trim() ? 1 : 0) + (expiryBefore ? 1 : 0) + (addedAfter ? 1 : 0);

  const clearAll = () => {
    setSearch('');
    setExpiryBefore('');
    setAddedAfter('');
  };

  return (
    <main className="min-h-screen pt-20 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-5xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeftIcon size={14} />
        Dashboard
      </Link>

      <header className="mt-3 mb-7">
        <h1
          className="text-6xl font-black tracking-tight leading-none"
          style={{ color: accent }}
        >
          {name}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-snug">
          {fullName}
        </p>
        <div className="mt-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
          <span>{filtered.length} records</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Filter records"
            aria-expanded={filtersOpen}
            className={
              'flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ' +
              (filtersOpen || activeCount > 0
                ? 'text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
                : 'text-gray-400 dark:text-slate-500 hover:text-[#7C49D5] dark:hover:text-[#A876FF]')
            }
          >
            <FilterIcon size={14} />
            {activeCount > 0 && (
              <span className="text-[10px] font-bold tabular-nums leading-none">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {filtersOpen && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="form-field lg:col-span-2">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Certificate name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Expiring by</label>
              <input
                type="date"
                className="form-input"
                value={expiryBefore}
                onChange={(e) => setExpiryBefore(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Added since</label>
              <input
                type="date"
                className="form-input"
                value={addedAfter}
                onChange={(e) => setAddedAfter(e.target.value)}
              />
            </div>
          </div>
          {activeCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center py-12">
          No records match these filters.
        </p>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {filtered.map((r) => (
            <CertRow key={r.id} record={r} />
          ))}
        </section>
      )}
    </main>
  );
}
