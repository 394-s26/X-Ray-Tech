import type { ReactNode } from 'react';
import '../styles/pages/LoginPage.css';

export const AuthBackground = ({ children }: { children: ReactNode }) => (
  <div className="login-page">
    <div className="login-grid" />
    <div
      className="login-glow absolute top-1/2 left-1/2 w-[720px] h-[720px] pointer-events-none"
      style={{
        background:
          'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 70%)',
      }}
    />
    {children}
  </div>
);
