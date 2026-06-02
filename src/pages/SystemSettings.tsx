import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import { signOut } from '../services/authService';
import { syncFcmTokenForCurrentUser } from '../services/notifications';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../contexts/themeContext';
import { PageHeader } from '../components/PageHeader';
import { DeleteAccountDialog } from '../components/DeleteAccountDialog';
import { SettingsIcon } from '../services/svgIcons';

interface SystemSettingsProps {
  appUser: AppUser;
}

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="nb-card p-6 flex flex-col gap-5">
    <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--ink-900)] dark:text-[var(--fg)]">
      {title}
    </h2>
    {children}
  </div>
);

type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

const readPermission = (): NotificationPermissionState => {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as NotificationPermissionState;
};

const DesktopNotificationsCard = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => readPermission());
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const handleFocus = () => {
      setPermission(readPermission());
      setHint(null);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const isOn = permission === 'granted';
  const disabled = permission === 'unsupported' || requesting;

  const handleToggle = async () => {
    if (disabled) return;
    setError(null);
    setHint(null);

    if (permission === 'granted') {
      setHint(
        'Browsers don’t let sites revoke their own permission. To disable, open your browser’s site settings for this page and set Notifications to "Block" or "Ask," then refresh.',
      );
      return;
    }

    if (permission === 'denied') {
      setHint(
        'Notifications are blocked for this site. Your browser won’t prompt again until you change the site permission to "Ask" or "Allow" in browser settings, then refresh.',
      );
      return;
    }

    setRequesting(true);
    try {
      await syncFcmTokenForCurrentUser({ requestPermission: true });
      const next = readPermission();
      setPermission(next);
      if (next === 'denied') {
        setHint('You blocked the request. Change the site permission in browser settings to try again.');
      }
    } catch {
      setError('Could not enable notifications. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const statusLabel: Record<NotificationPermissionState, string> = {
    unsupported: 'Not supported in this browser',
    default: 'Not enabled',
    granted: 'Enabled',
    denied: 'Blocked by browser',
  };

  const statusColor: Record<NotificationPermissionState, string> = {
    unsupported: 'text-slate-400',
    default: 'text-amber-600 dark:text-amber-400',
    granted: 'text-emerald-600 dark:text-emerald-400',
    denied: 'text-red-600 dark:text-red-400',
  };

  return (
    <SectionCard title="Desktop Notifications">
      <p className="text-sm text-[var(--ink-500)] dark:text-[var(--fg-muted)]">
        Get desktop alerts when certificates are about to expire or your team needs attention.
      </p>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--fg)]">
            Allow desktop notifications
          </span>
          <span className={`text-xs font-semibold ${statusColor[permission]}`}>
            {statusLabel[permission]}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Toggle desktop notifications"
          onClick={handleToggle}
          disabled={disabled}
          className={
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 cursor-pointer ' +
            (isOn
              ? 'bg-emerald-500'
              : permission === 'denied'
                ? 'bg-red-400 dark:bg-red-500/70'
                : 'bg-gray-300 dark:bg-slate-600') +
            (disabled ? ' opacity-50 cursor-not-allowed' : '')
          }
        >
          <span
            className={
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
              (isOn ? 'translate-x-[1.375rem]' : 'translate-x-0.5')
            }
          />
        </button>
      </div>

      {hint && (
        <p className="text-xs text-[var(--ink-500)] dark:text-[var(--fg-muted)]">{hint}</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </SectionCard>
  );
};

const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string }> = [
  { value: 'light', label: 'Light', description: 'Always use the light theme.' },
  { value: 'dark', label: 'Dark', description: 'Always use the dark theme.' },
  { value: 'system', label: 'System default', description: 'Match your device setting.' },
];

const AppearanceCard = () => {
  const { theme, setTheme } = useTheme();

  return (
    <SectionCard title="Appearance">
      <p className="text-sm text-[var(--ink-500)] dark:text-[var(--fg-muted)]">
        Choose how the app should look on this device.
      </p>

      <div className="flex flex-col gap-2">
        {THEME_OPTIONS.map((opt) => {
          const selected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={
                'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors cursor-pointer ' +
                (selected
                  ? 'border-[#7C49D5] dark:border-[#A876FF] bg-[#7C49D5]/5 dark:bg-[#A876FF]/10'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600')
              }
              aria-pressed={selected}
            >
              <span
                className={
                  'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ' +
                  (selected
                    ? 'border-[#7C49D5] dark:border-[#A876FF]'
                    : 'border-gray-300 dark:border-slate-600')
                }
              >
                {selected && (
                  <span className="w-2 h-2 rounded-full bg-[#7C49D5] dark:bg-[#A876FF]" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--fg)]">
                  {opt.label}
                </span>
                <span className="block text-xs text-[var(--ink-500)] dark:text-[var(--fg-muted)]">
                  {opt.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
};

interface DangerZoneCardProps {
  appUser: AppUser;
}

const DangerZoneCard = ({ appUser }: DangerZoneCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="nb-card p-6 flex flex-col gap-3 border border-red-200 dark:border-red-900">
        <h2 className="font-display text-lg font-semibold tracking-tight text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="text-sm text-[var(--ink-500)] dark:text-[var(--fg-muted)]">
          Permanently delete your account, all your certifications, and remove you from any teams. This cannot be undone.
        </p>
        <div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteDialog && (
        <DeleteAccountDialog
          appUser={appUser}
          onSuccess={() => void signOut()}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
};

export const SystemSettings = ({ appUser }: SystemSettingsProps) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 flex flex-col gap-6">
      <PageHeader
        icon={<SettingsIcon size={22} />}
        title="System Settings"
        subtitle="Configure notifications, appearance, and manage your account."
        className="mb-0"
      />

      <DesktopNotificationsCard />
      <AppearanceCard />
      <DangerZoneCard appUser={appUser} />
    </div>
  );
};

export default SystemSettings;
