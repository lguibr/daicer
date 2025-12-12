/**
 * Structure Type Definitions
 * Structures are first-class biomes in the generation pipeline
 */

export interface RoadSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width?: number;
  material: StructureMaterial;
  path: Array<[number, number]>;
}

export type StructureMaterial = 'wood' | 'stone' | 'metal' | 'marble' | 'rock';

export type StructureType =
  | 'house'
  | 'tower'
  | 'temple'
  | 'castle'
  | 'dungeon'
  | 'cave_entrance'
  | 'ancient_tree'
  | 'stone_circle'
  | 'road'
  | 'bridge';

export type StructureFloor = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type LayoutAlgorithm = 'manual' | 'wfc' | 'cellular-automata';

export type NPCType = 'guard' | 'merchant' | 'monster' | 'villager' | 'boss';

export type FeatureType = 'loot' | 'trap' | 'decoration' | 'furniture' | 'light';

export interface StructureTile {
  material: StructureMaterial;
  tileType: 'wall' | 'floor' | 'door' | 'stairs' | 'empty' | 'road';
  floor: StructureFloor;
}

export interface NPCSpawnPoint {
  x: number;
  y: number;
  floor: StructureFloor;
  npcType: NPCType;
  spawnChance: number; // 0.0 to 1.0
}

export interface FeatureZone {
  x: number;
  y: number;
  floor: StructureFloor;
  featureType: FeatureType;
  radius: number; // size of the zone
  density: number; // 0.0 to 1.0, how many features in this zone
}

export interface Structure {
  id: string;
  name: string;
  type: StructureType;
  material: StructureMaterial;
  width: number;
  height: number;
  tiles: Partial<Record<StructureFloor, StructureTile[][]>>; // floor -> [y][x]
  worldX: number;
  worldY: number;
  npcSpawnPoints: NPCSpawnPoint[];
  featureZones: FeatureZone[];
  layoutAlgorithm: LayoutAlgorithm;
}

export interface StructurePlacementParams {
  biomeAffinityRules?: Record<string, Record<StructureType, number>>; // optional: place near existing biomes
  minDistance: number;
  maxStructures?: number;
  generateRoads: boolean;
  roadMaterial: StructureMaterial;
  wfcBlendEdges: boolean; // enable WFC edge blending at the end
}

export interface StructureGenerationResult {
  biomeGrid: string[][][]; // [floor][y][x], 7 floors: -3, -2, -1, 0, 1, 2, 3
  structures: Structure[];
  detailedStructures?: Structure[]; // For 2-phase generation: detailed layouts stored separately
}

/**
 * Helper: Map StructureFloor to array index (0-6)
 */
export function getFloorIndex(floor: StructureFloor): number {
  return floor + 3; // -3 -> 0, -2 -> 1, ..., 3 -> 6
}

/**
 * Helper: Map array index to StructureFloor
 */
export function getFloorFromIndex(index: number): StructureFloor {
  return (index - 3) as StructureFloor; // 0 -> -3, 1 -> -2, ..., 6 -> 3
}

/**
 * Helper: Convert structure tile to biome name
 * For Phase 1 (reserved): use structure_reserved_<id>
 * For Phase 2 (stamped): use structure_final_<material>_<tileType>
 */
export function structureTileToBiome(
  tile: StructureTile,
  floor: StructureFloor,
  isReserved = false,
  structureId?: string
): string {
  if (isReserved && structureId) {
    return `structure_reserved_${structureId}`;
  }

  if (tile.tileType === 'road') {
    return `structure_road_${tile.material}`;
  }
  if (tile.tileType === 'empty') {
    return ''; // Empty tiles don't become structure biomes
  }
  return `structure_final_${tile.material}_${tile.tileType}_${floor}`;
}

/**
 * Helper: Check if a biome is a structure
 */
export function isStructureBiome(biome: string): boolean {
  return biome.startsWith('structure_');
}

/**
 * Helper: Check if a biome is a reserved structure footprint
 */
export function isReservedBiome(biome: string): boolean {
  return biome.startsWith('structure_reserved_');
}

/**
 * Helper: Check if a biome is a final stamped structure
 */
export function isFinalStructureBiome(biome: string): boolean {
  return biome.startsWith('structure_final_');
}

/**
 * Helper: Get biome name for a structure at specific coordinates
 */
export function getStructureBiomeName(
  structure: Structure,
  floor: StructureFloor,
  localX: number,
  localY: number,
  isReserved = false
): string {
  const floorTiles = structure.tiles[floor];
  if (!floorTiles || !floorTiles[localY] || !floorTiles[localY][localX]) {
    return '';
  }

  const tile = floorTiles[localY][localX];
  return structureTileToBiome(tile, floor, isReserved, structure.id);
}
