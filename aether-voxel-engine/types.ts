export enum BlockType {
  AIR = 'air',
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone',
  WATER = 'water',
  SAND = 'sand',
  SNOW = 'snow',
  WALL_STONE = 'wall_stone',
  WALL_WOOD = 'wall_wood',
  FLOOR_WOOD = 'floor_wood',
  FLOOR_STONE = 'floor_stone',
  DOOR = 'door',
  STAIRS_UP = 'stairs_up',
  STAIRS_DOWN = 'stairs_down',
  LAVA = 'lava',
  BEDROCK = 'bedrock',
  TREE_LEAVES = 'tree_leaves',
  CACTUS = 'cactus'
}

export enum BiomeType {
  OCEAN = 'ocean',
  BEACH = 'beach',
  PLAINS = 'plains',
  FOREST = 'forest',
  DESERT = 'desert',
  MOUNTAIN = 'mountain',
  SNOWY_PEAKS = 'snowy_peaks'
}

export type ZLevel = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export interface Coordinates {
  x: number;
  y: number;
  z: ZLevel;
}

export interface Tile {
  x: number;
  y: number;
  z: ZLevel;
  block: BlockType;
  biome: BiomeType;
  isWalkable: boolean;
  isTransparent: boolean;
  variant?: number; // For visual variety (0-1)
}

export interface Chunk {
  x: number;
  y: number;
  tiles: Tile[][][]; // [z_index][y][x] mapped from -3..3 to 0..6
}

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'monster' | 'object';
  name: string;
  position: Coordinates;
  color: string;
  visionRadius: number;
}

export interface WorldConfig {
  seed: string;
  chunkSize: number;
  
  // Terrain & Noise
  globalScale: number; // Overall zoom of noise
  seaLevel: number; // -1.0 to 1.0
  elevationScale: number; // 0.001 to 0.1
  roughness: number; // Persistence (0.0 to 1.0)
  detail: number; // Octaves (1 to 8)
  
  // Biomes
  moistureScale: number; // 0.001 to 0.1
  temperatureOffset: number; // -1.0 to 1.0
  
  // Structures & Civ
  structureChance: number; // 0.0 to 1.0 (Probability a grid cell has a struct)
  structureSpacing: number; // 1 to 10 chunks (Density/Sparsity)
  structureSizeAvg: number; // 5 to 20 tiles
  roadDensity: number; // 0.0 to 1.0
  
  // Gameplay / Visuals
  fogRadius: number; // 5 to 50 tiles
}