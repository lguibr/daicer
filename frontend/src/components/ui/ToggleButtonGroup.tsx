import { ReactNode } from 'react';
import cn from '@/lib/utils';

export interface ToggleButtonOption<T = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

interface ToggleButtonGroupProps<T = string> {
  options: ToggleButtonOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'md',
  variant = 'default',
}: ToggleButtonGroupProps<T>) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && <label className="text-sm font-semibold text-shadow-100">{label}</label>}
      <div
        className={cn('inline-flex flex-wrap gap-2', variant === 'compact' && 'gap-1')}
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = option.disabled;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-all',
                sizeClasses[size],
                isSelected
                  ? 'border-aurora-400 bg-aurora-500/20 text-aurora-100 shadow-sm ring-2 ring-aurora-400/30'
                  : 'border-midnight-600 bg-midnight-800/60 text-shadow-300 hover:border-midnight-500 hover:bg-midnight-700/80',
                isDisabled && 'cursor-not-allowed opacity-50',
                variant === 'compact' && 'min-w-0'
              )}
              aria-pressed={isSelected}
              title={option.description}
            >
              {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
              <span className={cn(variant === 'compact' && 'whitespace-nowrap')}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
