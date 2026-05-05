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
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-glow" />

      <div className="login-card">
        <div className="login-card-header">
          <AppLogoIcon size={28} />
          <span className="login-logo-text">X-Ray Tech</span>
        </div>

        <div className="login-card-body">
          <h1 className="login-heading">Welcome back.</h1>

          <button
            className="login-ms-btn"
            onClick={handleMicrosoftSignIn}
            disabled={loading}
          >
            <span className="login-ms-btn-label">
              <MicrosoftIcon size={20} />
              {loading ? 'Signing in…' : 'Sign in with Microsoft'}
            </span>
            <ArrowRightIcon size={18} className="arrow-right" />
          </button>

          {error && <p className="login-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};
