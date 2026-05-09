import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLogoIcon, ArrowRightIcon, MicrosoftIcon } from '../services/svgIcons';
import { signInWithMicrosoft, signInWithEmail } from '../services/authService';
import { AuthBackground } from './AuthBackground';
import { EyeIcon, EyeOffIcon } from '../services/svgIcons';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithMicrosoft();
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
      <div className="relative z-10 bg-white rounded-2xl border border-slate-200/90 shadow-lg w-full max-w-[440px] overflow-hidden mx-4">
        <div className="flex items-center gap-2.5 px-7 py-[1.125rem] border-b border-slate-200">
          <AppLogoIcon size={28} />
          <span className="text-[0.9375rem] font-semibold text-slate-900 tracking-tight">
            X-Ray Tech
          </span>
        </div>

        <div className="px-7 pt-8 pb-9">
          <h1 className="text-[1.625rem] font-bold text-slate-900 leading-tight mb-7">
            Welcome back.
          </h1>

          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3 mb-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-[0.8rem] rounded-xl border border-slate-300 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            className="login-ms-btn flex items-center justify-between w-full px-5 py-[0.9rem] bg-smoke-900 text-slate-900 border border-slate-700 rounded-xl text-[0.9375rem] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleMicrosoftSignIn}
            disabled={loading}
          >
            <span className="flex items-center gap-3">
              <MicrosoftIcon size={20} />
              Sign in with Microsoft
            </span>
            <ArrowRightIcon size={18} className="arrow-right" />
          </button>

          {error && (
            <p className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};
