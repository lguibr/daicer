import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import cn from '@/lib/utils';
import { Button } from './button';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showButtons?: boolean;
  className?: string;
  disabled?: boolean;
}

export function NumericInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showButtons = true,
  className,
  disabled = false,
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    setLocalValue(String(value));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-semibold text-shadow-100">{label}</label>}
      <div className="flex items-center gap-2">
        {showButtons && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className="h-10 w-10 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
        <input
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'h-10 w-20 rounded-lg border border-midnight-600 bg-midnight-800/60 text-center text-lg font-semibold text-shadow-50 transition-colors',
            'focus:border-aurora-400 focus:outline-none focus:ring-2 focus:ring-aurora-400/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />
        {showButtons && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className="h-10 w-10 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-shadow-500">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}
