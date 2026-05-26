import { useState } from 'react';
import type { AppUser } from '../types/auth';
import { updateUserProfile } from '../services/authService';
import { PageHeader } from '../components/PageHeader';
import { UserIcon } from '../services/svgIcons';
import UserAvatar from '../components/UserAvatar';
import '../styles/components/AccountSetupFlow.css';

interface ProfilePageProps {
  appUser: AppUser;
  onAppUserUpdate: (user: AppUser) => void;
}

export default function ProfilePage({ appUser, onAppUserUpdate }: ProfilePageProps) {
  const [arrtIdNumber, setArrtIdNumber] = useState(appUser.arrtIdNumber ?? '');
  const [iemaIdNumber, setIemaIdNumber] = useState(appUser.iemaIdNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const displayName =
    appUser.firstName?.trim() && appUser.lastName?.trim()
      ? `${appUser.firstName.trim()} ${appUser.lastName.trim()}`
      : appUser.username;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const update: Partial<AppUser> = {
        arrtIdNumber: arrtIdNumber.trim() || null,
        iemaIdNumber: iemaIdNumber.trim() || null,
      };
      await updateUserProfile(appUser.uid, update);
      onAppUserUpdate({ ...appUser, ...update });
      setSaved(true);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    arrtIdNumber.trim() !== (appUser.arrtIdNumber ?? '').trim() ||
    iemaIdNumber.trim() !== (appUser.iemaIdNumber ?? '').trim();

  return (
    <main className="min-h-[calc(100vh-6rem)] px-5 lg:px-10 pb-16 w-full max-w-2xl mx-auto">
      <PageHeader
        icon={<UserIcon size={22} />}
        title="Profile"
        subtitle="Your account and license identifiers"
      />

      <section className="nb-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <UserAvatar user={appUser} size="lg" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] truncate">
              {displayName}
            </p>
            {appUser.email && (
              <p className="text-sm text-[var(--ink-500)] truncate">{appUser.email}</p>
            )}
            <p className="text-xs text-[var(--ink-500)] mt-0.5">
              @{appUser.username}
              {appUser.role === 'manager' ? ' · Team manager' : appUser.teamCode ? ' · Team member' : ''}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--ink-200)] dark:border-[var(--ink-700)] pt-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
              License identification
            </h2>
            <p className="text-xs text-[var(--ink-500)] mt-1">
              Optional registry or state ID numbers for ARRT and IEMA.
            </p>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-arrt-id">
              ARRT identification number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="profile-arrt-id"
              className="form-input"
              type="text"
              placeholder="e.g. 1234567"
              value={arrtIdNumber}
              onChange={e => {
                setArrtIdNumber(e.target.value);
                setSaved(false);
              }}
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-iema-id">
              IEMA identification number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="profile-iema-id"
              className="form-input"
              type="text"
              placeholder="e.g. IL-12345"
              value={iemaIdNumber}
              onChange={e => {
                setIemaIdNumber(e.target.value);
                setSaved(false);
              }}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-[var(--success-600)]">Saved.</p>
          )}

          <button
            type="button"
            className="global-btn default-btn self-start min-w-30"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>
    </main>
  );
}
