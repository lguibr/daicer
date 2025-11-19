import type { CSSProperties } from 'react';

export type DieType = 2 | 4 | 6 | 8 | 10 | 12 | 20;

export interface DieRoll {
  type: DieType;
  result: number;
  id?: string;
  color?: string;
}

export interface DiceRollAnimationProps {
  dice: DieRoll[];
  size?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
  showAxes?: boolean;
  className?: string;
  style?: CSSProperties;
  autoStart?: boolean;
  colorByResult?: boolean; // Dynamically color dice based on result (min=red, max=green) - DEFAULT: true
}

export interface DieAnimationState {
  phase: 'rolling' | 'decelerating' | 'displaying' | 'complete';
  startTime: number;
  completionDelay: number;
  currentRotation: { x: number; y: number; z: number };
  rotationSpeed: { x: number; y: number; z: number };
  targetRotation: { x: number; y: number; z: number };
}
