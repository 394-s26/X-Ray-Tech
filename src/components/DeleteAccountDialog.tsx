import { useState } from 'react';
import type { AppUser } from '../types/auth';
import { deleteAccount } from '../services/authService';

interface DeleteAccountDialogProps {
  appUser: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteAccountDialog({ appUser, onSuccess, onCancel }: DeleteAccountDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      await deleteAccount(appUser, password);
      onSuccess();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to delete account. Please try again.');
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
          This will permanently delete your account, all your certifications, and remove you from any
          teams.{' '}
          <strong className="text-red-600 dark:text-red-400">This action cannot be undone.</strong>
        </p>

        <div className="form-field mt-4">
          <label htmlFor="delete-account-password" className="form-label">
            Confirm your password
          </label>
          <input
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            disabled={loading}
            className={`form-input ${error ? 'is-error' : ''}`}
            placeholder="Enter your password"
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
            disabled={loading || !password}
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
