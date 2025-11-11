/**
 * Language selector component
 */

import { useI18n } from '../../i18n';

/**
 * Language selector dropdown
 * @returns Language selector UI
 */
export default function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as typeof language)}
      data-testid="language-selector"
      className="rounded-md border border-midnight-500/60 bg-midnight-500/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-shadow-200 outline-none transition focus:border-aurora-400 focus:ring-2 focus:ring-aurora-400/40"
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.short} · {lang.name}
        </option>
      ))}
    </select>
  );
}
