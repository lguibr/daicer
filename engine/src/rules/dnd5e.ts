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
  inventory: any[]; // refine type if possible, usually InventoryItem[]
  level: number;
  experience: number;
  position: { x: number; y: number; z: number };
}

/**
 * Creates a lightweight snapshot of a character sheet for persistence/history.
 * This ensures we capture the exact state of a character at a specific turn.
 */
export function createCharacterSnapshot(sheet: CharacterSheet | any): CharacterSnapshot | null {
  if (!sheet) return null;

  // Handle strict typing if CharacterSheet is fully compatible, otherwise allow partial duck typing
  // since backend sometimes populates loosely.

  return {
    hp: sheet.currentHp ?? 10,
    maxHp: sheet.maxHp ?? 10,
    stats: sheet.stats || {},
    inventory: sheet.inventory || [],
    level: sheet.level ?? 1,
    experience: sheet.experience ?? 0,
    position: sheet.position || { x: 0, y: 0, z: 0 },
  };
}
