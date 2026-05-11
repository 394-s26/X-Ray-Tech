import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLogoIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from '../services/svgIcons';
import { registerWithEmail, checkUsernameAvailable } from '../services/authService';
import { AuthBackground } from './AuthBackground';

import MailChecker from 'mailchecker';

interface PasswordStrength {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const isEmailValid = (email: string): boolean => MailChecker.isValid(email);

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
}

const StrengthPill = ({ met, label }: PillProps) => (
  <span
    className={`flex-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      met
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-slate-50 border-slate-200 text-slate-400'
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
    {label}
  </span>
);

export const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // checkedUsername / checkedAvailable track the last completed async lookup.
  // Status is derived purely from current username vs. those refs — no synchronous setState in effects.
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkedAvailable, setCheckedAvailable] = useState<boolean | null>(null);
  const [usernameCheckError, setUsernameCheckError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameStatus =
    username.length === 0 ? 'idle'
    : username.length < 3 ? 'short'
    : usernameCheckError && username === checkedUsername ? 'error'
    : username === checkedUsername && checkedAvailable !== null
      ? (checkedAvailable ? 'available' : 'taken')
      : 'checking';
  

  let usernameStatusMessage = "";
  let usernameStatusColor = "";

  if (usernameStatus === "short") {
    usernameStatusMessage = "Username must be at least 3 characters.";
    usernameStatusColor = "text-slate-400";
  } else if (usernameStatus === 'checking') {
    usernameStatusMessage = "Checking availability…";
    usernameStatusColor = "text-slate-400";
  } else if (usernameStatus === 'available') {
    usernameStatusMessage = "Username is available.";
    usernameStatusColor = "text-green-600";
  } else if (usernameStatus === 'taken') {
    usernameStatusMessage = "Username is already taken.";
    usernameStatusColor = "text-red-500";
  } else if (usernameStatus === 'error') {
    usernameStatusMessage = "Could not check availability. Check console for details.";
    usernameStatusColor = "text-red-500";
  }

  const strength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const usernameValid = usernameStatus === 'available';
  const emailValid = email.length > 0 && isEmailValid(email);
  const canSubmit =
    emailValid && usernameValid && isPasswordValid(strength) && passwordsMatch && !loading;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (username.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username);
        setUsernameCheckError(false);
        setCheckedUsername(username);
        setCheckedAvailable(available);
      } catch (err) {
        console.error('Username check failed:', err);
        setUsernameCheckError(true);
        setCheckedUsername(username);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await registerWithEmail(email, password, username);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'Username taken' ? 'That username was just taken. Please choose another.' : 'Registration failed. Please try again.');
      console.log(msg);
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
            Create an account.
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-[0.8rem] rounded-xl border border-slate-300 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition-colors"
              />
              <p className="text-xs text-red-500 mb-1 px-1 h-1">{(email.length > 3 && !emailValid) ? "Email is not valid." : ""}</p>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Username (min. 3 characters)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-[0.8rem] rounded-xl border text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 transition-colors ${
                  usernameStatus === 'taken'
                    ? 'border-red-400 focus:ring-red-500/40 focus:border-red-400'
                    : usernameStatus === 'available'
                    ? 'border-green-400 focus:ring-green-500/40 focus:border-green-400'
                    : 'border-slate-300 focus:ring-blue-500/40 focus:border-blue-400'
                }`}
              />
              <p className={`text-xs text-slate-400 mb-1 px-1 h-1 ${usernameStatusColor}`}>{usernameStatusMessage}</p>
              
            </div>

            <div className="relative mt-6">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-[0.8rem] pr-11 rounded-xl border border-slate-300 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition-colors"
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

            <div className="flex flex-wrap justify-between gap-1.5">
              <StrengthPill met={strength.hasMinLength} label="8+ chars" />
              <StrengthPill met={strength.hasLetter} label="Letter" />
              <StrengthPill met={strength.hasNumber} label="Number" />
              <StrengthPill met={strength.hasSpecial} label="Special char" />
            </div>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className={`w-full px-4 py-[0.8rem] rounded-xl border text-[0.9375rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 transition-colors ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? 'border-red-400 focus:ring-red-500/40 focus:border-red-400'
                  : 'border-slate-300 focus:ring-blue-500/40 focus:border-blue-400'
              }`}
            />
            <p className="text-xs text-red-500 -mt-3 mb-1 px-1 h-1">{confirmPassword.length > 0 && !passwordsMatch && ("Passwords do not match.")}</p>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-between default-btn py-3 px-4 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              <span>{loading ? 'Creating account…' : 'Create account'}</span>
              <ArrowRightIcon size={18} />
            </button>
          </form>

          {error && (
            <p className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};
