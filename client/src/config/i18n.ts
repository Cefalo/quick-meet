import enLocales from '@/locales/en.json';
import noLocales from '@/locales/no.json';

import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

export const initI18n = () => {
  i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: true,
    resources: {
      en: { translation: enLocales },
      no: { translation: noLocales },
    },
  });
};

export const useLocales = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const locale = i18n.getResourceBundle(currentLanguage, 'translation');

  return { locale };
};
