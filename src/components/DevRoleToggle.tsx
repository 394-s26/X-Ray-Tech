import { useState } from 'react';
import type { AppUser } from '../types/auth';
import { updateAppUserRole } from '../services/authService';

interface DevRoleToggleProps {
  appUser: AppUser;
  onRoleChanged: (updated: AppUser) => void;
}

export default function DevRoleToggle({ appUser, onRoleChanged }: DevRoleToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isManager = appUser.role === 'manager';

  const handleToggle = async () => {
    setError(null);
    setLoading(true);
    try {
      const next: 'manager' | 'member' = isManager ? 'member' : 'manager';
      const updated = await updateAppUserRole(appUser.uid, next);
      onRoleChanged(updated);
    } catch {
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title="Toggle role between manager and member (dev only)"
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-yellow-100 border-2 border-dashed border-yellow-700 text-yellow-900 text-[11px] font-extrabold uppercase tracking-wider shadow-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-yellow-700 animate-pulse" />
        DEV · {isManager ? 'Manager' : 'Member'}
        <span className="opacity-70">⇄</span>
      </button>
      {error && (
        <span className="text-[10px] font-semibold text-red-600 bg-white/90 px-2 py-0.5 rounded">
          {error}
        </span>
      )}
    </div>
  );
}
