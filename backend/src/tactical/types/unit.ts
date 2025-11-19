/**
 * @file backend/src/tactical/types/unit.ts
 * @description Tactical unit and encounter type definitions
 */

import { z } from 'zod';
import type { GridPosition } from '../../types/spells.js';

/**
 * Unit allegiance
 */
export type UnitAllegiance = 'player' | 'enemy' | 'neutral';

/**
 * Tactical unit extending combat character with tactical metadata
 */
export interface TacticalUnit {
  // Base identification
  id: string;
  name: string;

  // Core stats
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  initiative: number;

  // Attributes (D&D 5e)
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  proficiencyBonus: number;

  // Combat properties
  speed: number; // Movement speed in feet (typically 30)
  reach: number; // Attack reach in feet (typically 5)

  // Positional
  position: GridPosition;
  facing?: number; // Direction 1-9 (numpad layout)

  // Allegiance
  allegiance: UnitAllegiance;
  isPlayer: boolean; // Convenience flag

  // Visual
  avatar?: string; // Emoji or asset reference

  // Status effects
  conditions: string[]; // e.g., 'prone', 'grappled', 'stunned'

  // Action economy
  movementRemaining: number; // Feet of movement left this turn
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  hasMoved: boolean;
  hasActed: boolean;

  // Death saves (for player characters)
  deathSaves?: {
    successes: number;
    failures: number;
  };

  // Spellcasting (optional)
  spellSlots?: Array<{
    level: number;
    total: number;
    used: number;
  }>;

  // AI behavior hints (for future automation)
  behaviorTags?: string[]; // e.g., 'aggressive', 'defensive', 'support', 'ranged'
}

/**
 * Combat log entry for tactical encounters
 */
export interface TacticalLogEntry {
  id: string;
  timestamp: number;
  round: number;
  actorId?: string;
  actorName?: string;
  type: 'movement' | 'attack' | 'spell' | 'damage' | 'healing' | 'condition' | 'turn' | 'initiative' | 'system';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Tactical encounter state
 */
export interface TacticalEncounter {
  // Identification
  id: string;
  arenaId: string;
  createdAt: number;
  updatedAt: number;

  // Units
  units: TacticalUnit[];

  // Combat state
  round: number;
  turnOrder: string[]; // Unit IDs in initiative order
  activeUnitId: string | null;
  phase: 'setup' | 'initiative' | 'in_progress' | 'complete';

  // Combat resolution
  isCombatOver: boolean;
  winner?: UnitAllegiance;

  // Combat log
  log: TacticalLogEntry[];

  // Dice history for determinism
  diceRollerSeed: number;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const GridPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export const UnitAllegianceSchema = z.enum(['player', 'enemy', 'neutral']);

export const TacticalUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  tempHp: z.number().default(0),
  armorClass: z.number(),
  initiative: z.number().default(0),

  strength: z.number(),
  dexterity: z.number(),
  constitution: z.number(),
  intelligence: z.number(),
  wisdom: z.number(),
  charisma: z.number(),

  proficiencyBonus: z.number(),

  speed: z.number().default(30),
  reach: z.number().default(5),

  position: GridPositionSchema,
  facing: z.number().int().min(1).max(9).optional(),

  allegiance: UnitAllegianceSchema,
  isPlayer: z.boolean(),

  avatar: z.string().optional(),

  conditions: z.array(z.string()).default([]),

  movementRemaining: z.number(),
  hasAction: z.boolean().default(true),
  hasBonusAction: z.boolean().default(true),
  hasReaction: z.boolean().default(true),
  hasMoved: z.boolean().default(false),
  hasActed: z.boolean().default(false),

  deathSaves: z
    .object({
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    })
    .optional(),

  spellSlots: z
    .array(
      z.object({
        level: z.number().int().min(1).max(9),
        total: z.number().int().min(0),
        used: z.number().int().min(0),
      })
    )
    .optional(),

  behaviorTags: z.array(z.string()).optional(),
});

export const TacticalLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  round: z.number(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  type: z.enum(['movement', 'attack', 'spell', 'damage', 'healing', 'condition', 'turn', 'initiative', 'system']),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const TacticalEncounterSchema = z.object({
  id: z.string(),
  arenaId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),

  units: z.array(TacticalUnitSchema),

  round: z.number().default(0),
  turnOrder: z.array(z.string()).default([]),
  activeUnitId: z.string().nullable().default(null),
  phase: z.enum(['setup', 'initiative', 'in_progress', 'complete']).default('setup'),

  isCombatOver: z.boolean().default(false),
  winner: UnitAllegianceSchema.optional(),

  log: z.array(TacticalLogEntrySchema).default([]),

  diceRollerSeed: z.number(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a tactical unit from basic parameters
 */
export function createTacticalUnit(params: {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  armorClass: number;
  position: GridPosition;
  allegiance: UnitAllegiance;
  avatar?: string;
  attributes?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencyBonus?: number;
  speed?: number;
  reach?: number;
}): TacticalUnit {
  const {
    id,
    name,
    hp,
    maxHp,
    armorClass,
    position,
    allegiance,
    avatar,
    attributes = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    proficiencyBonus = 2,
    speed = 30,
    reach = 5,
  } = params;

  return {
    id,
    name,
    hp,
    maxHp,
    tempHp: 0,
    armorClass,
    initiative: 0,
    ...attributes,
    proficiencyBonus,
    speed,
    reach,
    position,
    allegiance,
    isPlayer: allegiance === 'player',
    avatar,
    conditions: [],
    movementRemaining: speed,
    hasAction: true,
    hasBonusAction: true,
    hasReaction: true,
    hasMoved: false,
    hasActed: false,
  };
}

/**
 * Get ability modifier from ability score
 */
export function getAbilityModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

/**
 * Calculate initiative modifier from dexterity
 */
export function getInitiativeModifier(unit: TacticalUnit): number {
  return getAbilityModifier(unit.dexterity);
}

/**
 * Check if unit is alive
 */
export function isAlive(unit: TacticalUnit): boolean {
  return unit.hp > 0;
}

/**
 * Check if unit is unconscious
 */
export function isUnconscious(unit: TacticalUnit): boolean {
  return unit.hp <= 0 && unit.hp > -unit.maxHp;
}

/**
 * Check if unit is dead
 */
export function isDead(unit: TacticalUnit): boolean {
  return unit.hp <= -unit.maxHp;
}

/**
 * Reset unit's turn-based resources
 */
export function resetTurnResources(unit: TacticalUnit): void {
  unit.movementRemaining = unit.speed;
  unit.hasAction = true;
  unit.hasBonusAction = true;
  unit.hasReaction = true;
  unit.hasMoved = false;
  unit.hasActed = false;
}

/**
 * Get unit by ID from encounter
 */
export function getUnitById(encounter: TacticalEncounter, unitId: string): TacticalUnit | null {
  return encounter.units.find((u) => u.id === unitId) || null;
}

/**
 * Get units by allegiance
 */
export function getUnitsByAllegiance(encounter: TacticalEncounter, allegiance: UnitAllegiance): TacticalUnit[] {
  return encounter.units.filter((u) => u.allegiance === allegiance);
}

/**
 * Get living units
 */
export function getLivingUnits(encounter: TacticalEncounter): TacticalUnit[] {
  return encounter.units.filter((u) => isAlive(u));
}

/**
 * Add log entry to encounter
 */
export function addLogEntry(
  encounter: TacticalEncounter,
  entry: Omit<TacticalLogEntry, 'id' | 'timestamp' | 'round'>
): void {
  const logEntry: TacticalLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    round: encounter.round,
  };
  encounter.log.push(logEntry);
}
