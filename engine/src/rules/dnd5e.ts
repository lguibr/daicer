import { EntitySheet } from '../types';

/**
 * Calculates the ability modifier for a given ability score.
 * Formula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculates proficiency bonus based on level.
 * Formula: ceil(level / 4) + 1
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export interface CharacterSnapshot {
  hp: number;
  maxHp: number;
  stats: Record<string, number>; // Attributes
  inventory: Record<string, unknown>[]; // refine type if possible, usually InventoryItem[]
  level: number;
  experience: number;
  position: { x: number; y: number; z: number };
}

/**
 * Creates a lightweight snapshot of a character sheet for persistence/history.
 * This ensures we capture the exact state of a character at a specific turn.
 */
export function createCharacterSnapshot(sheet: EntitySheet | Partial<EntitySheet>): CharacterSnapshot | null {
  if (!sheet) return null;

  // Handle strict typing if CharacterSheet is fully compatible, otherwise allow partial duck typing
  // since backend sometimes populates loosely.

  return {
    hp: ((sheet as Record<string, unknown>).currentHp as number) ?? 10,
    maxHp: ((sheet as Record<string, unknown>).maxHp as number) ?? 10,
    stats: ((sheet as Record<string, unknown>).stats as Record<string, number>) || {},
    inventory: ((sheet as Record<string, unknown>).inventory as Record<string, unknown>[]) || [],
    level: ((sheet as Record<string, unknown>).level as number) ?? 1,
    experience: ((sheet as Record<string, unknown>).experience as number) ?? 0,
    position: ((sheet as Record<string, unknown>).position as { x: number; y: number; z: number }) || {
      x: 0,
      y: 0,
      z: 0,
    },
  };
}
