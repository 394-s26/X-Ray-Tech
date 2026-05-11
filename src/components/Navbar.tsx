import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
// import UserAvatar from './UserAvatar';
import { PlusIcon, TeamIcon, UserIcon } from '../services/svgIcons';
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
            {/* Vertical line extending from the avatar down through the dots */}
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
}

function NavExpandButton({ icon, label, spin = false }: NavExpandButtonProps) {
  return (
    <button
      aria-label={label}
      className="group h-10 flex items-center rounded-full border-2 border-[#7C49D5] text-[#7C49D5] dark:border-[#A876FF] dark:text-[#A876FF] hover:bg-[#7C49D5]/10 dark:hover:bg-[#A876FF]/15 transition-colors overflow-hidden"
    >
      <span className="w-9 h-9 flex items-center justify-center shrink-0">
        <span
          className={
            'inline-flex transition-transform duration-300 ' +
            (spin ? 'group-hover:rotate-90' : '')
          }
        >
          {icon}
        </span>
      </span>
      <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300">
        <span className="overflow-hidden whitespace-nowrap">
          <span className="pr-4 text-sm font-semibold">{label}</span>
        </span>
      </span>
    </button>
  );
}

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 bg-transparent">
      <div className="flex items-center gap-3">
        <NavExpandButton icon={<PlusIcon size={18} />} label="Add Certificate" spin />
        <NavExpandButton icon={<TeamIcon size={18} />} label="Manage Team" />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </nav>
  );
}
