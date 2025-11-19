/**
 * Full-screen loading overlay with 3D dice spinner
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

import { DiceLoader } from './dice-loader';
import { useDebouncedBusy } from '../../hooks/useDebouncedBusy';
import { ProgressBar } from './progress-bar';

interface LoadingOverlayProps {
  active?: boolean;
  message?: string;
  enterDelayMs?: number;
  minVisibleMs?: number;
  className?: string;
  // Progress bar props
  showProgress?: boolean;
  progressCurrent?: number;
  progressTarget?: number;
  progressLabel?: ReactNode;
}

export function LoadingOverlay({
  active = true,
  message,
  enterDelayMs,
  minVisibleMs,
  className,
  showProgress = false,
  progressCurrent = 0,
  progressTarget = 100,
  progressLabel,
}: LoadingOverlayProps) {
  const { isBusy, pending } = useDebouncedBusy(Boolean(active), {
    enterDelayMs,
    minVisibleMs,
  });

  const lastMessageRef = useRef<string | undefined>(message);
  useEffect(() => {
    if (message) {
      lastMessageRef.current = message;
    }
  }, [message]);

  const displayedMessage = useMemo(() => message ?? lastMessageRef.current, [message]);

  if (!pending) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-out py-2',
        isBusy ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        className
      )}
      aria-hidden={!isBusy}
      aria-busy={isBusy}
      style={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
      }}
    >
      <div className="flex items-center gap-3 px-4">
        <DiceLoader size="small" message={displayedMessage} diceCount={1} maxDiceCount={1} />

        {showProgress && (
          <div className="w-64">
            {progressLabel && <div className="mb-1 text-xs text-shadow-200">{progressLabel}</div>}
            <ProgressBar current={progressCurrent} target={progressTarget} />
          </div>
        )}
      </div>
    </div>
  );
}
