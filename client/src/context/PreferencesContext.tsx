import { constants } from '@/config/constants';
import { CacheService, CacheServiceFactory } from '@/helpers/cache';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Preferences {
  duration: number;
  seats: number;
  title?: string;
  floor?: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences = {
  duration: 30,
  seats: 1,
  title: constants.defaultTitle,
};

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const cacheService: CacheService = CacheServiceFactory.getCacheService();
  const [preferences, setPreferences] = useState<Preferences>({
    duration: defaultPreferences.duration,
    seats: defaultPreferences.seats,
    title: defaultPreferences.title,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      const savedPreferences = await cacheService.get('preferences');
      if (savedPreferences) {
        const parsedPref = JSON.parse(savedPreferences);
        setPreferences(parsedPref);
      }

      setLoading(false);
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    if (!preferences.title) {
      preferences.title = defaultPreferences.title;
    }

    cacheService.save('preferences', JSON.stringify(preferences));
  }, [preferences]);

  if (loading) {
    return <></>;
  }

  return <PreferencesContext.Provider value={{ preferences, setPreferences }}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext)!;
