import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { signOut } from '../services/authService';
import type { AppUser } from '../types/auth';

interface NavbarProps {
  appUser: AppUser | null;
}

const NAV_ITEMS: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/ocr', label: 'OCR Test' },
];

export default function Navbar({ appUser }: NavbarProps) {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // signOut errors are non-fatal — surface in console only
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800">
      <ul className="flex items-center gap-1 sm:gap-2">
        {NAV_ITEMS.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white dark:bg-primary-light'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {appUser && (
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-block"
          >
            Sign out
          </button>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
