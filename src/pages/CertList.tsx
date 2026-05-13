import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FilterIcon,
  XIcon,
} from '../services/svgIcons';
import type { CertificateCategory, Certification } from '../types/certification';
import { useCertifications } from '../hooks/useCertifications';
import { deleteCertificationRecord, updateCertificationRecord } from '../services/certificateService';

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
      </div>
    </article>
  );
}

const EXPIRY_BADGE: Record<ExpiryTier, string> = {
  expired: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  urgent:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  warn:    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  ok:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};

function PhotoOverlay({
  cert,
  onClose,
  onDetailView,
}: {
  cert: Certification;
  onClose: () => void;
  onDetailView: (cert: Certification) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay-center" onClick={onClose}>
      <div
        className="overlay-panel overlay-panel--md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-primary dark:text-slate-100 leading-tight min-w-0 truncate">
            {cert.certificateName}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onDetailView(cert)}
              aria-label="View record details"
              title="View record details"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <EyeIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-slate-800/60">
          <img
            src={cert.photoURL}
            alt={cert.certificateName}
            className="w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

function CertDetailOverlay({
  cert,
  onClose,
  onPhotoView,
  startEditing = false,
}: {
  cert: Certification;
  onClose: () => void;
  onPhotoView: (cert: Certification) => void;
  startEditing?: boolean;
}) {
  type FormState = {
    certName: string;
    provider: string;
    completedDate: string;
    expirationDate: string;
    ceCredits: string;
    categories: CertificateCategory[];
  };

  const formFromCert = (): FormState => ({
    certName: cert.certificateName,
    provider: cert.providerName,
    completedDate: cert.completedDate,
    expirationDate: cert.expirationDate,
    ceCredits: String(cert.ceCredits),
    categories: [...cert.categories],
  });

  const [isEditing, setIsEditing] = useState(startEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(formFromCert);

  const status = expiryStatus(isEditing ? form.expirationDate : cert.expirationDate);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCancel = () => { setForm(formFromCert()); setIsEditing(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCertificationRecord(cert.id, {
        certificateName: form.certName.trim(),
        providerName: form.provider.trim(),
        completedDate: form.completedDate,
        expirationDate: form.expirationDate,
        ceCredits: Number(form.ceCredits),
        categories: form.categories,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: CertificateCategory) =>
    setForm((prev) => {
      const already = prev.categories.includes(cat);
      if (already) return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
      if (cat === 'CPR') return { ...prev, categories: ['CPR'] };
      return { ...prev, categories: [...prev.categories.filter((c) => c !== 'CPR'), cat] };
    });

  const thumbnailBtn = (
    <button
      type="button"
      onClick={() => onPhotoView(cert)}
      aria-label="View certificate photo"
      title="View certificate photo"
      className="shrink-0 w-32 self-start rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 cursor-pointer hover:border-primary/50 dark:hover:border-primary-light/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <img src={cert.photoURL} alt="Certificate thumbnail" className="w-full h-40 object-cover" />
    </button>
  );

  const closeBtn = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      <XIcon size={16} />
    </button>
  );

  return (
    <div className="overlay-center" onClick={onClose}>
      <div
        className="overlay-panel overlay-panel--md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${STRIPE_COLOR[status.tier]}`} />

        <div className="p-6 flex gap-6">
          {thumbnailBtn}

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* ── View mode ── */}
            {!isEditing && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-primary dark:text-slate-100 leading-tight">
                      {cert.certificateName}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{cert.providerName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit record"
                      title="Edit record"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <PencilIcon size={15} />
                    </button>
                    {closeBtn}
                  </div>
                </div>

                <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${EXPIRY_BADGE[status.tier]}`}>
                  {status.tier === 'expired' ? 'Expired' : 'Expires'} {formatDate(cert.expirationDate)}
                  <span className="opacity-70">· {daysLabel(status)}</span>
                </span>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailField label="Completed" value={formatDate(cert.completedDate)} />
                  <DetailField label="CE Credits" value={String(cert.ceCredits)} />
                  <div className="col-span-2 flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {cert.categories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Edit mode ── */}
            {isEditing && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary select-none">
                    Edit Mode
                  </span>
                  {closeBtn}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-field">
                    <label className="form-label">Certificate name</label>
                    <input type="text" className="form-input" value={form.certName} onChange={(e) => setForm((p) => ({ ...p, certName: e.target.value }))} disabled={saving} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Provider</label>
                    <input type="text" className="form-input" value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} disabled={saving} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-field">
                      <label className="form-label">Date completed</label>
                      <input type="date" className="form-input" value={form.completedDate} max={form.expirationDate || undefined} onChange={(e) => setForm((p) => ({ ...p, completedDate: e.target.value }))} disabled={saving} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Expiry date</label>
                      <input type="date" className="form-input" value={form.expirationDate} min={form.completedDate || undefined} onChange={(e) => setForm((p) => ({ ...p, expirationDate: e.target.value }))} disabled={saving} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">CE Credits</label>
                    <input type="number" inputMode="decimal" min={0} step={0.5} className="form-number" value={form.ceCredits} onChange={(e) => setForm((p) => ({ ...p, ceCredits: e.target.value }))} disabled={saving} />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Categories</span>
                    <div className="flex gap-2">
                      {(['IEMA', 'ARRT', 'CPR'] as CertificateCategory[]).map((cat) => {
                        const isCprSelected = form.categories.includes('CPR');
                        const isArrtIemaSelected = form.categories.some((c) => c === 'ARRT' || c === 'IEMA');
                        const isGreyed =
                          (cat === 'CPR' && isArrtIemaSelected) ||
                          ((cat === 'ARRT' || cat === 'IEMA') && isCprSelected);
                        return (
                          <label
                            key={cat}
                            className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                              form.categories.includes(cat)
                                ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-slate-100'
                                : isGreyed
                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-600'
                                : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input type="checkbox" checked={form.categories.includes(cat)} onChange={() => toggleCategory(cat)} disabled={saving || isGreyed} className="form-checkbox" />
                            {cat}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={handleCancel} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-60">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  cert,
  onConfirm,
  onCancel,
  deleting,
}: {
  cert: Certification;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="overlay-center" onClick={onCancel}>
      <div
        className="overlay-panel overlay-panel--sm rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-primary dark:text-slate-100">Delete certificate?</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-snug">
          <span className="font-semibold text-gray-700 dark:text-slate-200">{cert.certificateName}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CertList({ name, fullName, accent, category }: CertListProps) {
  const { certifications, loading } = useCertifications(category);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expiryBefore, setExpiryBefore] = useState('');
  const [addedAfter, setAddedAfter] = useState('');
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

  const activeCount =
    (search.trim() ? 1 : 0) + (expiryBefore ? 1 : 0) + (addedAfter ? 1 : 0);

  const clearAll = () => {
    setSearch('');
    setExpiryBefore('');
    setAddedAfter('');
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-2 pb-16 px-5 lg:px-10 w-full max-w-md lg:max-w-5xl mx-auto">
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
          <span>{loading ? '…' : `${filtered.length} records`}</span>
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
        <div className="mb-6 rounded-2xl glass-panel p-4">
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
