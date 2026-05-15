import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import {
  BellIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from '../services/svgIcons';
import ThemeToggle from './ThemeToggle';
import BrandLogo from './BrandLogo';
import '../styles/components/NavBar.css';

interface HamburgerButtonProps {
  open: boolean;
  onClick: () => void;
}

function HamburgerButton({ open, onClick }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      className={`navbar-hamburger ${open ? 'is-open' : ''}`}
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
    >
      <span className="navbar-hamburger__box">
        <span className="navbar-hamburger__line" />
        <span className="navbar-hamburger__line" />
        <span className="navbar-hamburger__line" />
      </span>
    </button>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  to?: string;
}

function MenuItem({ icon, label, onClick, to }: MenuItemProps) {
  const content = (
    <>
      <span className="navbar-menu__icon">{icon}</span>
      <span className="navbar-menu__label">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} role="menuitem" className="navbar-menu__item" onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" className="navbar-menu__item" onClick={onClick}>
      {content}
    </button>
  );
}

interface NavbarProps {
  mode?: 'full' | 'minimal';
}

export default function Navbar({ mode = 'full' }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const close = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setMenuOpen(false);
    };
    handle(mq);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
    close();
  };

  if (mode === 'minimal') {
    return (
      <nav className="sticky top-0 z-50 flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4 bg-[var(--paper)] border-b border-[var(--ink-200)] dark:bg-[#14111F] dark:border-[var(--ink-700)]">
        <ThemeToggle />
      </nav>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-[var(--paper)] border-b border-[var(--ink-200)] dark:bg-[#14111F] dark:border-[var(--ink-700)] ${
        menuOpen ? 'pointer-events-none' : ''
      }`}
    >
      <Link to="/" aria-label="X-Ray Tech home" className="lg:hidden">
        <BrandLogo />
      </Link>

      <Link to="/" aria-label="X-Ray Tech home" className="hidden lg:inline-flex">
        <BrandLogo />
      </Link>

      <div
        className={`flex items-center gap-3 ${
          menuOpen ? 'pointer-events-auto' : ''
        }`}
      >
        <button
          type="button"
          className="navbar-bell"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
          <span className="navbar-bell__dot" aria-hidden="true" />
        </button>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
        </div>

        <div className="lg:hidden">
          <HamburgerButton
            open={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
        </div>
      </div>

      {menuOpen &&
        createPortal(
          <>
            <div
              className="navbar-menu-scrim"
              onClick={close}
              aria-hidden="true"
            />
            <div className="navbar-menu" role="menu" aria-label="Quick actions">
              <MenuItem
                icon={<PlusIcon size={18} />}
                label="Add Certificate"
                onClick={close}
                to="/certificates/new"
              />
              <MenuItem
                icon={
                  isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />
                }
                label={isDark ? 'Light mode' : 'Dark mode'}
                onClick={handleThemeToggle}
              />
              <MenuItem
                icon={<UserIcon size={18} />}
                label="Profile"
                onClick={close}
                to="/profile"
              />
            </div>
          </>,
          document.body,
        )}
    </nav>
  );
}
