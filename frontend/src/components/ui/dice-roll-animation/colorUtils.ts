import * as THREE from 'three';

import type { DieType } from '../dice-loader/types';

/**
 * Get the minimum and maximum possible results for a die type
 */
export function getDieRange(dieType: DieType): { min: number; max: number } {
  const ranges: Record<DieType, { min: number; max: number }> = {
    2: { min: 1, max: 2 },
    4: { min: 1, max: 4 },
    6: { min: 1, max: 6 },
    8: { min: 1, max: 8 },
    10: { min: 0, max: 9 },
    12: { min: 1, max: 12 },
    20: { min: 1, max: 20 },
    '20-ai': { min: 1, max: 20 },
  };

  return ranges[dieType] || { min: 1, max: 20 };
}

/**
 * Calculate a color based on die result using a gradient from red (bad) to green (good)
 * Min result → Dark red (#8b0000)
 * Max result → Bright green (#00ff00)
 */
export function getColorForResult(dieType: DieType, result: number): string {
  const { min, max } = getDieRange(dieType);

  // Normalize result to 0-1 range
  const normalized = (result - min) / (max - min);

  // Define color stops
  const darkRed = { r: 139, g: 0, b: 0 }; // #8b0000 - minimum
  const brightGreen = { r: 0, g: 255, b: 0 }; // #00ff00 - maximum

  // Interpolate between red and green
  const r = Math.round(darkRed.r + (brightGreen.r - darkRed.r) * normalized);
  const g = Math.round(darkRed.g + (brightGreen.g - darkRed.g) * normalized);
  const b = Math.round(darkRed.b + (brightGreen.b - darkRed.b) * normalized);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Smoothly interpolate between two colors
 */
export function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  const result = new THREE.Color();
  result.r = color1.r + (color2.r - color1.r) * t;
  result.g = color1.g + (color2.g - color1.g) * t;
  result.b = color1.b + (color2.b - color1.b) * t;
  return result;
}
