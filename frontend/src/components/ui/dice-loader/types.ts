import type { CSSProperties } from 'react';

export type DiceLoaderSize = 'small' | 'medium' | 'large';

export type DieType = 2 | 4 | 6 | 8 | 10 | 12 | 20;

export interface DiceLoaderProps {
  size?: DiceLoaderSize;
  dieType?: DieType;
  color?: string;
  showAxes?: boolean;
  message?: string;
  className?: string;
  style?: CSSProperties;
  diceCount?: number;
  maxDiceCount?: number;
}
