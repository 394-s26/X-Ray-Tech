import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLogoIcon, ArrowRightIcon, GoogleIcon } from '../services/svgIcons';
import { signInWithGoogle, signInWithEmail } from '../services/authService';
import { AuthBackground } from './AuthBackground';
import { EyeIcon, EyeOffIcon } from '../services/svgIcons';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="auth-card">
        <div className="auth-card-header">
          <AppLogoIcon size={28} />
          <span className="auth-card-title">X-Ray Tech</span>
        </div>

        <div className="login-card-body">
          <h1 className="auth-heading">Welcome back.</h1>

          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3 mb-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-between default-btn py-3 px-4 rounded-xl cursor-pointer"
            >
              <span>{loading ? 'Logging in…' : 'Log in'}</span>
              <ArrowRightIcon size={18} />
            </button>
          </form>

          <div className="flex items-center gap-3 mb-5">
            <div className="auth-divider" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="auth-divider" />
          </div>

          <button
            className="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <span className="login-google-btn-label">
              <GoogleIcon size={20} />
              Sign in with Google
            </span>
            <ArrowRightIcon size={18} className="arrow-right" />
          </button>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
              Sign up
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};
