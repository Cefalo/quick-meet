import { CacheServiceFactory } from '@/helpers/cache';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

const THEME_CACHE_KEY = 'themeMode' as const;

function getSystemTheme(): ResolvedThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeModeContextType {
  preference: ThemePreference;
  resolvedMode: ResolvedThemeMode;
  setPreference: (value: ThemePreference) => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const cache = useMemo(() => CacheServiceFactory.getCacheService(), []);
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemMode, setSystemMode] = useState<ResolvedThemeMode>(getSystemTheme);
  const [loaded, setLoaded] = useState(false);

  const resolvedMode: ResolvedThemeMode =
    preference === 'system' ? systemMode : preference;

  const setPreference = useCallback(
    (value: ThemePreference) => {
      setPreferenceState(value);
      cache.save(THEME_CACHE_KEY, value);
    },
    [cache]
  );

  useEffect(() => {
    const load = async () => {
      const saved = await cache.get(THEME_CACHE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setPreferenceState(saved as ThemePreference);
      }
      setLoaded(true);
    };
    load();
  }, [cache]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.setAttribute('data-mui-color-scheme', resolvedMode);
  }, [resolvedMode, loaded]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemMode(getSystemTheme());
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const value = useMemo<ThemeModeContextType>(
    () => ({ preference, resolvedMode, setPreference }),
    [preference, resolvedMode, setPreference]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
