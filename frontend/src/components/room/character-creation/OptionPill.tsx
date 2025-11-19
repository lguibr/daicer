import clsx from 'clsx';
import type { OptionPillProps } from './types';

export function OptionPill({ label, selected, onSelect }: OptionPillProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-150',
        selected
          ? 'border-accent/60 bg-accent/20 text-accent'
          : 'border-midnight-600 bg-midnight-700/60 text-shadow-300 hover:border-accent/40 hover:text-shadow-100'
      )}
    >
      {label}
    </button>
  );
}
