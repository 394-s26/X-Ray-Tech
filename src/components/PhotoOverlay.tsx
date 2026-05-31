import { useEffect, useState } from 'react';
import type { Certification } from '../types/certification';
import { ArrowLeftIcon, DownloadIcon, PencilIcon, TrashIcon, XIcon } from '../services/svgIcons';
import { CertImagePlaceholder } from './CertImagePlaceholder';
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

function CornerStat({
  label,
  value,
  align = 'left',
}: {
  label: string;
  value: React.ReactNode;
  align?: 'left' | 'center';
}) {
  const alignClass = align === 'center' ? 'items-center text-center' : '';
  return (
    <div className={`flex flex-col gap-1.5 h-full ${alignClass}`}>
      <dt className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-auto text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100 break-words">
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

  const downloadFilename = (() => {
    const base = cert.certificateName.trim().replace(/[^\w.\-]+/g, '_') || 'certificate';
    const ext = isPdf ? '.pdf' : '';
    return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
  })();

  const handleDownload = async () => {
    try {
      const res = await fetch(cert.photoURL, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(cert.photoURL, '_blank', 'noopener,noreferrer');
    }
  };

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
            {statsCollapsed ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatsCollapsed(false)}
                  aria-label="Back to details"
                  title="Back to details"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeftIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  aria-label="Download file"
                  title="Download file"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <DownloadIcon size={16} />
                </button>
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
              </>
            ) : (
              <button
                type="button"
                onClick={() => setStatsCollapsed(true)}
                aria-label="View file"
                className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-light transition-colors"
              >
                View File
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
        <div
          className={`relative p-4 transition-colors duration-200 ${
            statsCollapsed
              ? 'bg-gray-50 dark:bg-slate-800/60'
              : 'bg-gray-300 dark:bg-slate-950/80'
          }`}
        >
          {!statsCollapsed && (
            <aside
              className="absolute top-0 left-0 right-0 z-10 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-md px-4 py-3 flex flex-wrap items-stretch gap-x-6 gap-y-3"
              aria-label="Certificate details"
            >
              <div className="flex flex-col items-center gap-1.5 h-full text-center">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                  Expiration
                </span>
                <span
                  className={`mt-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${EXPIRY_BADGE[status.tier]}`}
                >
                  {status.tier === 'expired' ? 'Expired' : 'Expires'}{' '}
                  {formatExpiryDate(cert.expirationDate)}
                  <span className="opacity-70 max-[536px]:hidden">· {daysLabel(status)}</span>
                </span>
              </div>
              <dl className="contents">
                <CornerStat label="Completed" value={formatExpiryDate(cert.completedDate)} />
                <CornerStat label="CE Credits" value={String(cert.ceCredits)} align="center" />
                {cert.categoryType && (
                  <CornerStat label="Category Type" value={cert.categoryType} align="center" />
                )}
                {cert.categories.length > 0 && (
                  <CornerStat
                    label="Assigned"
                    align="center"
                    value={
                      <span className="flex flex-wrap justify-center gap-1.5">
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
            </aside>
          )}
          {!cert.photoURL ? (
            <div
              className={`h-[70vh] w-full overflow-hidden rounded-lg transition-opacity duration-200 ${statsCollapsed ? 'opacity-100' : 'opacity-30'}`}
            >
              <CertImagePlaceholder label="No image uploaded" />
            </div>
          ) : isPdf ? (
            <iframe
              src={cert.photoURL}
              title={cert.certificateName}
              className={`w-full h-[70vh] rounded-lg bg-white transition-opacity duration-200 ${statsCollapsed ? 'opacity-100' : 'opacity-30'}`}
            />
          ) : (
            <img
              src={cert.photoURL}
              alt={cert.certificateName}
              className={`w-full max-h-[70vh] object-contain rounded-lg transition-opacity duration-200 ${statsCollapsed ? 'opacity-100' : 'opacity-30'}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoOverlay;
