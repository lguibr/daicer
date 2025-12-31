/**
 * @file frontend/src/types/tactical.ts
 * @description Frontend-compatible tactical types (mirrored from backend)
 */

export interface GridPosition {
  x: number;
  y: number;
}

export type TerrainType =
  | 'floor'
  | 'wall'
  | 'difficult'
  | 'cover_half'
  | 'cover_full'
  | 'hazard'
  | 'elevation_high'
  | 'elevation_low';

export interface GridCell {
  x: number;
  y: number;
  terrain: TerrainType;
  blocksLOS: boolean;
  blocksMovement: boolean;
  movementCost: number;
  coverBonus: number;
  hazardDamage?: string;
}

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
  facing?: number;

  allegiance: 'player' | 'enemy' | 'neutral';
  isPlayer: boolean;

  avatar?: string;
  conditions: string[];

  movementRemaining: number;
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
  hasMoved: boolean;
  hasActed: boolean;

  deathSaves?: {
    successes: number;
    failures: number;
  };

  spellSlots?: Array<{
    level: number;
    total: number;
    used: number;
  }>;

  behaviorTags?: string[];
}

export interface TacticalState {
  version: number;
  lastEventId: string | null;

  encounterId: string;
  arenaId: string;
  phase: 'setup' | 'initiative' | 'in_progress' | 'complete';

 
  arena: any | null;
  units: TacticalUnit[];

  turnOrder: string[];
  activeUnitId: string | null;
  round: number;

  pendingCommand: string | null;
 
  parsedCommand: any | null;
 
  actionPlan: any | null;

  isCombatOver: boolean;
  winner: 'player' | 'enemy' | 'neutral' | null;

 
  log: any[];
 
  diceHistory: any[];
  diceRollerSeed: number;
}
