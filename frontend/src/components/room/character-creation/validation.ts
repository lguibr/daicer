import { POINT_BUY_COSTS } from './constants';

export function getPointCost(score: number): number {
  return POINT_BUY_COSTS[score] || 0;
}

export function calculateTotalPoints(attributes: Record<string, number>): number {
  return Object.values(attributes).reduce((sum, score) => sum + getPointCost(score), 0);
}

export const parseAppearanceNumber = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatModifier = (modifier: number): string => (modifier >= 0 ? `+${modifier}` : `${modifier}`);
