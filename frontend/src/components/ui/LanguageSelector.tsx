import cn from '@/lib/utils';

import { useI18n } from '../../i18n';

const FLAG_MAP: Record<string, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  'pt-BR': '🇧🇷',
};

function getCompactLabel(code: string, fallback: string): string {
  return FLAG_MAP[code] ?? fallback;
}

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function LanguageSelector({ variant = 'default', className }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useI18n();

  const variantClass =
    variant === 'compact'
      ? 'rounded-lg border border-midnight-400/60 bg-midnight-500/80 px-2.5 py-1 text-[0.7rem] font-medium text-shadow-50 shadow-[0_8px_18px_rgba(4,7,12,0.35)] focus:border-aurora-300'
      : 'rounded-md border border-midnight-500/60 bg-midnight-500/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-shadow-200 focus:border-aurora-400 focus:ring-2 focus:ring-aurora-400/40';

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as typeof language)}
      data-testid="language-selector"
      className={cn(
        'outline-none transition-colors duration-200 focus:ring-2 focus:ring-aurora-300/40',
        variantClass,
        className
      )}
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code} title={`${lang.name} (${lang.short})`}>
          {variant === 'compact' ? getCompactLabel(lang.code, lang.short) : `${lang.short} · ${lang.name}`}
        </option>
      ))}
    </select>
  );
}
