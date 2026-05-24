import { useEffect } from 'react';
import type { Certification } from '../types/certification';
import { EyeIcon, PencilIcon, TrashIcon, XIcon } from '../services/svgIcons';
import {
  expiryStatus,
  formatExpiryDate,
  daysLabel,
  EXPIRY_BADGE,
} from './CertDetailOverlay';

interface PhotoOverlayProps {
  cert: Certification;
  onClose: () => void;
  onDetailView?: (cert: Certification) => void;
  onEdit?: (cert: Certification) => void;
  onDelete?: (cert: Certification) => void;
}

export function PhotoOverlay({ cert, onClose, onDetailView, onEdit, onDelete }: PhotoOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isPdf = /\.pdf$/i.test(cert.photoStoragePath ?? '');
  const status = expiryStatus(cert.expirationDate);

  return (
    <div className="overlay-center" onClick={onClose}>
      <div
        className="overlay-panel overlay-panel--md rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-black dark:text-slate-100 leading-tight truncate">
              {cert.certificateName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
              <span
                className={`inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-bold ${EXPIRY_BADGE[status.tier]}`}
              >
                {status.tier === 'expired' ? 'Expired' : 'Expires'} {formatExpiryDate(cert.expirationDate)} · {daysLabel(status)}
              </span>
              <span>Completed {formatExpiryDate(cert.completedDate)}</span>
              <span>· {cert.ceCredits} hr</span>
              {cert.categoryType && <span>· Cat {cert.categoryType}</span>}
              {cert.categories.length > 0 && (
                <span>· {cert.categories.join(', ')}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onDetailView && (
              <button
                type="button"
                onClick={() => onDetailView(cert)}
                aria-label="View record details"
                title="View record details"
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <EyeIcon size={16} />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(cert)}
                aria-label="Edit record"
                title="Edit record"
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <PencilIcon size={16} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(cert)}
                aria-label="Delete record"
                title="Delete record"
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
              >
                <TrashIcon size={16} />
              </button>
            )}
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
          {isPdf ? (
            <iframe
              src={cert.photoURL}
              title={cert.certificateName}
              className="w-full h-[70vh] rounded-lg bg-white"
            />
          ) : (
            <img
              src={cert.photoURL}
              alt={cert.certificateName}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoOverlay;
