import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../services/svgIcons';
import { sendPasswordReset } from '../services/authService';
import { AuthBackground } from './AuthBackground';
import BrandLogo from '../components/BrandLogo';
import '../styles/pages/LoginPage.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      console.error('Password reset error:', code, err);
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setError('No account found with that email address.');
      } else {
        setError(`Something went wrong. Please try again. (${code})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="auth-card">
        <div className="auth-card-header">
          <BrandLogo />
        </div>

        <div className="login-card-body">
          {sent ? (
            <>
              <h1 className="auth-heading">Check your email</h1>
              <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-6">
                We sent a password reset link to <span className="font-semibold text-[var(--ink-900)] dark:text-slate-200">{email}</span>. Check your inbox and follow the instructions.
              </p>
              <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-6">
                If you can't find the email, <span className="font-semibold text-orange-800 dark:text-orange-500">check your spam folder!</span>
              </p>
              <Link
                to="/login"
                className="global-btn default-btn flex items-center justify-between"
              >
                <span>Back to log in</span>
                <ArrowRightIcon size={18} />
              </Link>
            </>
          ) : (
            <>
              <h1 className="auth-heading">Forgot password?</h1>
              <p className="text-sm text-[var(--ink-500)] dark:text-slate-400 mb-5">
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="auth-input"
                />

                <button
                  type="submit"
                  disabled={loading || email.length === 0}
                  className="global-btn default-btn"
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{loading ? 'Sending…' : 'Send reset link'}</span>
                  <ArrowRightIcon size={18} />
                </button>
              </form>

              {error && <p className="auth-error">{error}</p>}

              <p className="auth-footer-text">
                Remember your password?{' '}
                <Link to="/login" className="text-[var(--brand-600)] dark:text-[var(--brand-300)] hover:underline font-semibold">
                  Log in
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </AuthBackground>
  );
};
