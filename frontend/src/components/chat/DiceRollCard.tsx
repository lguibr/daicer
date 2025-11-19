import { memo } from 'react';
import cn from '../../lib/utils';
import { DiceRollAnimation } from '../ui/dice-roll-animation/DiceRollAnimation';
import { useDiceRollState } from './useDiceRollState';
import type { DiceRollData } from './useDiceRollState';

interface DiceRollCardProps {
  roll: DiceRollData;
  animate?: boolean;
}

/**
 * Get dice container size based on number of dice
 * More dice = more space, with slight overlap allowed for 4+
 * Capped at 300px to leave room for roll results (~50% max card width)
 */
function getDiceContainerSize(count: number): { width: string; height: string } {
  if (count === 1) return { width: '140px', height: '140px' }; // Single die fills space
  if (count === 2) return { width: '180px', height: '140px' }; // Reduced from 200px - closer together
  if (count === 3) return { width: '240px', height: '160px' }; // Triangle layout
  if (count === 4) return { width: '260px', height: '180px' }; // Reduced from 280px
  if (count === 5) return { width: '280px', height: '180px' }; // 5 dice with more overlap
  return { width: '300px', height: '200px' }; // 6+ dice, cap at 300px width
}

/**
 * Beautiful animated dice roll card with 3D dice
 * Memoized for stable rendering across re-renders
 */
function DiceRollCardComponent({ roll, animate = true }: DiceRollCardProps) {
  const { diceData, displayValue, criticalType, animationComplete, renderError, shouldAnimate, onAnimationComplete } =
    useDiceRollState({ roll, animate });

  const getCriticalClass = () => {
    if (criticalType === 'success') {
      return 'border-emerald-500/60 bg-gradient-to-br from-emerald-900/40 to-green-900/40 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
    }
    if (criticalType === 'fail') {
      return 'border-red-500/60 bg-gradient-to-br from-red-900/40 to-gray-900/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    }
    return 'border-aurora-500/40 bg-gradient-to-br from-aurora-900/30 to-midnight-900/30';
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all duration-500',
        getCriticalClass(),
        !animationComplete && 'scale-105 shadow-2xl'
      )}
    >
      {/* Purpose Label */}
      {roll.purpose && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-shadow-400">{roll.purpose}</p>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* 3D Dice Animation - Responsive size based on dice count */}
        {diceData.length > 0 && !renderError ? (
          <div
            className="flex-shrink-0"
            data-testid="dice-container"
            style={{ ...getDiceContainerSize(diceData.length), maxWidth: '50%' }}
          >
            <DiceRollAnimation
              dice={diceData}
              size="small"
              onComplete={onAnimationComplete}
              colorByResult
              autoStart={shouldAnimate}
              showAxes={false}
              className="!gap-0"
              style={getDiceContainerSize(diceData.length)}
            />
          </div>
        ) : renderError ? (
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{ ...getDiceContainerSize(1), maxWidth: '50%' }}
          >
            <span className="text-4xl opacity-50" title="Dice render error">
              🎲
            </span>
          </div>
        ) : null}

        {/* Main Roll Display */}
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-2xl font-bold text-shadow-50">
                {!animationComplete ? <span className="inline-block animate-pulse">{displayValue}</span> : displayValue}
              </p>
              <p className="text-sm text-shadow-400">{roll.dice}</p>
            </div>
          </div>

          {/* Breakdown */}
          {roll.breakdown && animationComplete && (
            <div className="rounded-lg bg-midnight-900/50 px-3 py-2 font-mono text-sm text-aurora-300">
              {roll.breakdown}
            </div>
          )}
        </div>
      </div>

      {/* Sparkle Effect for Critical Success */}
      {animationComplete && criticalType === 'success' && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-emerald-400/20" />
          <div className="absolute left-1/4 top-1/4 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <div
            className="absolute right-1/4 top-1/3 h-2 w-2 animate-pulse rounded-full bg-emerald-400"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 h-2 w-2 animate-pulse rounded-full bg-emerald-400"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      )}

      {/* Rolling Shimmer */}
      {!animationComplete && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-aurora-400/10 to-transparent" />
        </div>
      )}
    </div>
  );
}

/**
 * Memoized DiceRollCard - only re-renders when roll data actually changes
 * Custom comparison ensures deep equality check on roll object
 */
const DiceRollCard = memo(
  DiceRollCardComponent,
  (prevProps, nextProps) =>
    // Only re-render if roll data actually changed
    prevProps.animate === nextProps.animate &&
    prevProps.roll.dice === nextProps.roll.dice &&
    prevProps.roll.result === nextProps.roll.result &&
    prevProps.roll.breakdown === nextProps.roll.breakdown &&
    prevProps.roll.purpose === nextProps.roll.purpose
);

DiceRollCard.displayName = 'DiceRollCard';

export default DiceRollCard;
