import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usersAPI } from '../api';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ticketmandu-theme';

const getStoredTheme = () => localStorage.getItem(STORAGE_KEY) || 'system';
const getSystemTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;
    const onChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, effectiveTheme]);

  useEffect(() => {
    usersAPI.getPreferences()
      .then((prefs) => {
        if (prefs?.theme) setThemeState(prefs.theme);
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback(async (nextTheme, { persist = true } = {}) => {
    setThemeState(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    if (persist) await usersAPI.updatePreferences({ theme: nextTheme });
  }, []);

  const value = useMemo(() => ({ theme, effectiveTheme, setTheme }), [theme, effectiveTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
