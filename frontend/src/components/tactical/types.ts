/**
 * @file frontend/src/components/tactical/types.ts
 * @description Type definitions for tactical combat components
 */

// ============================================================================
// Grid & Position
// ============================================================================

export interface GridPosition {
  x: number;
  y: number;
}

export type TerrainType =
  | 'open'
  | 'difficult_terrain'
  | 'light_cover'
  | 'heavy_cover'
  | 'wall'
  | 'chasm'
  | 'water'
  | 'elevated';

export interface GridCell {
  position: GridPosition;
  terrain: TerrainType;
  blocksLOS: boolean;
  blocksMovement: boolean;
  movementCost: number;
  coverBonus: number;
}

// ============================================================================
// Arena
// ============================================================================

export interface ArenaInfo {
  id: string;
  name: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
}

export interface TacticalArena extends ArenaInfo {
  cells: GridCell[];
  spawnZones: {
    players: GridPosition[];
    enemies: GridPosition[];
  };
}

// ============================================================================
// Units
// ============================================================================

export type UnitAllegiance = 'player' | 'enemy' | 'neutral';

export interface TacticalUnit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  initiative: number;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  proficiencyBonus: number;
  speed: number;
  reach: number;

  position: GridPosition;
  allegiance: UnitAllegiance;
  isPlayer: boolean;

  avatar?: string;
  conditions: string[];

  movementRemaining: number;
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  hasMoved: boolean;
  hasActed: boolean;
}

// ============================================================================
// Encounter
// ============================================================================

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

export interface TacticalEncounter {
  id: string;
  arenaId: string;
  createdAt: number;
  updatedAt: number;

  units: TacticalUnit[];

  round: number;
  turnOrder: string[];
  activeUnitId: string | null;
  phase: 'setup' | 'initiative' | 'in_progress' | 'complete';

  isCombatOver: boolean;
  winner?: UnitAllegiance;

  log: TacticalLogEntry[];
  diceRollerSeed: number;
}

// ============================================================================
// Commands & Actions
// ============================================================================

export interface ParsedCommand {
  actorName: string;
  actorId: string | null;
  intent: string;
  target?: {
    unitName?: string;
    unitId?: string | null;
    position?: GridPosition;
  };
  spellName?: string;
  confidence: number;
}

export interface PredictedDamage {
  min: number;
  max: number;
  avg: number;
}

export interface ActionPlan {
  id: string;
  commandText: string;
  parsed: ParsedCommand;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  preview: {
    movementPath?: GridPosition[];
    affectedUnits: Array<{
      unitId: string;
      effect: string;
      predictedDamage?: PredictedDamage;
    }>;
    diceNeeded: string[];
    resourceCost?: string;
    hitChance?: number;
  };
}
