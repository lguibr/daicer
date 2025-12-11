import { Fragment, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import ptBRTranslations from './locales/pt-BR.json';

export type Language = 'en' | 'es' | 'pt-BR';

type TranslationDictionary = Record<string, string>;

function flattenTranslations(source: Record<string, unknown>, prefix = ''): TranslationDictionary {
  const entries = Object.entries(source);
  return entries.reduce<TranslationDictionary>((accumulator, [key, value]) => {
    const compositeKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(accumulator, flattenTranslations(value as Record<string, unknown>, compositeKey));
    } else {
      accumulator[compositeKey] = String(value);
    }
    return accumulator;
  }, {});
}

const translations: Record<Language, TranslationDictionary> = {
  en: flattenTranslations(enTranslations),
  es: flattenTranslations(esTranslations),
  'pt-BR': flattenTranslations(ptBRTranslations),
};

export const supportedLanguages = [
  { code: 'en' as Language, name: 'English', short: 'EN' },
  { code: 'es' as Language, name: 'Español', short: 'ES' },
  { code: 'pt-BR' as Language, name: 'Português', short: 'PT' },
];

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localize: (data: any, field: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: typeof supportedLanguages;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') {
    return 'en';
  }
  const browserLang = navigator.language;
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt-BR';
  return 'en';
}

function readStoredLanguage(): Language | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem('daicer-language') as Language | null;
    if (stored && (stored === 'en' || stored === 'es' || stored === 'pt-BR')) {
      return stored;
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

function writeStoredLanguage(language: Language): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem('daicer-language', language);
  } catch {
    // ignore storage access issues
  }
}

function getStoredLanguage(): Language {
  return readStoredLanguage() ?? getBrowserLanguage();
}

function LanguageResetBoundary({ language, children }: { language: Language; children: ReactNode }) {
  return <Fragment key={language}>{children}</Fragment>;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState((previous) => {
      if (previous === lang) {
        writeStoredLanguage(lang);
        return previous;
      }
      writeStoredLanguage(lang);
      return lang;
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let localized = translations[language][key];
      if (!localized && language !== 'en') {
        localized = translations.en[key];
      }

      const text = localized || key;

      if (params) {
        return Object.entries(params).reduce(
          (str, [pKey, pValue]) => str.replace(new RegExp(`{{${pKey}}}`, 'g'), String(pValue)),
          text
        );
      }

      return text;
    },
    [language]
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const localize = useCallback(
    (data: any, field: string): string => {
      if (!data) return '';
      const fallback = data[field] || '';

      if (language === 'en') return fallback;

      // Try specific language variant
      const langSuffix = language === 'es' ? '_es' : '_ptBR';
      const localizedValue = data[`${field}${langSuffix}`];

      return localizedValue || fallback;
    },
    [language]
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const value = useMemo<I18nContextValue>(
    () => ({
      t,
      localize,
      language,
      setLanguage,
      availableLanguages: supportedLanguages,
    }),
    [language, setLanguage, t, localize]
  );

  return (
    <I18nContext.Provider value={value}>
      <LanguageResetBoundary language={language}>{children}</LanguageResetBoundary>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
