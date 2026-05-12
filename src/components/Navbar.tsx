import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import {
  MoonIcon,
  PlusIcon,
  SunIcon,
  TeamIcon,
  UserIcon,
} from '../services/svgIcons';
import ThemeToggle from './ThemeToggle';
import BrandLogo from './BrandLogo';
import '../styles/components/NavBar.css';

const PROFILE_MENU = ['Requirements', 'Team', 'Settings'];

function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-label="Profile"
        aria-expanded={open}
        className="w-10 h-10 rounded-full border-2 border-[#7C49D5] dark:border-[#A876FF] bg-white dark:bg-slate-800 flex items-center justify-center text-[#7C49D5] dark:text-[#A876FF] hover:bg-[#7C49D5]/10 dark:hover:bg-[#A876FF]/15 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7C49D5]/40"
      >
        <UserIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50">
          <div className="relative pr-3 py-3">
            <div className="absolute right-5 top-0 bottom-3 w-[3px] rounded-full bg-[#7C49D5]/50 dark:bg-[#A876FF]/50" />

            <ul className="relative flex flex-col gap-5 pt-1">
              {PROFILE_MENU.map((item) => (
                <li key={item} className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary dark:text-slate-100 hover:text-[#7C49D5] dark:hover:text-[#A876FF] whitespace-nowrap transition-colors"
                  >
                    {item}
                  </button>
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-[#7C49D5] dark:border-[#A876FF] shrink-0 relative z-10" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavExpandButtonProps {
  icon: React.ReactNode;
  label: string;
  spin?: boolean;
  alwaysExpanded?: boolean;
  to?: string;
}

function NavExpandButton({ icon, label, spin = false, alwaysExpanded = false, to }: NavExpandButtonProps) {
  const className = "cursor-pointer group h-10 flex items-center rounded-full border-2 border-[#7C49D5] text-[#7C49D5] dark:border-[#A876FF] dark:text-[#A876FF] hover:bg-[#7C49D5]/10 dark:hover:bg-[#A876FF]/15 transition-colors overflow-hidden";
  const inner = (
    <>
      <span className="w-9 h-9 flex items-center justify-center shrink-0">
        <span className={'inline-flex transition-transform duration-300 ' + (spin ? 'group-hover:rotate-90' : '')}>
          {icon}
        </span>
      </span>
      <span className={alwaysExpanded ? 'grid grid-cols-[1fr]' : 'grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300'}>
        <span className="overflow-hidden whitespace-nowrap">
          <span className="pr-4 text-sm font-semibold">{label}</span>
        </span>
      </span>
    </>
  );

  if (to) {
    return <Link to={to} aria-label={label} className={className}>{inner}</Link>;
  }
  return (
    <button aria-label={label} className={className}>{inner}</button>
  );
}

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

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
    close();
  };

  if (mode === 'minimal') {
    return (
      <nav className="sticky top-0 z-50 flex items-center justify-end px-4 sm:px-5 py-3 sm:py-4 m-3 rounded-2xl">
        <ThemeToggle />
      </nav>
    );
  }

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 m-3 rounded-2xl ${
        menuOpen ? 'pointer-events-none' : ''
      }`}
    >
      <div
        className={`flex items-center gap-3 ${
          menuOpen ? 'pointer-events-auto' : ''
        }`}
      >
        <div className="lg:hidden">
          <HamburgerButton
            open={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
        </div>

        <Link to="/" aria-label="X-Ray Tech home" className="hidden lg:inline-flex">
          <BrandLogo />
        </Link>
      </div>

      <Link to="/" aria-label="X-Ray Tech home" className="lg:hidden">
        <BrandLogo />
      </Link>

      <div className="hidden lg:flex items-center gap-3">
        <NavExpandButton
          icon={<PlusIcon size={18} />}
          label="Add Certificate"
          alwaysExpanded
          to="/certificates/new"
        />
        <NavExpandButton icon={<TeamIcon size={18} />} label="Manage Team" alwaysExpanded />
        <ThemeToggle />
        <ProfileMenu />
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
                icon={<TeamIcon size={18} />}
                label="Manage Team"
                onClick={close}
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
              />
            </div>
          </>,
          document.body,
        )}
    </nav>
  );
}
