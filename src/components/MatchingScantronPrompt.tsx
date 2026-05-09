import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Scantron } from '../types/upload';

interface MatchingScantronPromptProps {
  scantrons: Scantron[];
  onConfirmDelete: () => Promise<void> | void;
  onKeep: () => void;
}

export const MatchingScantronPrompt = ({
  scantrons,
  onConfirmDelete,
  onKeep,
}: MatchingScantronPromptProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="overlay-center" onClick={isDeleting ? undefined : onKeep}>
      <div
        className="overlay-panel overlay-panel--md rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-1">
          Delete matching scan-tron records?
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          You uploaded a certificate that matches {scantrons.length}{' '}
          scan-tron {scantrons.length === 1 ? 'record' : 'records'}. The certificate is the
          permanent record — these scan-tron entries are no longer needed.
        </p>
        <ul className="max-h-60 overflow-y-auto rounded-lg border border-gray-100 dark:border-slate-700 mb-5">
          {scantrons.map(s => (
            <li
              key={s.id}
              className="px-3 py-2 text-sm border-b border-gray-100 dark:border-slate-700 last:border-b-0"
            >
              <p className="font-medium text-gray-800 dark:text-slate-100">
                {s.examName ?? 'Untitled scan-tron'}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {s.examDate ?? 'No date'} · confidence {s.ocrConfidence.toFixed(0)}%
              </p>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            type="button"
            className="global-btn red-btn flex-1"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : `Delete ${scantrons.length}`}
          </button>
          <button
            type="button"
            className="global-btn cancel-btn flex-1"
            onClick={onKeep}
            disabled={isDeleting}
          >
            Keep them
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
