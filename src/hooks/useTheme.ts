import { useContext } from 'react';
import { ThemeContext } from '../contexts/themeContext';
import type { ThemeContextValue } from '../contexts/themeContext';

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
