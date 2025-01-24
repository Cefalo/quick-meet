import { constants } from '@/config/constants';
import { useLocales } from '@/config/i18n';
import { CacheService, CacheServiceFactory } from '@/helpers/cache';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Preferences {
  duration: number;
  seats: number;
  title?: string;
  floor?: string;
  language?: string;
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
  language: 'en',
};

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const cacheService: CacheService = CacheServiceFactory.getCacheService();
  const [preferences, setPreferences] = useState<Preferences>({
    duration: defaultPreferences.duration,
    seats: defaultPreferences.seats,
    title: defaultPreferences.title,
    language: defaultPreferences.language,
  });
  const [loading, setLoading] = useState(true);
  const { changeLanguage, currentLanguage } = useLocales();

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
    if (preferences.language && preferences.language !== currentLanguage) {
      changeLanguage(preferences.language);
    }

    cacheService.save('preferences', JSON.stringify(preferences));
  }, [preferences]);

  if (loading) {
    return <></>;
  }

  return <PreferencesContext.Provider value={{ preferences, setPreferences }}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext)!;
