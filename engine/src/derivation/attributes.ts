/**
 * Attribute Derivation
 * Core logic for D&D 5e attribute modifiers.
 */

/**
 * Calculates the ability score modifier.
 * Formula: floor((score - 10) / 2)
 *
 * @param score - The raw ability score (e.g., 15)
 * @returns The calculated modifier (e.g., +2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Standard array of ability scores.
 */
export const ABILITY_SCORES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export type AbilityScore = (typeof ABILITY_SCORES)[number];

export type Attributes = Record<AbilityScore, number>;
