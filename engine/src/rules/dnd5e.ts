import { CharacterSheet } from '../types';

/**
 * Calculates the ability modifier for a given ability score.
 * Formula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
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
export function createCharacterSnapshot(sheet: CharacterSheet | Partial<CharacterSheet>): CharacterSnapshot | null {
  if (!sheet) return null;

  // Handle strict typing if CharacterSheet is fully compatible, otherwise allow partial duck typing
  // since backend sometimes populates loosely.

  return {
    hp: (sheet as any).currentHp ?? 10,
    maxHp: (sheet as any).maxHp ?? 10,
    stats: (sheet as any).stats || {},
    inventory: (sheet as any).inventory || [],
    level: (sheet as any).level ?? 1,
    experience: (sheet as any).experience ?? 0,
    position: (sheet as any).position || { x: 0, y: 0, z: 0 },
  };
}
