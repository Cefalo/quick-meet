import enLocales from '@/locales/en.json';
import noLocales from '@/locales/no.json';

import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

export const I18N_LANGUAGES = {
  EN: 'en',
  NO: 'no',
} as const;

export const LANGUAGE_MAP: Record<(typeof I18N_LANGUAGES)[keyof typeof I18N_LANGUAGES], string> = {
  [I18N_LANGUAGES.EN]: 'English',
  [I18N_LANGUAGES.NO]: 'Norwegian',
};

export const initI18n = () => {
  i18next.use(initReactI18next).init({
    fallbackLng: I18N_LANGUAGES.EN,
    resources: {
      [I18N_LANGUAGES.EN]: { translation: enLocales },
      [I18N_LANGUAGES.NO]: { translation: noLocales },
    },
  });
};

export const useLocales = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const locale = i18n.getResourceBundle(currentLanguage, 'translation');

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return {
    locale,
    currentLanguage,
    changeLanguage,
  };
};
