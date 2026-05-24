import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
  CertificateIcon,
} from '../services/svgIcons';
import type { CertificateCategory, Certification } from '../types/certification';
import { useCertifications } from '../hooks/useCertifications';
import { deleteCertificationRecord } from '../services/certificateService';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { PhotoOverlay } from '../components/PhotoOverlay';
import { CertDetailOverlay } from '../components/CertDetailOverlay';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import arrtLogo from '../assets/arrt.png';
import iemaLogo from '../assets/iema.png';

const CATEGORY_LOGOS: Partial<Record<CertificateCategory, string>> = {
  ARRT: arrtLogo,
  IEMA: iemaLogo,
};


export interface CertListProps {
  name: string;
  fullName: string;
  accent: string;
  category: CertificateCategory;
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


function CertRow({
  cert,
  onPhotoView,
  onView,
  onEdit,
  onDeleteRequest,
}: {
  cert: Certification;
  onPhotoView: (cert: Certification) => void;
  onView: (cert: Certification) => void;
  onEdit: (cert: Certification) => void;
  onDeleteRequest: (cert: Certification) => void;
}) {
  const status = expiryStatus(cert.expirationDate);
  return (
    <article className="relative rounded-2xl glass-panel hover:shadow-md transition-shadow overflow-hidden flex items-stretch">
      <div className={`w-1.5 shrink-0 ${STRIPE_COLOR[status.tier]}`} />
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-primary dark:text-slate-100 leading-tight min-w-0">
            {cert.certificateName}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label="View photo"
              title="View photo"
              onClick={() => onPhotoView(cert)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-primary hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-700"
            >
              <PhotoIcon size={15} />
            </button>
            <button
              type="button"
              aria-label="View record"
              title="View record"
              onClick={() => onView(cert)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-primary hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-700"
            >
              <EyeIcon size={15} />
            </button>
            <button
              type="button"
              aria-label="Edit record"
              title="Edit record"
              onClick={() => onEdit(cert)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-primary hover:bg-gray-100 dark:hover:text-slate-100 dark:hover:bg-slate-700"
            >
              <PencilIcon size={15} />
            </button>
            <button
              type="button"
              aria-label="Delete record"
              title="Delete record"
              onClick={() => onDeleteRequest(cert)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10"
            >
              <TrashIcon size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            {status.tier === 'expired' ? 'Expired' : 'Expires'}
          </span>
          <span className={`text-lg font-extrabold tracking-tight ${TEXT_COLOR[status.tier]}`}>
            {formatDate(cert.expirationDate)}
          </span>
          <span className={`text-xs font-medium ${TEXT_COLOR[status.tier]} opacity-80`}>
            · {daysLabel(status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cert.categories.map((cat) => (
            <span key={cat} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
              {cat}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}


export default function CertList({ name, fullName, category }: CertListProps) {
  const { certifications, loading } = useCertifications(category);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [expiryBefore, setExpiryBefore] = useState('');
  const [addedAfter, setAddedAfter] = useState('');

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
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [photoTarget, setPhotoTarget] = useState<Certification | null>(null);

  const viewingId = searchParams.get('certificate');
  const startEditing = searchParams.get('edit') === '1';
  const viewingCert = viewingId ? (certifications.find((c) => c.id === viewingId) ?? null) : null;

  const openOverlay = (cert: Certification) =>
    setSearchParams({ certificate: cert.id }, { replace: false });

  const openEditOverlay = (cert: Certification) =>
    setSearchParams({ certificate: cert.id, edit: '1' }, { replace: false });

  const closeOverlay = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('certificate');
      next.delete('edit');
      return next;
    }, { replace: true });
  };

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certifications.filter((c) => {
      if (q && !c.certificateName.toLowerCase().includes(q)) return false;
      if (expiryBefore && c.expirationDate > expiryBefore) return false;
      if (addedAfter && c.completedDate < addedAfter) return false;
      return true;
    });
  }, [certifications, search, expiryBefore, addedAfter]);

  const activeCount = (expiryBefore ? 1 : 0) + (addedAfter ? 1 : 0);

  const clearAll = () => {
    setExpiryBefore('');
    setAddedAfter('');
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { name: 'Certification Tracking', to: '/certificates' },
          { name, to: '' },
        ]}
      />

      {CATEGORY_LOGOS[category] ? (
        <div className="mt-2 mb-4 flex items-end gap-2 flex-wrap">
          <img
            src={CATEGORY_LOGOS[category]}
            alt={name}
            className="h-12 sm:h-14 w-auto object-contain shrink-0"
          />
          <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 leading-tight pb-1">
            {fullName}
          </p>
        </div>
      ) : (
        <PageHeader
          icon={<CertificateIcon size={22} />}
          title={name}
          subtitle={fullName}
          className="mt-2 mb-4"
        />
      )}

      <div className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
        <span>{loading ? '…' : `${filtered.length} records`}</span>
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
          placeholder="Search certificate name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search certificates"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
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
          {certifications.length === 0
            ? 'No certificates yet. Add one via the + button.'
            : 'No records match these filters.'}
        </p>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {filtered.map((c) => (
            <CertRow key={c.id} cert={c} onPhotoView={setPhotoTarget} onView={openOverlay} onEdit={openEditOverlay} onDeleteRequest={setPendingDelete} />
          ))}
        </section>
      )}

      {viewingCert && (
        <CertDetailOverlay
          cert={viewingCert}
          onClose={closeOverlay}
          onPhotoView={(c) => { closeOverlay(); setPhotoTarget(c); }}
          startEditing={startEditing}
        />
      )}

      {photoTarget && (
        <PhotoOverlay
          cert={photoTarget}
          onClose={() => setPhotoTarget(null)}
          onDetailView={(c) => { setPhotoTarget(null); openOverlay(c); }}
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
}
