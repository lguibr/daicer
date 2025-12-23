import * as React from 'react';

import cn from '@/lib/utils';

export interface NumericStepperProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type'
> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  wrapperClassName?: string;
  inputClassName?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
}

function clampValue(value: number, min?: number, max?: number) {
  let next = value;
  if (typeof min === 'number') {
    next = Math.max(min, next);
  }
  if (typeof max === 'number') {
    next = Math.min(max, next);
  }
  return next;
}

const NumericStepper = React.forwardRef<HTMLInputElement, NumericStepperProps>((props, ref) => {
  const {
    value,
    onChange,
    min,
    max,
    step = 1,
    disabled,
    wrapperClassName,
    inputClassName,
    decreaseLabel = 'Decrease value',
    increaseLabel = 'Increase value',
    onBlur,
    className,
    ...inputProps
  } = props;

  const [draft, setDraft] = React.useState<string>(() => String(value));

  React.useEffect(() => {
    setDraft((current) => {
      const numericDraft = Number(current);
      if (!Number.isNaN(numericDraft) && numericDraft === value) {
        return current;
      }
      return String(value);
    });
  }, [value]);

  const pattern = /^-?\d*(\.\d*)?$/;

  const applyChange = React.useCallback(
    (nextValue: number) => {
      const clamped = clampValue(nextValue, min, max);
      setDraft(String(clamped));
      if (clamped !== value) {
        onChange(clamped);
      } else if (clamped === value && nextValue !== value) {
        // ensure parent knows about attempted clamp
        onChange(clamped);
      }
    },
    [max, min, onChange, value]
  );

  const handleAdjust = (direction: -1 | 1) => {
    if (disabled) {
      return;
    }
    const resolvedStep = Number.isFinite(step) && step > 0 ? step : 1;
    applyChange(Number(value) + direction * resolvedStep);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.trim();
    if (!pattern.test(next)) {
      return;
    }
    setDraft(next);

    if (next === '' || next === '-' || next === '.' || next === '-.' || next === '--') {
      return;
    }

    const parsed = Number(next);
    if (!Number.isNaN(parsed)) {
      applyChange(parsed);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (draft === '' || draft === '-' || draft === '.' || draft === '-.' || Number.isNaN(Number(draft))) {
      applyChange(typeof min === 'number' ? min : value);
    } else {
      applyChange(Number(draft));
    }

    if (onBlur) {
      onBlur(event);
    }
  };

  const decrementDisabled = disabled || (typeof min === 'number' && value <= min);
  const incrementDisabled = disabled || (typeof max === 'number' && value >= max);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-input bg-secondary/40 px-2 py-1',
        disabled && 'opacity-60',
        wrapperClassName
      )}
    >
      <button
        type="button"
        onClick={() => handleAdjust(-1)}
        disabled={decrementDisabled}
        aria-label={decreaseLabel}
        className="flex h-10 w-10 items-center justify-center rounded-md bg-midnight-700 text-shadow-100 transition-colors hover:bg-midnight-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
      >
        −
      </button>

      <input
        {...inputProps}
        ref={ref}
        value={draft}
        onChange={handleInputChange}
        onBlur={handleBlur}
        inputMode="decimal"
        pattern={pattern.source}
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        className={cn(
          'flex-1 bg-transparent text-center text-base text-shadow-50 outline-none placeholder:text-muted-foreground sm:text-sm',
          className,
          inputClassName
        )}
      />

      <button
        type="button"
        onClick={() => handleAdjust(1)}
        disabled={incrementDisabled}
        aria-label={increaseLabel}
        className="flex h-10 w-10 items-center justify-center rounded-md bg-midnight-700 text-shadow-100 transition-colors hover:bg-midnight-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
      >
        +
      </button>
    </div>
  );
});

NumericStepper.displayName = 'NumericStepper';

export default NumericStepper;
