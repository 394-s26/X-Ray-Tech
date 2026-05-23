import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from '../services/svgIcons';
import { confirmPasswordResetWithCode, applyAuthActionCode } from '../services/authService';
import { AuthBackground } from './AuthBackground';
import BrandLogo from '../components/BrandLogo';
import '../styles/pages/LoginPage.css';

interface PasswordStrength {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const checkPasswordStrength = (password: string): PasswordStrength => ({
  hasMinLength: password.length >= 8,
  hasLetter: /[a-zA-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[^a-zA-Z0-9]/.test(password),
});

const isPasswordValid = (strength: PasswordStrength): boolean =>
  Object.values(strength).every(Boolean);

interface PillProps {
  met: boolean;
  label: string;
  mobileLabel?: string;
}

const StrengthPill = ({ met, label, mobileLabel }: PillProps) => (
  <span
    className={`flex-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      met
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
    }`}
  >
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {met ? <path d="M20 6L9 17l-5-5" /> : <circle cx="12" cy="12" r="9" />}
    </svg>
    {mobileLabel ? (
      <>
        <span className="sm:hidden">{mobileLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </>
    ) : label}
  </span>
);

// ── Reset Password ────────────────────────────────────────────────────────────

const ResetPasswordView = ({ oobCode }: { oobCode: string }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isPasswordValid(strength) && passwordsMatch && !loading;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordResetWithCode(oobCode, password);
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
        setError('This reset link has expired or already been used. Please request a new one.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger one.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <h1 className="auth-heading">Password updated</h1>
        <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-6">
          Your password has been reset. You can now log in with your new password.
        </p>
        <Link to="/login" className="global-btn default-btn flex items-center justify-between">
          <span>Go to log in</span>
          <ArrowRightIcon size={18} />
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-heading">Reset password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="auth-input pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        <div className="flex flex-nowrap justify-between gap-1.5">
          <StrengthPill met={strength.hasMinLength} label="8+ chars" />
          <StrengthPill met={strength.hasLetter} label="Letter" />
          <StrengthPill met={strength.hasNumber} label="Number" mobileLabel="Num" />
          <StrengthPill met={strength.hasSpecial} label="Special char" mobileLabel="Special" />
        </div>

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          className={`auth-input ${confirmPassword.length > 0 && !passwordsMatch ? 'auth-input-error' : ''}`}
        />
        <p className="text-xs text-red-500 -mt-3 mb-1 px-1 h-1">
          {confirmPassword.length > 0 && !passwordsMatch && 'Passwords do not match.'}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="global-btn default-btn disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ justifyContent: 'space-between' }}
        >
          <span>{loading ? 'Updating…' : 'Update password'}</span>
          <ArrowRightIcon size={18} />
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      <p className="auth-footer-text">
        <Link to="/login" className="text-[var(--brand-600)] dark:text-[var(--brand-300)] hover:underline font-semibold">
          Back to log in
        </Link>
      </p>
    </>
  );
};

// ── Verify Email ──────────────────────────────────────────────────────────────

const VerifyEmailView = ({ oobCode }: { oobCode: string }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    applyAuthActionCode(oobCode)
      .then(() => setStatus('success'))
      .catch((err) => {
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
          setErrorMsg('This verification link has expired or already been used.');
        } else {
          setErrorMsg('Verification failed. Please try again.');
        }
        setStatus('error');
      });
  }, [oobCode]);

  if (status === 'loading') {
    return <p className="text-sm text-[var(--ink-500)] dark:text-slate-400">Verifying your email…</p>;
  }

  if (status === 'error') {
    return (
      <>
        <h1 className="auth-heading">Verification failed</h1>
        <p className="auth-error">{errorMsg}</p>
        <p className="auth-footer-text">
          <Link to="/login" className="text-[var(--brand-600)] dark:text-[var(--brand-300)] hover:underline font-semibold">
            Back to log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-heading">Email verified</h1>
      <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-6">
        Your email address has been verified. You're all set.
      </p>
      <Link to="/" className="global-btn default-btn flex items-center justify-between">
        <span>Go to dashboard</span>
        <ArrowRightIcon size={18} />
      </Link>
    </>
  );
};

// ── Invalid / Unknown ─────────────────────────────────────────────────────────

const InvalidActionView = () => (
  <>
    <h1 className="auth-heading">Invalid link</h1>
    <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-6">
      This link is missing or unrecognized. Please start over.
    </p>
    <Link to="/login" className="global-btn default-btn flex items-center justify-between">
      <span>Back to log in</span>
      <ArrowRightIcon size={18} />
    </Link>
  </>
);

// ── Page shell ────────────────────────────────────────────────────────────────

export const AuthActionPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const renderContent = () => {
    if (!oobCode) return <InvalidActionView />;
    if (mode === 'resetPassword') return <ResetPasswordView oobCode={oobCode} />;
    if (mode === 'verifyEmail') return <VerifyEmailView oobCode={oobCode} />;
    return <InvalidActionView />;
  };

  return (
    <AuthBackground>
      <div className="auth-card">
        <div className="auth-card-header">
          <BrandLogo />
        </div>
        <div className="login-card-body">
          {renderContent()}
        </div>
      </div>
    </AuthBackground>
  );
};
