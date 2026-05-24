import { useState } from 'react';
import type { Certification } from '../types/certification';

const CONFIRM_WORD = 'delete';

export function DeleteConfirmDialog({
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
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <div className="overlay-center" onClick={onCancel}>
      <div
        className="overlay-panel overlay-panel--sm rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black dark:text-slate-100">Delete certificate?</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 leading-snug">
          <span className="font-semibold text-gray-900 dark:text-slate-100">{cert.certificateName}</span>{' '}
          will be permanently removed. <strong className="text-red-600 dark:text-red-400">This action cannot be undone.</strong>
        </p>

        <div className="form-field mt-4">
          <label htmlFor="delete-confirm-input" className="form-label">
            Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{CONFIRM_WORD}</span> to confirm
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            autoComplete="off"
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={deleting}
            className="form-input"
            placeholder={CONFIRM_WORD}
          />
        </div>

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
            disabled={deleting || !matches}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
