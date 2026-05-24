import { useEffect, useState } from 'react';
import { PencilIcon, XIcon } from '../services/svgIcons';
import type { CertificateCategory, Certification } from '../types/certification';
import { updateCertificationRecord } from '../services/certificateService';

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

const STRIPE_COLOR: Record<ExpiryTier, string> = {
  expired: 'bg-red-500',
  urgent: 'bg-red-500',
  warn: 'bg-amber-500',
  ok: 'bg-emerald-500',
};

const EXPIRY_BADGE: Record<ExpiryTier, string> = {
  expired: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
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

function DetailField({ label, value }: { label: string; value: string }) {
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
    categoryType: string;
    assignedCertifications: CertificateCategory[];
  };

  const formFromCert = (): FormState => ({
    certName: cert.certificateName,
    provider: cert.providerName,
    completedDate: cert.completedDate,
    expirationDate: cert.expirationDate,
    ceCredits: String(cert.ceCredits),
    categoryType: cert.categoryType ?? '',
    assignedCertifications: [...cert.categories],
  });

  const [isEditing, setIsEditing] = useState(startEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(formFromCert);
  const [restrictionModalMessage, setRestrictionModalMessage] = useState<string | null>(null);

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
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCertificationRecord(cert.id, {
        certificateName: form.certName.trim(),
        providerName: form.provider.trim(),
        completedDate: form.completedDate,
        expirationDate: form.expirationDate,
        ceCredits: Number(form.ceCredits),
        categoryType: form.categoryType.trim() || null,
        categories: form.assignedCertifications,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: CertificateCategory) =>
    setForm((prev) => {
      const already = prev.assignedCertifications.includes(cat);
      if (already) {
        if (prev.assignedCertifications.length === 1) {
          return prev;
        }
        return {
          ...prev,
          assignedCertifications: prev.assignedCertifications.filter((c) => c !== cat),
        };
      }

      const wasCreatedForArrtOrIema =
        cert.categories.includes('ARRT') || cert.categories.includes('IEMA');
      const wasCreatedForCprOnly =
        cert.categories.includes('CPR') &&
        !cert.categories.includes('ARRT') &&
        !cert.categories.includes('IEMA');

      if (cat === 'CPR' && wasCreatedForArrtOrIema) {
        setRestrictionModalMessage(
          'This certificate was created for ARRT or IEMA. To convert it to CPR, delete this upload first and re-upload it as CPR.',
        );
        return prev;
      }

      if (cat !== 'CPR' && wasCreatedForCprOnly) {
        setRestrictionModalMessage(
          'This certificate was created as CPR. To convert it to ARRT or IEMA, delete this upload first and re-upload it for the target license.',
        );
        return prev;
      }

      if (cat === 'CPR') return { ...prev, assignedCertifications: ['CPR'] };
      return {
        ...prev,
        assignedCertifications: [...prev.assignedCertifications.filter((c) => c !== 'CPR'), cat],
      };
    });

  const thumbnailBtn = (
    <button
      type="button"
      onClick={() => onPhotoView(cert)}
      aria-label="View certificate photo"
      title="View certificate photo"
      className="shrink-0 w-full sm:w-32 self-stretch sm:self-start rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 cursor-pointer hover:border-primary/50 dark:hover:border-primary-light/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <img src={cert.photoURL} alt="Certificate thumbnail" className="w-full h-32 sm:h-40 object-cover" />
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
        <div className={`h-1.5 w-full ${STRIPE_COLOR[status.tier]}`} />

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
                  {status.tier === 'expired' ? 'Expired' : 'Expires'} {formatDate(cert.expirationDate)}
                  <span className="opacity-70">· {daysLabel(status)}</span>
                </span>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <DetailField label="Completed" value={formatDate(cert.completedDate)} />
                  <DetailField label="CE Credits" value={String(cert.ceCredits)} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                      Assigned Certifications
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {cert.categories.map((cat) => (
                        <span key={cat} className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
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
                  <div className="form-field">
                    <span className="form-label">Assigned Certifications</span>
                    <div className="flex gap-2">
                      {(['IEMA', 'ARRT', 'CPR'] as CertificateCategory[]).map((cat) => {
                        const isCprSelected = form.assignedCertifications.includes('CPR');
                        const isArrtIemaSelected = form.assignedCertifications.some((c) => c === 'ARRT' || c === 'IEMA');
                        const certWasCreatedForCprOnly =
                          cert.categories.includes('CPR') &&
                          !cert.categories.includes('ARRT') &&
                          !cert.categories.includes('IEMA');
                        const isGreyed =
                          cat !== 'CPR' && isCprSelected && !certWasCreatedForCprOnly;
                        const cprBlocked =
                          cat === 'CPR' &&
                          isArrtIemaSelected &&
                          (cert.categories.includes('ARRT') || cert.categories.includes('IEMA'));
                        const cprToLicenseBlocked =
                          cat !== 'CPR' &&
                          certWasCreatedForCprOnly;
                        const isOnlySelected =
                          form.assignedCertifications.includes(cat) &&
                          form.assignedCertifications.length === 1;
                        return (
                          <label
                            key={cat}
                            className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                              form.assignedCertifications.includes(cat)
                                ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-slate-100'
                                : cprBlocked || cprToLicenseBlocked
                                ? 'cursor-pointer border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                                : isGreyed
                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-600'
                                : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                            } ${saving || isOnlySelected ? 'opacity-90' : ''}`}
                          >
                            <input type="checkbox" checked={form.assignedCertifications.includes(cat)} onChange={() => toggleCategory(cat)} disabled={saving || isGreyed || isOnlySelected} className="form-checkbox" />
                            {cat}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      CPR is exclusive; certificates cannot be converted between CPR and ARRT/IEMA. At least one license must remain selected.
                    </p>
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
      {restrictionModalMessage && (
        <div className="overlay-center" onClick={() => setRestrictionModalMessage(null)}>
          <div
            className="overlay-panel overlay-panel--sm rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-black dark:text-slate-100">
              License conversion blocked
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              {restrictionModalMessage}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setRestrictionModalMessage(null)}
                className="global-btn default-btn max-w-30 py-2"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertDetailOverlay;
