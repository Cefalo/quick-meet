import { LOCALES, type LocaleType } from '@/config/locales';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

export const initI18n = () => {
  i18next.use(initReactI18next).init({
    fallbackLng: 'en',
    resources: LOCALES.reduce(
      (acc, { code, locale }) => {
        acc[code] = { translation: locale };
        return acc;
      },
      {} as Record<string, { translation: LocaleType }>,
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
