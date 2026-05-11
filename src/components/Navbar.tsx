import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import { PlusIcon } from '../services/svgIcons';
import '../styles/components/NavBar.css';


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
        className="w-10 h-10 rounded-full border-2 border-slate-600 dark:border-slate-400 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <UserAvatar user={null} size="md" />
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-3 z-50">
          <div className="min-w-[180px] rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl overflow-hidden">
            <MenuItem>Requirements</MenuItem>
            <MenuItem>Team</MenuItem>
            <MenuItem>Settings</MenuItem>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-full px-4 py-3 text-left text-sm font-medium text-primary dark:text-slate-100 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
    >
      {children}
    </button>
  );
}

function AddCertificateButton() {
  return (
    <button
      aria-label="Add certificate"
      className="group h-10 flex items-center rounded-full border-2 border-slate-600 dark:border-slate-400 text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors overflow-hidden"
    >
      <span className="w-9 h-9 flex items-center justify-center shrink-0">
        <PlusIcon
          size={18}
          className="transition-transform duration-300 group-hover:rotate-90"
        />
      </span>
      <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300">
        <span className="overflow-hidden whitespace-nowrap">
          <span className="pr-4 text-sm font-semibold">add certificate</span>
        </span>
      </span>
    </button>
  );
}

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 bg-transparent">
      <AddCertificateButton />

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </nav>
  );
}
