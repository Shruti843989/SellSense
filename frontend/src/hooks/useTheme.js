import { useState, useEffect } from 'react';

/**
 * useTheme Hook:
 * Manages theme mode ('system' | 'light' | 'dark').
 * Persists user manual override in localStorage ('sellsense_theme').
 * Respects OS prefers-color-scheme when mode is 'system'.
 */
export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('sellsense_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      let isDark = false;
      if (mode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = mode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        setResolvedTheme('light');
      }
    };

    applyTheme(themeMode);

    // Save choice to localStorage
    try {
      localStorage.setItem('sellsense_theme', themeMode);
    } catch (e) {}

    // Listen to OS system preference changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  return { themeMode, setThemeMode, resolvedTheme };
}
