/**
 * WFC Tile Definitions
 * Defines tiles and their adjacency rules for Wave Function Collapse
 */

export interface WFCTile {
  id: string;
  name: string;
  weight: number; // Probability weight for this tile
  // Adjacency constraints: which tile IDs can be adjacent in each direction
  north: string[];
  south: string[];
  east: string[];
  west: string[];
  // Visual/block type
  blockType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Define basic terrain tiles with adjacency rules
 */
export const TERRAIN_TILES: WFCTile[] = [
  {
    id: 'grass',
    name: 'Grass',
    weight: 10,
    north: ['grass', 'forest', 'stone', 'water'],
    south: ['grass', 'forest', 'stone', 'water'],
    east: ['grass', 'forest', 'stone', 'water'],
    west: ['grass', 'forest', 'stone', 'water'],
    blockType: 'grass',
  },
  {
    id: 'forest',
    name: 'Forest',
    weight: 5,
    north: ['grass', 'forest'],
    south: ['grass', 'forest'],
    east: ['grass', 'forest'],
    west: ['grass', 'forest'],
    blockType: 'grass',
    metadata: { hasTree: true },
  },
  {
    id: 'stone',
    name: 'Stone',
    weight: 3,
    north: ['grass', 'stone', 'mountain'],
    south: ['grass', 'stone', 'mountain'],
    east: ['grass', 'stone', 'mountain'],
    west: ['grass', 'stone', 'mountain'],
    blockType: 'stone',
  },
  {
    id: 'mountain',
    name: 'Mountain',
    weight: 2,
    north: ['stone', 'mountain'],
    south: ['stone', 'mountain'],
    east: ['stone', 'mountain'],
    west: ['stone', 'mountain'],
    blockType: 'stone',
    metadata: { elevation: 5 },
  },
  {
    id: 'water',
    name: 'Water',
    weight: 4,
    north: ['grass', 'water', 'sand'],
    south: ['grass', 'water', 'sand'],
    east: ['grass', 'water', 'sand'],
    west: ['grass', 'water', 'sand'],
    blockType: 'water',
  },
  {
    id: 'sand',
    name: 'Sand',
    weight: 3,
    north: ['sand', 'water', 'grass'],
    south: ['sand', 'water', 'grass'],
    east: ['sand', 'water', 'grass'],
    west: ['sand', 'water', 'grass'],
    blockType: 'sand',
  },
];

/**
 * Define structure tiles for building generation
 */
export const STRUCTURE_TILES: WFCTile[] = [
  {
    id: 'empty',
    name: 'Empty',
    weight: 20,
    north: ['empty', 'wall', 'door'],
    south: ['empty', 'wall', 'door'],
    east: ['empty', 'wall', 'door'],
    west: ['empty', 'wall', 'door'],
    blockType: 'air',
  },
  {
    id: 'wall',
    name: 'Wall',
    weight: 5,
    north: ['wall', 'corner', 'door'],
    south: ['wall', 'corner', 'door'],
    east: ['wall', 'corner', 'door'],
    west: ['wall', 'corner', 'door'],
    blockType: 'stone',
    metadata: { isWall: true },
  },
  {
    id: 'corner',
    name: 'Corner',
    weight: 2,
    north: ['wall', 'corner'],
    south: ['wall', 'corner'],
    east: ['wall', 'corner'],
    west: ['wall', 'corner'],
    blockType: 'stone',
    metadata: { isWall: true, isCorner: true },
  },
  {
    id: 'door',
    name: 'Door',
    weight: 1,
    north: ['wall', 'empty'],
    south: ['wall', 'empty'],
    east: ['wall', 'empty'],
    west: ['wall', 'empty'],
    blockType: 'air',
    metadata: { isDoor: true },
  },
  {
    id: 'floor',
    name: 'Floor',
    weight: 10,
    north: ['floor', 'wall', 'empty'],
    south: ['floor', 'wall', 'empty'],
    east: ['floor', 'wall', 'empty'],
    west: ['floor', 'wall', 'empty'],
    blockType: 'dirt',
    metadata: { isFloor: true },
  },
];

/**
 * Create a tile index for fast lookup
 */
export function createTileIndex(tiles: WFCTile[]): Map<string, WFCTile> {
  const index = new Map<string, WFCTile>();
  for (const tile of tiles) {
    index.set(tile.id, tile);
  }
  return index;
}

/**
 * Check if two tiles can be adjacent
 */
export function canBeAdjacent(tile1: WFCTile, tile2: WFCTile, direction: 'north' | 'south' | 'east' | 'west'): boolean {
  return tile1[direction].includes(tile2.id);
}
