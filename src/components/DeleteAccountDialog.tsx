import { useState } from 'react';
import type { AppUser } from '../types/auth';
import { deleteAccount } from '../services/authService';

const CONFIRM_WORD = 'delete';

interface DeleteAccountDialogProps {
  appUser: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteAccountDialog({ appUser, onSuccess, onCancel }: DeleteAccountDialogProps) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const matches = typed.trim().toLowerCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!matches || loading) return;
    setLoading(true);
    setError(null);
    try {
      await deleteAccount(appUser);
      onSuccess();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      console.error('deleteAccount failed:', code, err);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed the Google re-auth popup; nothing was deleted.
        setLoading(false);
        return;
      }
      if (code === 'auth/requires-recent-login') {
        setError('For your security, please sign out and sign back in, then try again.');
      } else {
        setError(`Failed to delete account${code ? ` (${code})` : ''}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay-center" onClick={onCancel}>
      <div
        className="overlay-panel overlay-panel--sm rounded-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black dark:text-slate-100">Delete account?</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 leading-snug">
          This will permanently delete your account, all your certifications and scantrons, and
          remove you from any teams.{' '}
          <strong className="text-red-600 dark:text-red-400">This action cannot be undone.</strong>
        </p>

        <div className="form-field mt-4">
          <label htmlFor="delete-account-confirm" className="form-label">
            Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{CONFIRM_WORD}</span> to confirm
          </label>
          <input
            id="delete-account-confirm"
            type="text"
            autoComplete="off"
            autoFocus
            value={typed}
            onChange={e => { setTyped(e.target.value); setError(null); }}
            disabled={loading}
            className={`form-input ${error ? 'is-error' : ''}`}
            placeholder={CONFIRM_WORD}
            onKeyDown={e => { if (e.key === 'Enter') void handleDelete(); }}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={loading || !matches}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountDialog;
