import clsx from 'clsx';

export interface SliderMark {
  value: number;
  label: string;
  description?: string;
}

interface DiscreteSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  marks: SliderMark[];
  description?: string;
}

/**
 * Styled discrete slider with tick marks and description feedback.
 */
export default function DiscreteSlider({ id, label, value, onChange, marks, description }: DiscreteSliderProps) {
  const min = marks[0]?.value ?? 0;
  const max = marks[marks.length - 1]?.value ?? 0;
  const activeMark =
    marks.find((mark) => mark.value === value) ?? marks[Math.max(0, Math.min(value - min, marks.length - 1))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.35em] text-shadow-300">
          {label}
        </label>
        <span className="rounded-full border border-accent/35 bg-accent/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent">
          {activeMark?.label}
        </span>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div className="h-[6px] rounded-full bg-midnight-600/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-aurora-400 via-accent to-nebula-400 transition-all duration-300"
              style={{ width: `${((value - min) / (max - min || 1)) * 100}%` }}
            />
          </div>
        </div>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
          className="relative z-10 w-full appearance-none bg-transparent focus:outline-none"
          style={{ accentColor: 'hsl(var(--accent))' }}
        />

        <div
          className="mt-4 grid gap-2 text-[0.55rem] font-medium uppercase tracking-[0.35em] text-shadow-500"
          style={{ gridTemplateColumns: `repeat(${marks.length}, minmax(0, 1fr))` }}
        >
          {marks.map((mark) => (
            <button
              key={mark.value}
              type="button"
              onClick={() => onChange(mark.value)}
              className={clsx(
                'flex flex-col items-center gap-1 transition-transform duration-150',
                value === mark.value ? 'scale-105 text-accent' : 'text-shadow-500 hover:text-shadow-200'
              )}
            >
              <span
                className={clsx(
                  'h-2 w-2 rounded-full border border-accent/40',
                  value === mark.value ? 'bg-accent shadow-[0_0_14px_rgba(122,73,217,0.45)]' : 'bg-midnight-500'
                )}
              />
              {mark.label}
            </button>
          ))}
        </div>
      </div>

      {activeMark?.description && <p className="text-xs leading-relaxed text-shadow-300">{activeMark.description}</p>}
      {description && <p className="text-[0.7rem] uppercase tracking-[0.35em] text-shadow-500">{description}</p>}
    </div>
  );
}
