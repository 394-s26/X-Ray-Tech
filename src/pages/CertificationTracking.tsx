import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Certification } from '../types/certification';
import { useCertifications } from '../hooks/useCertifications';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { PhotoOverlay } from '../components/PhotoOverlay';
import { CertDetailOverlay } from '../components/CertDetailOverlay';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { CertificateCard } from '../components/CertificateCard';
import { Toast } from '../components/Toast';
import {
  IdCardIcon,
  FilterIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from '../services/svgIcons';
import {
  EXPIRING_SOON_DAYS,
  getArchiveStatus,
  isArchived,
  unusedPointsByLicense,
} from '../services/archiveLogic';
import { deleteCertificationRecord } from '../services/certificateService';

type StatusFilter = 'all' | 'active' | 'expiringSoon';
type AgencyFilter = 'all' | 'ARRT' | 'IEMA' | 'CPR';

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 12;

interface AgencyConfig {
  key: Exclude<AgencyFilter, 'all'>;
  name: string;
  accent: string;
}

const AGENCIES: ReadonlyArray<AgencyConfig> = [
  { key: 'ARRT', name: 'ARRT', accent: '#1A4975' },
  { key: 'IEMA', name: 'IEMA', accent: '#0EA37E' },
  { key: 'CPR', name: 'CPR', accent: '#DC2626' },
];

function ExpiringSoonSummary({ count }: { count: number }) {
  return (
    <div
      className="nb-card px-4 py-3 flex flex-col gap-1 min-w-[12rem] shadow-none"
      style={{ boxShadow: 'none' }}
      title={`Certificates with less than ${EXPIRING_SOON_DAYS} days until expiration`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
        Expiring soon
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums leading-none">
          {count}
        </span>
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
          {count === 1 ? 'certificate' : 'certificates'}
        </span>
      </div>
      <p className="text-[10px] text-[var(--ink-500)] dark:text-[var(--ink-400)] leading-tight">
        Less than {EXPIRING_SOON_DAYS} days until expiration
      </p>
    </div>
  );
}

function UnusedPointsSummary({ arrt, iema }: { arrt: number; iema: number }) {
  const fmt = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
  return (
    <div
      className="nb-card px-4 py-3 flex flex-col gap-1 min-w-[12rem] shadow-none"
      style={{ boxShadow: 'none' }}
      title="Category A/A+ credits from non-expired certificates not yet reported to this license"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
        Unused points
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">ARRT</span>
        <span className="text-base font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums">
          {fmt(arrt)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">IEMA</span>
        <span className="text-base font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums">
          {fmt(iema)}
        </span>
      </div>
    </div>
  );
}

function AgencyFilterButton({
  agency,
  active,
  onClick,
}: {
  agency: AgencyConfig;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="px-3 py-1 rounded-full border text-xs font-semibold tracking-wide transition-colors whitespace-nowrap"
      style={{
        borderColor: agency.accent,
        backgroundColor: active ? agency.accent : 'transparent',
        color: active ? '#ffffff' : agency.accent,
      }}
    >
      {agency.name}
    </button>
  );
}

function getInt(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const CertificationTracking = () => {
  const { certifications, loading } = useCertifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [photoTarget, setPhotoTarget] = useState<Certification | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ cert: Certification; editing: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; detail?: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filterContainerRef.current?.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';
  const agencyFilter = (searchParams.get('cat') as AgencyFilter) || 'all';
  const typeFilter = searchParams.get('type') ?? 'all';
  const completedAfter = searchParams.get('after') ?? '';
  const completedBefore = searchParams.get('before') ?? '';
  const page = getInt(searchParams, 'page', 1);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const toggleAgency = (key: Exclude<AgencyFilter, 'all'>) => {
    setParam('cat', agencyFilter === key ? 'all' : key);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    setSearchParams(next, { replace: true });
  };

  const tracked = useMemo(
    () => certifications.filter((c) => !isArchived(c)),
    [certifications],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tracked
      .filter((c) => {
        if (q) {
          const hit =
            c.certificateName.toLowerCase().includes(q) ||
            (c.providerName ?? '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        const s = getArchiveStatus(c);
        if (statusFilter === 'active' && s.lifecycle !== 'active') return false;
        if (statusFilter === 'expiringSoon' && s.lifecycle !== 'expiringSoon') return false;

        if (agencyFilter !== 'all' && !c.categories.includes(agencyFilter)) {
          return false;
        }
        if (typeFilter !== 'all') {
          const t = (c.categoryType ?? '').trim().toUpperCase();
          if (t !== typeFilter.toUpperCase()) return false;
        }
        if (completedAfter && c.completedDate < completedAfter) return false;
        if (completedBefore && c.completedDate > completedBefore) return false;
        return true;
      })
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }, [tracked, search, statusFilter, agencyFilter, typeFilter, completedAfter, completedBefore]);

  const pageSize = isDesktop ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const activeCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (agencyFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (completedAfter ? 1 : 0) +
    (completedBefore ? 1 : 0);

  const unused = useMemo(
    () => unusedPointsByLicense(certifications),
    [certifications],
  );

  const expiringSoonCount = useMemo(
    () => tracked.reduce((n, c) => n + (getArchiveStatus(c).expiringSoon ? 1 : 0), 0),
    [tracked],
  );

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCertificationRecord(pendingDelete);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Certification Tracking', to: '' }]} />

      <div className="mt-2 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          icon={<IdCardIcon size={22} />}
          title="Certification Tracking"
          subtitle="Browse and manage certificates by issuing agency."
          className=""
        />
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
          <ExpiringSoonSummary count={expiringSoonCount} />
          <UnusedPointsSummary arrt={unused.arrt} iema={unused.iema} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
        <span>{loading ? '…' : `${filtered.length} certificate${filtered.length === 1 ? '' : 's'}`}</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
        <div ref={filterContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Filter records"
            aria-expanded={filtersOpen}
            className={
              'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
              (filtersOpen || activeCount > 0
                ? 'border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
                : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]')
            }
          >
            <FilterIcon size={14} />
            Filter
            {activeCount > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[#7C49D5] dark:bg-[#A876FF] text-white text-[10px] tabular-nums leading-none">
                {activeCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[var(--ink-200)] dark:border-[var(--ink-700)] bg-white/80 dark:bg-[#14111F]/80 backdrop-blur-md shadow-xl p-4"
              role="dialog"
              aria-label="Filter options"
            >
              <div className="grid grid-cols-1 gap-3">
                <div className="form-field">
                  <label className="form-label">Agency</label>
                  <div className="flex flex-nowrap gap-1.5">
                    {AGENCIES.map((agency) => (
                      <AgencyFilterButton
                        key={agency.key}
                        agency={agency}
                        active={agencyFilter === agency.key}
                        onClick={() => toggleAgency(agency.key)}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={statusFilter}
                    onChange={(e) => setParam('status', e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="expiringSoon">Expiring Soon</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={typeFilter}
                    onChange={(e) => setParam('type', e.target.value)}
                  >
                    <option value="all">Any</option>
                    <option value="A">A</option>
                    <option value="A+">A+</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Completed after</label>
                  <input
                    type="date"
                    className="form-input"
                    value={completedAfter}
                    onChange={(e) => setParam('after', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Completed before</label>
                  <input
                    type="date"
                    className="form-input"
                    value={completedBefore}
                    onChange={(e) => setParam('before', e.target.value)}
                  />
                </div>
              </div>
              {activeCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors inline-flex items-center gap-1"
                  >
                    <XIcon size={12} /> Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 relative w-full max-w-xs">
        <span className="absolute inset-y-0 left-3 flex items-center text-[var(--ink-500)] dark:text-[var(--ink-400)] pointer-events-none">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          className="form-input w-full"
          style={{ paddingLeft: '2.25rem', paddingRight: search ? '2rem' : '0.875rem' }}
          placeholder="Search certificate or provider name…"
          value={search}
          onChange={(e) => setParam('q', e.target.value)}
          aria-label="Search certificates"
        />
        {search && (
          <button
            type="button"
            onClick={() => setParam('q', '')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex items-center text-[var(--ink-400)] hover:text-[var(--ink-700)] dark:hover:text-[var(--ink-100)] transition-colors"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center py-12">
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center py-12">
          {tracked.length === 0
            ? 'No certificates being tracked. Add one via the + button.'
            : 'No certificates match these filters.'}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((c) => (
              <CertificateCard key={c.id} cert={c} onOpen={setPhotoTarget} />
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => setParam('page', String(Math.max(1, safePage - 1)))}
                disabled={safePage <= 1}
                className="w-9 h-9 grid place-items-center rounded-full border border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[var(--ink-600)] dark:text-[var(--ink-300)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] transition-colors"
                aria-label="Previous page"
              >
                <ChevronRightIcon size={16} className="rotate-180" />
              </button>
              <span className="text-xs font-semibold text-[var(--ink-600)] dark:text-[var(--ink-300)] tabular-nums px-2">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setParam('page', String(Math.min(totalPages, safePage + 1)))}
                disabled={safePage >= totalPages}
                className="w-9 h-9 grid place-items-center rounded-full border border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[var(--ink-600)] dark:text-[var(--ink-300)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] transition-colors"
                aria-label="Next page"
              >
                <ChevronRightIcon size={16} />
              </button>
            </nav>
          )}
        </>
      )}

      {photoTarget && (
        <PhotoOverlay
          cert={photoTarget}
          onClose={() => setPhotoTarget(null)}
          onEdit={(c) => {
            setPhotoTarget(null);
            setDetailTarget({ cert: c, editing: true });
          }}
          onDelete={(c) => {
            setPhotoTarget(null);
            setPendingDelete(c);
          }}
        />
      )}

      {detailTarget && (
        <CertDetailOverlay
          cert={detailTarget.cert}
          startEditing={detailTarget.editing}
          onClose={() => setDetailTarget(null)}
          onPhotoView={(c) => {
            setDetailTarget(null);
            setPhotoTarget(c);
          }}
          onCancelEdit={() => {
            const c = detailTarget.cert;
            setDetailTarget(null);
            setPhotoTarget(c);
          }}
          onSaved={(updated) => {
            setDetailTarget(null);
            setToast({
              message: 'Updates have been made',
              detail: isArchived(updated)
                ? 'This certificate is now fully used or expired. Find it in Archive.'
                : undefined,
            });
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          detail={toast.detail}
          onDismiss={() => setToast(null)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          cert={pendingDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
          deleting={deleting}
        />
      )}
    </main>
  );
};

export default CertificationTracking;
