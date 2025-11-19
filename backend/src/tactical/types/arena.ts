/**
 * @file backend/src/tactical/types/arena.ts
 * @description Arena and terrain type definitions for tactical combat
 */

import type { GridPosition } from '../../types/spells.js';

/**
 * Terrain types affecting movement, cover, and line of sight
 */
export enum TerrainType {
  /** Normal floor - no penalties */
  FLOOR = 'floor',
  /** Solid wall - blocks movement and LOS */
  WALL = 'wall',
  /** Difficult terrain - costs 2 movement per square */
  DIFFICULT = 'difficult',
  /** Half cover - grants +2 AC bonus */
  COVER_HALF = 'cover_half',
  /** Full cover - grants +5 AC bonus */
  COVER_FULL = 'cover_full',
  /** Hazardous terrain - deals damage on entry */
  HAZARD = 'hazard',
  /** Elevated position - grants +1 to ranged attack range */
  ELEVATION_HIGH = 'elevation_high',
  /** Lowered position - disadvantage for ranged attacks from outside */
  ELEVATION_LOW = 'elevation_low',
}

/**
 * Individual grid cell with terrain properties
 */
export interface GridCell {
  /** X coordinate (0-indexed) */
  x: number;
  /** Y coordinate (0-indexed) */
  y: number;
  /** Terrain type determining movement and combat properties */
  terrain: TerrainType;
  /** Whether this cell blocks line of sight */
  blocksLOS: boolean;
  /** Whether this cell blocks movement entirely */
  blocksMovement: boolean;
  /** Movement cost multiplier (1 = normal, 2 = difficult) */
  movementCost: number;
  /** AC bonus granted by cover */
  coverBonus: number;
  /** Optional hazard damage (e.g., "1d6 fire") */
  hazardDamage?: string;
}

/**
 * Spawn zone configuration for an arena
 */
export interface SpawnZones {
  /** Valid starting positions for player characters */
  players: GridPosition[];
  /** Valid starting positions for enemy units */
  enemies: GridPosition[];
}

/**
 * Asset references for future 3D rendering
 */
export interface ArenaAssetRefs {
  /** Floor texture/model reference */
  floor?: string;
  /** Wall texture/model references */
  walls?: string[];
  /** Prop objects with positions */
  props?: Array<{
    type: string;
    position: GridPosition;
    rotation?: number;
  }>;
}

/**
 * Complete tactical arena definition
 */
export interface TacticalArena {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description of the arena */
  description: string;
  /** Grid width in squares */
  width: number;
  /** Grid height in squares */
  height: number;
  /** All grid cells (should be width * height entries) */
  cells: GridCell[];
  /** Designated spawn zones for units */
  spawnZones: SpawnZones;
  /** Visual theme category */
  theme: 'dungeon' | 'tavern' | 'ruins' | 'forest' | 'castle';
  /** Asset references for 3D rendering (future use) */
  assetRefs?: ArenaAssetRefs;
}

/**
 * Helper to create a default GridCell
 */
export function createGridCell(x: number, y: number, terrain: TerrainType = TerrainType.FLOOR): GridCell {
  const cell: GridCell = {
    x,
    y,
    terrain,
    blocksLOS: terrain === TerrainType.WALL,
    blocksMovement: terrain === TerrainType.WALL,
    movementCost: 1,
    coverBonus: 0,
  };

  // Set properties based on terrain type
  switch (terrain) {
    case TerrainType.WALL:
      cell.blocksLOS = true;
      cell.blocksMovement = true;
      cell.coverBonus = 0;
      break;
    case TerrainType.DIFFICULT:
      cell.movementCost = 2;
      break;
    case TerrainType.COVER_HALF:
      cell.coverBonus = 2;
      break;
    case TerrainType.COVER_FULL:
      cell.coverBonus = 5;
      cell.blocksLOS = true;
      break;
    case TerrainType.HAZARD:
      cell.hazardDamage = '1d6 fire';
      break;
    case TerrainType.ELEVATION_HIGH:
      // High ground bonus handled in combat logic
      break;
    case TerrainType.ELEVATION_LOW:
      // Low ground penalty handled in combat logic
      break;
    case TerrainType.FLOOR:
    default:
      // Default values already set
      break;
  }

  return cell;
}

/**
 * Helper to get cell from grid by position
 */
export function getCellAt(arena: TacticalArena, pos: GridPosition): GridCell | null {
  if (pos.x < 0 || pos.x >= arena.width || pos.y < 0 || pos.y >= arena.height) {
    return null;
  }
  return arena.cells.find((c) => c.x === pos.x && c.y === pos.y) || null;
}

/**
 * Helper to check if position is valid for movement
 */
export function isValidPosition(arena: TacticalArena, pos: GridPosition): boolean {
  const cell = getCellAt(arena, pos);
  return cell !== null && !cell.blocksMovement;
}
