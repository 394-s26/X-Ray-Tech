import { createElement, useLayoutEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { ThemeContext } from './themeContext';
import type { Theme, ResolvedTheme } from './themeContext';

const STORAGE_KEY = 'app-theme';

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolveTheme = (theme: Theme): ResolvedTheme =>
  theme === 'system' ? getSystemTheme() : theme;

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'system';
  });

  const resolvedTheme = resolveTheme(theme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  useLayoutEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  };

  return createElement(
    ThemeContext.Provider,
    { value: { theme, resolvedTheme, setTheme } },
    children,
  );
};
