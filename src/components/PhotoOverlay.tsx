import { useEffect } from 'react';
import type { Certification } from '../types/certification';
import { EyeIcon, PencilIcon, TrashIcon, XIcon } from '../services/svgIcons';

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
