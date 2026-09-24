import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
import zhCN from '@/locales/zh-CN.json';
import zhTW from '@/locales/zh-TW.json';

export type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'zh-TW';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh-TW', label: '繁體中文', flag: '🇭🇰' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'vi';
export const LOCALE_STORAGE_KEY = 'leaderos_locale';
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function getSavedLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    // 1. Check localStorage
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }

    // 2. Check Cookie
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${LOCALE_COOKIE_NAME})=([^;]+)`));
    if (match && match[3]) {
      const cookieLang = decodeURIComponent(match[3]) as SupportedLanguage;
      if (SUPPORTED_LANGUAGES.some((l) => l.code === cookieLang)) {
        return cookieLang;
      }
    }
  } catch {
    // Fallback if localStorage or cookie not accessible
  }

  return DEFAULT_LANGUAGE;
}

export function saveLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
    // Set cookie for 1 year
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Ignore error
  }
}

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
} as const;

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== 'undefined' ? getSavedLanguage() : DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
