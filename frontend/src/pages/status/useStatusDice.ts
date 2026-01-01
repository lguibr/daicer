import { useEffect, useMemo, useState } from 'react';

import type { DieRoll, DieType } from '../../components/ui/dice-roll-animation/types';
import { AVAILABLE_DIE_COLORS } from '../../components/ui/dice-loader/utils';

type StatusDicePhase = 'loading' | 'revealing';

interface UseStatusDiceOptions {
  revealDelayMs?: number;
}

interface DigitDieDescriptor {
  type: DieType;
  result: number;
}

const DIGIT_TO_DIE: Record<string, DigitDieDescriptor> = {
  '0': { type: 10, result: 0 },
  '1': { type: 6, result: 1 },
  '2': { type: 20, result: 2 },
  '3': { type: 20, result: 3 },
  '4': { type: 8, result: 4 },
  '5': { type: 10, result: 5 },
  '6': { type: 6, result: 6 },
  '7': { type: 8, result: 7 },
  '8': { type: 8, result: 8 },
  '9': { type: 10, result: 9 },
};

const STATUS_DICE_COLORS = AVAILABLE_DIE_COLORS.slice(0, 5);

function buildDiceRollsFromTarget(targetDigits: string): DieRoll[] {
  const digits = targetDigits.split('').filter(Boolean);
  return digits.map((digit, index) => {
    const mapping = DIGIT_TO_DIE[digit] ?? DIGIT_TO_DIE['0'];
    const color = STATUS_DICE_COLORS[index % STATUS_DICE_COLORS.length] ?? '#38bdf8';
    if (!mapping) {
      return {
        type: 6,
        result: 0,
        id: `status-digit-${digit}-${index}`,
        color,
      };
    }
    return {
      type: mapping.type,
      result: mapping.result,
      id: `status-digit-${digit}-${index}`,
      color,
    };
  });
}

export interface StatusDiceState {
  phase: StatusDicePhase;
  dice: DieRoll[];
  showLoader: boolean;
  showResult: boolean;
}

export function useStatusDice(targetValue: string | number, options?: UseStatusDiceOptions): StatusDiceState {
  const { revealDelayMs = 1500 } = options ?? {};
  const normalizedTarget = useMemo(() => String(targetValue).trim(), [targetValue]);
  const dice = useMemo(() => buildDiceRollsFromTarget(normalizedTarget), [normalizedTarget]);

  const [phase, setPhase] = useState<StatusDicePhase>('loading');

  useEffect(() => {
    // Use timeout to avoid sync set state
    setTimeout(() => setPhase('loading'), 0);
    const timer = setTimeout(() => {
      setPhase('revealing');
    }, revealDelayMs);

    return () => clearTimeout(timer);
  }, [normalizedTarget, revealDelayMs]);

  return {
    phase,
    dice,
    showLoader: phase === 'loading',
    showResult: phase === 'revealing',
  };
}
