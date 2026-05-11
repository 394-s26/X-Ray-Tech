import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from '../services/svgIcons';
import '../styles/components/ThemeToggle.css';

type Phase = 'idle' | 'exiting' | 'entering';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [visualDark, setVisualDark] = useState(isDark);
  const [phase, setPhase] = useState<Phase>('idle');

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
    setPhase('exiting');
  };

  const handleAnimationEnd = () => {
    if (phase === 'exiting') {
      setVisualDark(d => !d);
      setPhase('entering');
    } else {
      setPhase('idle');
    }
  };

  const Icon = visualDark ? MoonIcon : SunIcon;
  const phaseClass = phase === 'exiting' ? 'theme-icon--exit' : phase === 'entering' ? 'theme-icon--enter' : '';

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] hover:bg-[#7C49D5]/10 dark:hover:bg-[#A876FF]/15 transition-colors overflow-hidden"
    >
      <span className={phaseClass} onAnimationEnd={handleAnimationEnd}>
        <Icon size={18} />
      </span>
    </button>
  );
}
