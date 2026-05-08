import ThemeToggle from './ThemeToggle';
import type { PageKey } from './AppShell';

interface NavbarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS: ReadonlyArray<{ key: PageKey; label: string }> = [
  { key: 'demo', label: 'Demo' },
  { key: 'ocr', label: 'OCR Test' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-8 py-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800">
      <ul className="flex items-center gap-1 sm:gap-2">
        {NAV_ITEMS.map(item => {
          const active = item.key === currentPage;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-white dark:bg-primary-light'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
      <ThemeToggle />
    </nav>
  );
}
