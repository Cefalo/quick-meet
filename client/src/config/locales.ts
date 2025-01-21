import en from '@/locales/en.json';
import no from '@/locales/no.json';

export type LocaleType = typeof en;
interface ILocale {
  code: string;
  name: string;
  locale: LocaleType;
}
export const LOCALES: ILocale[] = [
  { code: 'en', name: 'English', locale: en },
  { code: 'no', name: 'Norwegian', locale: no },
] as const;
