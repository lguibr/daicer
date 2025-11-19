/**
 * WFC Presets
 * Hand-crafted structure patterns for WFC-based generation
 */

import type { WFCTile } from './wfc-tiles';
import { TERRAIN_TILES, STRUCTURE_TILES } from './wfc-tiles';

/**
 * Example castle layout (used to train WFC)
 */
export const CASTLE_EXAMPLE: string[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'door', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

/**
 * Example village house
 */
export const HOUSE_EXAMPLE: string[][] = [
  ['empty', 'wall', 'wall', 'wall', 'empty'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['empty', 'wall', 'door', 'wall', 'empty'],
];

/**
 * Example dungeon room
 */
export const DUNGEON_ROOM_EXAMPLE: string[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['door', 'floor', 'floor', 'floor', 'floor', 'door'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'door', 'wall', 'wall'],
];

/**
 * Example terrain patterns (grassland with forest patches)
 */
export const TERRAIN_EXAMPLE: string[][] = [
  ['grass', 'grass', 'forest', 'forest', 'grass', 'grass'],
  ['grass', 'forest', 'forest', 'forest', 'forest', 'grass'],
  ['grass', 'forest', 'forest', 'forest', 'grass', 'grass'],
  ['grass', 'grass', 'forest', 'grass', 'grass', 'stone'],
  ['grass', 'grass', 'grass', 'grass', 'stone', 'stone'],
  ['water', 'sand', 'grass', 'grass', 'stone', 'mountain'],
];

/**
 * Preset collections for different structure types
 */
export const WFC_PRESETS = {
  castle: {
    tiles: STRUCTURE_TILES,
    examples: [CASTLE_EXAMPLE],
    patternSize: 3,
  },
  house: {
    tiles: STRUCTURE_TILES,
    examples: [HOUSE_EXAMPLE],
    patternSize: 3,
  },
  dungeon: {
    tiles: STRUCTURE_TILES,
    examples: [DUNGEON_ROOM_EXAMPLE],
    patternSize: 3,
  },
  terrain: {
    tiles: TERRAIN_TILES,
    examples: [TERRAIN_EXAMPLE],
    patternSize: 3,
  },
};

/**
 * Get tiles for a preset type
 */
export function getPresetTiles(presetType: keyof typeof WFC_PRESETS): WFCTile[] {
  return WFC_PRESETS[presetType].tiles;
}

/**
 * Get examples for a preset type
 */
export function getPresetExamples(presetType: keyof typeof WFC_PRESETS): string[][][] {
  return WFC_PRESETS[presetType].examples;
}
