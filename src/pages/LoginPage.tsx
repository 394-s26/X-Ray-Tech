import { useState } from 'react';
import { AppLogoIcon, ArrowRightIcon, MicrosoftIcon } from '../services/svgIcons';
import { signInWithMicrosoft } from '../services/authService';
import '../styles/pages/LoginPage.css';

export const LoginPage = () => {
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 overflow-hidden">
      {/* Animated diagonal grid */}
      <div
        className="login-grid absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Pulsing radial glow — brand color */}
      <div
        className="login-glow absolute top-1/2 left-1/2 w-[720px] h-[720px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 70%)',
        }}
      />

      {/* Login card */}
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

          <button
            className="login-ms-btn flex items-center justify-between w-full px-5 py-[0.9rem] bg-smoke-900 text-slate-900 border border-slate-700 rounded-xl text-[0.9375rem] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleMicrosoftSignIn}
            disabled={loading}
          >
            <span className="flex items-center gap-3">
              <MicrosoftIcon size={20} />
              {loading ? 'Signing in…' : 'Sign in with Microsoft'}
            </span>
            <ArrowRightIcon size={18} className="arrow-right" />
          </button>

          {error && (
            <p className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
