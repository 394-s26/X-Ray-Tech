import { useEffect, useState } from 'react';
import type { Certification } from '../types/certification';
import { ArrowLeftIcon, PencilIcon, TrashIcon, XIcon } from '../services/svgIcons';
import {
  expiryStatus,
  formatExpiryDate,
  daysLabel,
  EXPIRY_BADGE,
} from './CertDetailOverlay';

interface PhotoOverlayProps {
  cert: Certification;
  onClose: () => void;
  onEdit?: (cert: Certification) => void;
  onDelete?: (cert: Certification) => void;
}

function CornerStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5 flex flex-col gap-0.5">
      <dt className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100 break-words">
        {value}
      </dd>
    </div>
  );
}

export function PhotoOverlay({ cert, onClose, onEdit, onDelete }: PhotoOverlayProps) {
  const [statsCollapsed, setStatsCollapsed] = useState(false);

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
        className="overlay-panel overlay-panel--md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-black dark:text-slate-100 leading-tight min-w-0 truncate">
            {cert.certificateName}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {statsCollapsed && (
              <button
                type="button"
                onClick={() => setStatsCollapsed(false)}
                aria-label="Back to details"
                title="Back to details"
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeftIcon size={16} />
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
        <div className="relative p-4 bg-gray-50 dark:bg-slate-800/60">
          {!statsCollapsed && (
            <aside
              className="absolute top-0 left-0 z-10 w-[clamp(11rem,40vw,14rem)] bg-white dark:bg-slate-900 border-r border-b border-gray-200 dark:border-slate-700 shadow-md rounded-br-xl px-3 py-3 flex flex-col gap-2"
              aria-label="Certificate details"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                  Expiration
                </span>
                <span
                  className={`self-start -ml-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${EXPIRY_BADGE[status.tier]}`}
                >
                  {status.tier === 'expired' ? 'Expired' : 'Expires'}{' '}
                  {formatExpiryDate(cert.expirationDate)}
                  <span className="opacity-70 max-[536px]:hidden">· {daysLabel(status)}</span>
                </span>
              </div>
              <dl className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700/60">
                <CornerStat label="Completed" value={formatExpiryDate(cert.completedDate)} />
                <CornerStat label="CE Credits" value={String(cert.ceCredits)} />
                {cert.categoryType && (
                  <CornerStat label="Category Type" value={cert.categoryType} />
                )}
                {cert.categories.length > 0 && (
                  <CornerStat
                    label="Assigned"
                    value={
                      <span className="mt-1.5 -ml-1.5 flex flex-wrap gap-1.5">
                        {cert.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </span>
                    }
                  />
                )}
              </dl>
              <button
                type="button"
                onClick={() => setStatsCollapsed(true)}
                className="mt-1 w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-light transition-colors"
              >
                View File
              </button>
            </aside>
          )}
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
