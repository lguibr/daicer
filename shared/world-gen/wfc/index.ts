/**
 * Wave Function Collapse (WFC) Module
 * Exports WFC algorithm and related utilities
 */

export { collapseGrid, applyWFCToGrid, type WFCResult, type WFCOptions } from './wfc-solver';
export { createTileIndex, canBeAdjacent, TERRAIN_TILES, STRUCTURE_TILES, type WFCTile } from './wfc-tiles';
export { extractPatterns, patternsToAdjacencyRules, mergePatterns, type Pattern } from './wfc-patterns';
export {
  getPresetTiles,
  getPresetExamples,
  WFC_PRESETS,
  CASTLE_EXAMPLE,
  HOUSE_EXAMPLE,
  DUNGEON_ROOM_EXAMPLE,
  TERRAIN_EXAMPLE,
} from './wfc-presets';
