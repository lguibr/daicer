/**
 * Full-screen loading overlay with 3D dice spinner
 */

import { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';

import { DiceLoader } from './dice-loader';
import type { DiceLoaderSize } from './dice-loader';
import { useDebouncedBusy } from '../../hooks/useDebouncedBusy';

interface LoadingOverlayProps {
  active?: boolean;
  message?: string;
  size?: DiceLoaderSize;
  diceCount?: number;
  maxDiceCount?: number;
  enterDelayMs?: number;
  minVisibleMs?: number;
  className?: string;
}

export function LoadingOverlay({
  active = true,
  message,
  size = 'large',
  diceCount,
  maxDiceCount,
  enterDelayMs,
  minVisibleMs,
  className,
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
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-out',
        isBusy ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        className
      )}
      aria-hidden={!isBusy}
      aria-busy={isBusy}
      style={{
        backdropFilter: 'blur(18px)',
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
      }}
    >
      <DiceLoader size={size} message={displayedMessage} diceCount={diceCount} maxDiceCount={maxDiceCount} />
    </div>
  );
}
