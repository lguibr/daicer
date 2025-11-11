import { useState } from 'react';
import type { Language } from './types/shared';
import enTranslations from './i18n/locales/en.json';
import esTranslations from './i18n/locales/es.json';
import ptBRTranslations from './i18n/locales/pt-BR.json';

export type { Language };

// Flatten nested JSON structure into dot notation
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenTranslations(value as Record<string, unknown>, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  });

  return flattened;
}

const T = {
  en: flattenTranslations(enTranslations),
  es: flattenTranslations(esTranslations),
  'pt-BR': flattenTranslations(ptBRTranslations),
};

export const supportedLanguages = [
  { code: 'en' as Language, name: 'English', short: 'EN' },
  { code: 'es' as Language, name: 'Español', short: 'ES' },
  { code: 'pt-BR' as Language, name: 'Português', short: 'PT' },
];

// Get browser language preference
function getBrowserLanguage(): Language {
  const browserLang = navigator.language;
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt-BR';
  return 'en';
}

// Get stored language or fall back to browser language
function getInitialLanguage(): Language {
  const stored = localStorage.getItem('daicer-language');
  if (stored === 'en' || stored === 'es' || stored === 'pt-BR') {
    return stored;
  }
  return getBrowserLanguage();
}

export function useI18n() {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('daicer-language', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => T[language][key] || key;

  return {
    t,
    language,
    setLanguage,
    availableLanguages: supportedLanguages,
  };
}
