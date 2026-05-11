import type { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import '../styles/pages/LoginPage.css';

export const AuthBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      <Navbar mode="minimal" />
      <div className="flex-1 flex items-center justify-center">
        <div
          className="login-grid absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(143, 59, 246, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(143, 59, 246, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        <div
          className="login-glow absolute top-1/2 left-1/2 w-[720px] h-[720px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(184, 59, 246, 0.35) 0%, rgba(184, 59, 246, 0.08) 45%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  );
};
