import clsx from 'clsx';
import type { SelectionCardProps } from './types';

export function SelectionCard({ label, description, detail, selected, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        'flex h-full flex-col gap-2 rounded-xl border p-4 text-left transition-shadow duration-200',
        selected
          ? 'border-aurora-400/70 bg-aurora-500/15 shadow-[0_12px_30px_rgba(183,142,33,0.25)]'
          : 'border-midnight-600 bg-midnight-800/70 hover:border-aurora-300/50 hover:bg-midnight-700/70'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.35em] text-shadow-200">{label}</span>
        {detail ? (
          <span className="rounded-full border border-midnight-500/60 bg-midnight-600/70 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-shadow-400">
            {detail}
          </span>
        ) : null}
      </div>
      {description ? <p className="text-xs leading-relaxed text-shadow-400">{description}</p> : null}
    </button>
  );
}
