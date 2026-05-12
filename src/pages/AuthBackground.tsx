import type { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import '../styles/pages/LoginPage.css';

export const AuthBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <Navbar mode="minimal" />
      <div className="flex-1 flex items-center justify-center">
        <div className="auth-grid absolute inset-0" />
        <div className="auth-glow absolute top-1/2 left-1/2 w-[720px] h-[720px] pointer-events-none" />
        {children}
      </div>
    </div>
  );
};
