import type { CSSProperties } from 'react';

export type DiceLoaderSize = 'small' | 'medium' | 'large';

export type DieType = 2 | 4 | 6 | 8 | 10 | 12 | 20 | '20-ai';

export type DieVisualStyle = 'standard' | 'acrylic' | 'metallic' | 'glowing' | 'stone';

export interface DiceLoaderProps {
  size?: DiceLoaderSize;
  dieType?: DieType;
  color?: string;
  visualStyle?: DieVisualStyle;
  showAxes?: boolean;
  message?: string;
  className?: string;
  style?: CSSProperties;
  diceCount?: number;
  maxDiceCount?: number;
  showMessage?: boolean;
  /** If true, renders dice without animation (single frame, no requestAnimationFrame loop) */
  static?: boolean;
}
