import enLocales from '@/locales/en.json';
import noLocales from '@/locales/no.json';

import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

type LanguageKeys = (typeof I18N_LANGUAGES)[keyof typeof I18N_LANGUAGES];
type LocaleType = typeof enLocales;

export const I18N_LANGUAGES = {
  EN: 'en',
  NO: 'no',
} as const;

export const LOCALES: Record<LanguageKeys, LocaleType> = {
  [I18N_LANGUAGES.EN]: enLocales,
  [I18N_LANGUAGES.NO]: noLocales,
};

export const LANGUAGE_MAP: Record<LanguageKeys, string> = {
  [I18N_LANGUAGES.EN]: 'English',
  [I18N_LANGUAGES.NO]: 'Norwegian',
};

export const initI18n = () => {
  i18next.use(initReactI18next).init({
    fallbackLng: I18N_LANGUAGES.EN,
    resources: Object.entries(LOCALES).reduce(
      (acc, [lang, translation]) => ({
        ...acc,
        [lang]: { translation },
      }),
      {},
    ),
  });
};

export const useLocales = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const locale = i18n.getResourceBundle(currentLanguage, 'translation') as LocaleType;

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return {
    locale,
    currentLanguage,
    changeLanguage,
  };
};
