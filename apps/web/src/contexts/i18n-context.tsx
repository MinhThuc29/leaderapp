'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import i18n, {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getSavedLanguage,
  saveLanguage,
  LanguageOption,
} from '@/lib/i18n';

interface I18nContextValue {
  language: SupportedLanguage;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const saved = getSavedLanguage();
    setLanguage(saved);
    if (i18nInstance.language !== saved) {
      void i18nInstance.changeLanguage(saved);
    }
    setIsReady(true);
  }, [i18nInstance]);

  const handleChangeLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      setLanguage(newLang);
      saveLanguage(newLang);
      await i18n.changeLanguage(newLang);
    },
    [],
  );

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ??
    SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;

  return (
    <I18nContext.Provider
      value={{
        language,
        currentLanguageOption,
        supportedLanguages: SUPPORTED_LANGUAGES,
        changeLanguage: handleChangeLanguage,
        isReady,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useAppLanguage() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useAppLanguage must be used within an I18nProvider');
  }
  return context;
}
