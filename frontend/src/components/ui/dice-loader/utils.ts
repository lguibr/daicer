import type { DieType } from './types';

export const AVAILABLE_DIE_TYPES: readonly DieType[] = [2, 4, 6, 8, 10, 12, 20] as const;

export const AVAILABLE_DIE_COLORS: readonly string[] = [
  '#38bdf8', // sky
  '#f97316', // orange
  '#f472b6', // pink
  '#a855f7', // purple
  '#22d3ee', // cyan
  '#4ade80', // emerald
  '#facc15', // amber
  '#fb7185', // rose
];

export function generateRandomDieColor(): string {
  if (AVAILABLE_DIE_COLORS.length === 0) {
    return '#ffffff';
  }
  const index = Math.floor(Math.random() * AVAILABLE_DIE_COLORS.length);
  return AVAILABLE_DIE_COLORS[index] ?? '#ffffff';
}

export function generateRandomDieType(): DieType {
  if (AVAILABLE_DIE_TYPES.length === 0) {
    return 20;
  }
  const index = Math.floor(Math.random() * AVAILABLE_DIE_TYPES.length);
  return AVAILABLE_DIE_TYPES[index] ?? 20;
}
