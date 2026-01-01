/**
 * ProgressBar Component
 * Smart progress bar with percentage and ETA calculation
 */

import { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  className?: string;
  showPercentage?: boolean;
  showETA?: boolean;
}

export function ProgressBar({ current, target, className, showPercentage = true, showETA = true }: ProgressBarProps) {
  const [eta, setEta] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const firstProgressRef = useRef<number | null>(null);

  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  useEffect(() => {
    // Start timing when progress moves from 0
    if (current > 0 && firstProgressRef.current === null) {
      firstProgressRef.current = current;
      startTimeRef.current = Date.now();
    }

    // Calculate ETA based on progress rate
    if (current > 0 && firstProgressRef.current !== null && startTimeRef.current !== null) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
      const progressMade = current - firstProgressRef.current;
      const remaining = target - current;

      if (progressMade > 0 && remaining > 0) {
        const rate = progressMade / elapsed; // items per second
        const estimatedSeconds = remaining / rate;
        setEta(Math.ceil(estimatedSeconds));
      } else if (remaining === 0) {
        setEta(0);
      }
    }
  }, [current, target]);

  // Reset when target changes
  useEffect(() => {
    startTimeRef.current = null;
    firstProgressRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEta(null);
  }, [target]);

  const formatETA = (seconds: number) => {
    if (seconds === 0) return 'Complete';
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}m ${secs}s`;
  };

  return (
    <div className={className}>
      <div className="relative h-2 overflow-hidden rounded-full bg-midnight-700">
        <div
          className="h-full bg-gradient-to-r from-accent via-aurora to-accent transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {(showPercentage || showETA) && (
        <div className="mt-2 flex items-center justify-between text-xs text-shadow-300">
          {showPercentage && (
            <span>
              {current} / {target} ({percentage}%)
            </span>
          )}
          {showETA && eta !== null && <span>{formatETA(eta)}</span>}
        </div>
      )}
    </div>
  );
}
