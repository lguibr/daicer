import { useRef, useState, useEffect } from 'react';
import cn from '@/lib/utils';

export interface SliderMark {
  value: number;
  label: string;
  description?: string;
}

interface SliderWithMarksProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: SliderMark[];
  label?: string;
  showValue?: boolean;
  showTooltip?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SliderWithMarks({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks = [],
  label,
  showValue = true,
  showTooltip = true,
  className,
  disabled = false,
}: SliderWithMarksProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Calculate percentage for positioning
  const percentage = ((value - min) / (max - min)) * 100;

  // Find the current mark if value matches one
  const currentMark = marks.find((m) => m.value === value);

  useEffect(() => {
    if (isDragging && showTooltip) {
      setShowTooltipState(true);
    } else {
      const timer = setTimeout(() => setShowTooltipState(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isDragging, showTooltip]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-shadow-100">{label}</label>
          {showValue && (
            <span className="text-sm font-semibold text-aurora-200">{currentMark ? currentMark.label : value}</span>
          )}
        </div>
      )}

      <div className="relative px-2 py-4">
        {/* Track */}
        <div className="absolute left-2 right-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-midnight-700/80">
          {/* Filled track */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-aurora-500/70 to-aurora-400/70 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Marks */}
        {marks.map((mark) => {
          const markPercentage = ((mark.value - min) / (max - min)) * 100;
          const isActive = value === mark.value;

          return (
            <button
              key={mark.value}
              type="button"
              onClick={() => !disabled && onChange(mark.value)}
              disabled={disabled}
              className={cn(
                'absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transition-all',
                'flex h-4 w-4 items-center justify-center rounded-full border-2',
                isActive
                  ? 'border-aurora-300 bg-aurora-400 scale-125 shadow-lg shadow-aurora-500/50'
                  : 'border-midnight-600 bg-midnight-800 hover:border-aurora-400/50 hover:bg-midnight-700',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              style={{ left: `${markPercentage}%` }}
              title={mark.description || mark.label}
            >
              {isActive && <div className="h-2 w-2 rounded-full bg-aurora-100" />}
            </button>
          );
        })}

        {/* Slider input */}
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={cn(
            'relative z-20 h-8 w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-aurora-300 [&::-webkit-slider-thumb]:bg-aurora-400',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-aurora-500/50',
            '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-aurora-300 [&::-moz-range-thumb]:bg-aurora-400',
            '[&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-aurora-500/50',
            '[&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        />

        {/* Tooltip */}
        {showTooltip && showTooltipState && currentMark?.description && (
          <div
            className="pointer-events-none absolute top-0 z-30 -translate-x-1/2 -translate-y-full transition-all animate-in fade-in slide-in-from-bottom-2"
            style={{ left: `${percentage}%` }}
          >
            <div className="mb-2 max-w-xs rounded-lg border border-aurora-400/40 bg-midnight-900/95 px-3 py-2 text-center text-xs text-shadow-200 shadow-lg backdrop-blur">
              <p className="font-semibold text-aurora-200">{currentMark.label}</p>
              <p className="mt-1">{currentMark.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mark labels */}
      {marks.length > 0 && (
        <div className="flex justify-between px-2 text-xs">
          {marks.map((mark, index) => (
            <button
              key={mark.value}
              type="button"
              onClick={() => !disabled && onChange(mark.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center transition-colors',
                value === mark.value ? 'text-aurora-200 font-semibold' : 'text-shadow-500',
                disabled ? 'cursor-not-allowed' : 'hover:text-shadow-300 cursor-pointer'
              )}
              style={{
                width: `${100 / marks.length}%`,
                textAlign: index === 0 ? 'left' : index === marks.length - 1 ? 'right' : 'center',
              }}
            >
              <span className="whitespace-nowrap">{mark.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Current mark description */}
      {currentMark?.description && !showTooltipState && (
        <div className="rounded-lg border border-midnight-600 bg-midnight-800/40 p-3">
          <p className="text-sm text-shadow-300">{currentMark.description}</p>
        </div>
      )}
    </div>
  );
}
