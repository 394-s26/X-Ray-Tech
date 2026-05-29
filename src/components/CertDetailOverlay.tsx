import { useEffect, useState } from 'react';
import { PencilIcon, XIcon } from '../services/svgIcons';
import { CertImagePlaceholder } from './CertImagePlaceholder';
import type { Certification } from '../types/certification';
import { updateCertificationRecord } from '../services/certificateService';

export type ExpiryTier = 'expired' | 'urgent' | 'warn' | 'ok';

export interface ExpiryStatus {
  tier: ExpiryTier;
  days: number;
}

export function expiryStatus(dateString: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateString + 'T00:00:00');
  const days = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { tier: 'expired', days };
  if (days < 30) return { tier: 'urgent', days };
  if (days < 90) return { tier: 'warn', days };
  return { tier: 'ok', days };
}

const STRIPE_COLOR: Record<ExpiryTier, string> = {
  expired: 'bg-red-500',
  urgent: 'bg-red-500',
  warn: 'bg-amber-500',
  ok: 'bg-emerald-500',
};

export const EXPIRY_BADGE: Record<ExpiryTier, string> = {
  expired: 'bg-[var(--danger-100)] text-[var(--danger-600)]',
  urgent: 'bg-[var(--warn-100)] text-[var(--warn-600)]',
  warn: 'bg-[var(--warn-100)] text-[var(--warn-600)]',
  ok: 'bg-[var(--success-100)] text-[var(--success-600)]',
};

export function formatExpiryDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysLabel(status: ExpiryStatus): string {
  if (status.tier === 'expired') {
    const n = Math.abs(status.days);
    return n === 1 ? '1 day ago' : `${n} days ago`;
  }
  if (status.days === 0) return 'today';
  return status.days === 1 ? 'in 1 day' : `in ${status.days} days`;
}

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-base font-semibold text-gray-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

export function CertDetailOverlay({
  cert,
  onClose,
  onPhotoView,
  startEditing = false,
  onCancelEdit,
  onSaved,
}: {
  cert: Certification;
  onClose: () => void;
  onPhotoView: (cert: Certification) => void;
  startEditing?: boolean;
  onCancelEdit?: () => void;
  onSaved?: (updated: Certification) => void;
}) {
  type FormState = {
    certName: string;
    provider: string;
    completedDate: string;
    expirationDate: string;
    ceCredits: string;
    categoryType: string;
  };

  const formFromCert = (): FormState => ({
    certName: cert.certificateName,
    provider: cert.providerName,
    completedDate: cert.completedDate,
    expirationDate: cert.expirationDate,
    ceCredits: String(cert.ceCredits),
    categoryType: cert.categoryType ?? '',
  });

  const [isEditing, setIsEditing] = useState(startEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(formFromCert);

  const status = expiryStatus(isEditing ? form.expirationDate : cert.expirationDate);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCancel = () => {
    setForm(formFromCert());
    if (onCancelEdit) {
      onCancelEdit();
      return;
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        certificateName: form.certName.trim(),
        providerName: form.provider.trim(),
        completedDate: form.completedDate,
        expirationDate: form.expirationDate,
        ceCredits: Number(form.ceCredits),
        categoryType: form.categoryType.trim() || null,
      };
      await updateCertificationRecord(cert.id, updates);
      if (onSaved) {
        onSaved({ ...cert, ...updates });
        return;
      }
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const thumbnailBtn = (
    <button
      type="button"
      onClick={() => onPhotoView(cert)}
      aria-label="View certificate photo"
      title="View certificate photo"
      className="shrink-0 w-full sm:w-32 self-stretch sm:self-start rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 cursor-pointer hover:border-primary/50 dark:hover:border-primary-light/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {cert.photoURL ? (
        <img src={cert.photoURL} alt="Certificate thumbnail" className="w-full h-32 sm:h-40 object-cover" />
      ) : (
        <div className="w-full h-32 sm:h-40">
          <CertImagePlaceholder />
        </div>
      )}
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
        className="overlay-panel overlay-panel--md rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!isEditing && <div className={`h-1.5 w-full ${STRIPE_COLOR[status.tier]}`} />}

        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
          {thumbnailBtn}

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {!isEditing && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-black dark:text-slate-100 leading-tight">
                      {cert.certificateName}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{cert.providerName}</p>
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

                <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${EXPIRY_BADGE[status.tier]}`}>
                  {status.tier === 'expired' ? 'Expired' : 'Expires'} {formatExpiryDate(cert.expirationDate)}
                  <span className="opacity-70">· {daysLabel(status)}</span>
                </span>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailField label="Completed" value={formatExpiryDate(cert.completedDate)} />
                  <DetailField label="CE Credits" value={String(cert.ceCredits)} />
                  {cert.categoryType && (
                    <DetailField label="Category Type" value={cert.categoryType} />
                  )}
                </div>
              </>
            )}

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <label className="form-label">Category type</label>
                    <select
                      className="form-input"
                      value={form.categoryType}
                      onChange={(e) => setForm((p) => ({ ...p, categoryType: e.target.value }))}
                      disabled={saving}
                    >
                      <option value="">Select…</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="N/A">N/A</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Only A and A+ count toward ARRT and IEMA CE requirements.</p>
                  </div>
                  <div className="form-field">
                    <label className="form-label">CE Credits</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-number"
                      value={form.ceCredits}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.]/g, '');
                        const first = raw.indexOf('.');
                        const cleaned =
                          first === -1
                            ? raw
                            : raw.slice(0, first + 1) + raw.slice(first + 1).replace(/\./g, '');
                        setForm((p) => ({ ...p, ceCredits: cleaned }));
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
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

export default CertDetailOverlay;
