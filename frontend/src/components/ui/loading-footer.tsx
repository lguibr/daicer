/**
 * LoadingFooter Component
 * Sticky footer for showing loading progress with dice animation
 * Inspired by DiscreteSlider theme
 */

import { X } from 'lucide-react';
import { DiceLoader } from './dice-loader';
import { ProgressBar } from './progress-bar';
import { Button } from './button';

interface LoadingFooterProps {
  message: string;
  current: number;
  total: number;
  onCancel?: () => void;
}

export function LoadingFooter({ message, current, total, onCancel }: LoadingFooterProps) {
  if (total === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-accent/30 bg-midnight-900/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex-shrink-0">
          <DiceLoader size="small" diceCount={2} maxDiceCount={2} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="mb-1 text-sm font-medium text-white sm:text-base">{message}</p>
          <ProgressBar current={current} target={total} showETA showPercentage />
        </div>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-shadow-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
