import { enLocales } from '@/locales/en';
import { noLocales } from '@/locales/no';

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

export const useLocales = <T extends keyof typeof enLocales>(params: string | string[]) => {
  const { t } = useTranslation();
  return {
    locale: t(params, { returnObjects: true }) as (typeof enLocales)[T],
  };
};
