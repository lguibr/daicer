File: biome-schema.ts
""""""
import { z } from 'zod';

/**
 * Biome Schema
 * Defines biome properties for procedural generation
 */

export const BiomeTypeEnum = z.enum([
  'ocean',
  'deep_ocean',
  'frozen_ocean',
  'beach',
  'plains',
  'forest',
  'birch_forest',
  'dark_forest',
  'jungle',
  'savanna',
  'desert',
  'badlands',
  'mountains',
  'snowy_peaks',
  'tundra',
  'taiga',
  'snowy_taiga',
  'swamp',
  'mushroom_fields',
  'void', // Sky layers
]);

export type BiomeType = z.infer<typeof BiomeTypeEnum>;

export const ClimateDataSchema = z.object({
  temperature: z.number().min(-1).max(1), // -1 (frozen) to 1 (hot)
  moisture: z.number().min(-1).max(1), // -1 (dry) to 1 (wet)
  continentalness: z.number().min(-1).max(1), // -1 (ocean) to 1 (inland)
  erosion: z.number().min(-1).max(1), // -1 (high erosion/smooth) to 1 (low erosion/jagged)
  weirdness: z.number().min(-1).max(1), // -1 (normal) to 1 (strange/varied)
});

export type ClimateData = z.infer<typeof ClimateDataSchema>;

export const BiomeDefinitionSchema = z.object({
  type: BiomeTypeEnum,
  name: z.string(),
  // Climate requirements
  temperatureRange: z.tuple([z.number(), z.number()]), // [min, max]
  moistureRange: z.tuple([z.number(), z.number()]),
  continentalnessRange: z.tuple([z.number(), z.number()]).optional(),
  elevationRange: z.tuple([z.number(), z.number()]).optional(),
  // Terrain properties
  surfaceBlock: z.string(), // BlockType as string
  subsurfaceBlock: z.string(),
  undergroundBlock: z.string(),
  baseElevation: z.number().default(0), // Base elevation modifier
  elevationVariance: z.number().default(0.5), // How much elevation varies
  // Feature spawn rates
  treeSpawnRate: z.number().min(0).max(1).default(0),
  oreSpawnRate: z.number().min(0).max(1).default(0),
  creatureSpawnRate: z.number().min(0).max(1).default(0),
  // Visual
  color: z.string().optional(), // Hex color for map rendering
});

export type BiomeDefinition = z.infer<typeof BiomeDefinitionSchema>;

/**
 * Biome Map Schema
 * Stores biome distribution for a world
 */
export const BiomeMapSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  seed: z.string(),
  // Biome grid (biome type at each position, downsampled for efficiency)
  grid: z.array(z.array(BiomeTypeEnum)), // [y][x]
  // Generation parameters
  temperatureBias: z.number().default(0),
  moistureBias: z.number().default(0),
  continentalnessBias: z.number().default(0),
});

export type BiomeMap = z.infer<typeof BiomeMapSchema>;

/**
 * Standard biome definitions
 * Used for biome selection during chunk generation
 */
export const BIOME_DEFINITIONS: Record<BiomeType, Omit<BiomeDefinition, 'type'>> = {
  ocean: {
    name: 'Ocean',
    temperatureRange: [-0.3, 0.5],
    moistureRange: [0.3, 1.0],
    continentalnessRange: [-1.0, -0.3],
    surfaceBlock: 'water',
    subsurfaceBlock: 'sand',
    undergroundBlock: 'stone',
    baseElevation: -0.4,
    elevationVariance: 0.2,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.05,
    color: '#1E6BB8',
  },
  deep_ocean: {
    name: 'Deep Ocean',
    temperatureRange: [-0.5, 0.3],
    moistureRange: [0.5, 1.0],
    continentalnessRange: [-1.0, -0.6],
    surfaceBlock: 'water',
    subsurfaceBlock: 'gravel',
    undergroundBlock: 'stone',
    baseElevation: -0.7,
    elevationVariance: 0.1,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.15,
    creatureSpawnRate: 0.1,
    color: '#0E4A8A',
  },
  frozen_ocean: {
    name: 'Frozen Ocean',
    temperatureRange: [-1.0, -0.5],
    moistureRange: [0.3, 1.0],
    continentalnessRange: [-1.0, -0.3],
    surfaceBlock: 'ice',
    subsurfaceBlock: 'packed_ice',
    undergroundBlock: 'stone',
    baseElevation: -0.3,
    elevationVariance: 0.2,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.05,
    creatureSpawnRate: 0.02,
    color: '#7FC8F8',
  },
  beach: {
    name: 'Beach',
    temperatureRange: [-0.2, 0.8],
    moistureRange: [-0.5, 0.5],
    continentalnessRange: [-0.3, 0.1],
    elevationRange: [-0.2, 0.1],
    surfaceBlock: 'sand',
    subsurfaceBlock: 'sand',
    undergroundBlock: 'stone',
    baseElevation: 0.0,
    elevationVariance: 0.1,
    treeSpawnRate: 0.02,
    oreSpawnRate: 0.05,
    creatureSpawnRate: 0.05,
    color: '#F4E4C1',
  },
  plains: {
    name: 'Plains',
    temperatureRange: [-0.1, 0.6],
    moistureRange: [-0.3, 0.5],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.1,
    elevationVariance: 0.3,
    treeSpawnRate: 0.05,
    oreSpawnRate: 0.15,
    creatureSpawnRate: 0.1,
    color: '#8BC34A',
  },
  forest: {
    name: 'Forest',
    temperatureRange: [0.0, 0.7],
    moistureRange: [0.2, 0.8],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.15,
    elevationVariance: 0.4,
    treeSpawnRate: 0.6,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.15,
    color: '#4CAF50',
  },
  birch_forest: {
    name: 'Birch Forest',
    temperatureRange: [0.1, 0.6],
    moistureRange: [0.3, 0.7],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.15,
    elevationVariance: 0.35,
    treeSpawnRate: 0.55,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.12,
    color: '#76C773',
  },
  dark_forest: {
    name: 'Dark Forest',
    temperatureRange: [0.2, 0.7],
    moistureRange: [0.5, 1.0],
    surfaceBlock: 'podzol',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.2,
    elevationVariance: 0.5,
    treeSpawnRate: 0.8,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.2,
    color: '#2E7D32',
  },
  jungle: {
    name: 'Jungle',
    temperatureRange: [0.6, 1.0],
    moistureRange: [0.6, 1.0],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.2,
    elevationVariance: 0.6,
    treeSpawnRate: 0.9,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.25,
    color: '#1B5E20',
  },
  savanna: {
    name: 'Savanna',
    temperatureRange: [0.5, 1.0],
    moistureRange: [-0.3, 0.3],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.2,
    elevationVariance: 0.4,
    treeSpawnRate: 0.1,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.15,
    color: '#C5A868',
  },
  desert: {
    name: 'Desert',
    temperatureRange: [0.6, 1.0],
    moistureRange: [-1.0, -0.2],
    surfaceBlock: 'sand',
    subsurfaceBlock: 'sandstone',
    undergroundBlock: 'stone',
    baseElevation: 0.15,
    elevationVariance: 0.3,
    treeSpawnRate: 0.01,
    oreSpawnRate: 0.12,
    creatureSpawnRate: 0.05,
    color: '#EDC9AF',
  },
  badlands: {
    name: 'Badlands',
    temperatureRange: [0.7, 1.0],
    moistureRange: [-1.0, -0.4],
    surfaceBlock: 'terracotta',
    subsurfaceBlock: 'red_sand',
    undergroundBlock: 'stone',
    baseElevation: 0.3,
    elevationVariance: 0.7,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.2,
    creatureSpawnRate: 0.03,
    color: '#D84315',
  },
  mountains: {
    name: 'Mountains',
    temperatureRange: [-0.2, 0.5],
    moistureRange: [-0.5, 0.5],
    elevationRange: [0.4, 1.0],
    surfaceBlock: 'stone',
    subsurfaceBlock: 'stone',
    undergroundBlock: 'stone',
    baseElevation: 0.6,
    elevationVariance: 0.8,
    treeSpawnRate: 0.02,
    oreSpawnRate: 0.3,
    creatureSpawnRate: 0.08,
    color: '#78909C',
  },
  snowy_peaks: {
    name: 'Snowy Peaks',
    temperatureRange: [-1.0, -0.3],
    moistureRange: [0.0, 1.0],
    elevationRange: [0.5, 1.0],
    surfaceBlock: 'snow',
    subsurfaceBlock: 'stone',
    undergroundBlock: 'stone',
    baseElevation: 0.7,
    elevationVariance: 0.9,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.25,
    creatureSpawnRate: 0.03,
    color: '#ECEFF1',
  },
  tundra: {
    name: 'Tundra',
    temperatureRange: [-1.0, -0.2],
    moistureRange: [-0.5, 0.5],
    surfaceBlock: 'snow',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.1,
    elevationVariance: 0.2,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.1,
    creatureSpawnRate: 0.05,
    color: '#CFD8DC',
  },
  taiga: {
    name: 'Taiga',
    temperatureRange: [-0.3, 0.3],
    moistureRange: [0.2, 0.8],
    surfaceBlock: 'grass',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.15,
    elevationVariance: 0.4,
    treeSpawnRate: 0.5,
    oreSpawnRate: 0.15,
    creatureSpawnRate: 0.12,
    color: '#558B2F',
  },
  snowy_taiga: {
    name: 'Snowy Taiga',
    temperatureRange: [-0.8, -0.2],
    moistureRange: [0.2, 0.8],
    surfaceBlock: 'snow',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.15,
    elevationVariance: 0.4,
    treeSpawnRate: 0.4,
    oreSpawnRate: 0.15,
    creatureSpawnRate: 0.08,
    color: '#A5D6A7',
  },
  swamp: {
    name: 'Swamp',
    temperatureRange: [0.3, 0.8],
    moistureRange: [0.5, 1.0],
    elevationRange: [-0.1, 0.2],
    surfaceBlock: 'mud',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.0,
    elevationVariance: 0.1,
    treeSpawnRate: 0.3,
    oreSpawnRate: 0.08,
    creatureSpawnRate: 0.2,
    color: '#5D4E37',
  },
  mushroom_fields: {
    name: 'Mushroom Fields',
    temperatureRange: [0.0, 0.5],
    moistureRange: [0.3, 0.8],
    surfaceBlock: 'mycelium',
    subsurfaceBlock: 'dirt',
    undergroundBlock: 'stone',
    baseElevation: 0.2,
    elevationVariance: 0.3,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.05,
    creatureSpawnRate: 0.1,
    color: '#9C27B0',
  },
  void: {
    name: 'Void',
    temperatureRange: [-1.0, 1.0],
    moistureRange: [-1.0, 1.0],
    surfaceBlock: 'air',
    subsurfaceBlock: 'air',
    undergroundBlock: 'air',
    baseElevation: 1.0,
    elevationVariance: 0.0,
    treeSpawnRate: 0.0,
    oreSpawnRate: 0.0,
    creatureSpawnRate: 0.0,
    color: '#000000',
  },
};
""""""


File: condition-schema.ts
""""""
/**
 * World Condition Schema
 * Represents a dynamic aspect of the world (e.g., "Aetheric Tides", "Political Climate")
 */

import { z } from 'zod';

export const WorldConditionSchema = z.object({
  type: z.literal('World Condition'),
  key: z.string(),
  values: z.array(z.string()),
  currentValue: z.string(),
  description: z.string(),
  lastUpdatedTurn: z.number().int().min(0),
  ordered: z.boolean().optional(),
});

export type WorldCondition = z.infer<typeof WorldConditionSchema>;
""""""


File: entity-schema.ts
""""""
import { z } from 'zod';

/**
 * Entity Schema
 * Represents a movable entity on the map (PC, NPC, Creature, Memory)
 */

export const EntityTypeEnum = z.enum([
  'player',
  'npc',
  'creature',
  'object', // Movable objects like carts, boulders
  'memory', // Lore points, flashbacks, significant locations
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

export const EntitySchema = z.object({
  id: z.string(),
  roomId: z.string(),
  type: EntityTypeEnum,
  name: z.string(),
  // Position
  x: z.number(), // World X
  y: z.number(), // World Y
  z: z.number().default(0), // Layer
  // Visuals
  avatarUrl: z.string().optional(),
  color: z.string().optional(),
  scale: z.number().default(1),
  // Stats/State
  visibilityRadius: z.number().default(10), // How far this entity can see (Fog of War)
  isPublic: z.boolean().default(true), // If false, only visible to DM and owner
  ownerId: z.string().optional(), // For PCs

  // Memory/Lore specifics
  triggerCondition: z.string().optional(), // e.g. "onEnter", "onInteract"
  loreText: z.string().optional(),
  isSecret: z.boolean().default(false), // Hidden until discovered

  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Entity = z.infer<typeof EntitySchema>;
""""""


File: grid-chunk-schema.ts
""""""
import { z } from 'zod';
import { GridTileSchema } from './grid-tile-schema';
import { GridFeatureSchema } from './grid-feature-schema';

/**
 * Grid Chunk Schema
 * Represents an 8x8 tile chunk in the infinite grid system
 */

export const CHUNK_SIZE = 32; // 32x32 tiles per chunk

export const GridChunkSchema = z.object({
  chunkX: z.number().int(),
  chunkY: z.number().int(),
  z: z.union([z.literal(-3), z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), // Z-layer index (-3 to +3)
  tiles: z.array(GridTileSchema),
  features: z.array(GridFeatureSchema).default([]),
  biomes: z.array(z.string()).default([]), // Unique biomes present in this chunk
  seed: z.string(), // Seed used to generate this chunk (for reproducibility)
  generated: z.boolean().default(false),
  generatedAt: z.number().optional(),
  // Metadata for chunk state
  hasStructure: z.boolean().default(false),
  hasCave: z.boolean().default(false),
  isStartingArea: z.boolean().default(false),
});

export type GridChunk = z.infer<typeof GridChunkSchema>;

/**
 * Helper to calculate world coordinates from chunk coordinates
 */
export function chunkToWorldCoords(chunkX: number, chunkY: number): { x: number; y: number } {
  return {
    x: chunkX * CHUNK_SIZE,
    y: chunkY * CHUNK_SIZE,
  };
}

/**
 * Helper to calculate chunk coordinates from world coordinates
 */
export function worldToChunkCoords(x: number, y: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE),
  };
}
""""""


File: grid-feature-schema.ts
""""""
import { z } from 'zod';

/**
 * Grid Feature Schema
 * Represents entities/features that exist on tiles (trees, creatures, resources, etc.)
 */

export const FeatureTypeEnum = z.enum([
  'tree',
  'creature',
  'resource',
  'npc',
  'item',
  'hazard',
  'decoration',
  'structure_marker',
]);

export type FeatureType = z.infer<typeof FeatureTypeEnum>;

export const GridFeatureSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number().int(),
    y: z.number().int(),
    z: z.number().int().min(-6).max(5),
  }),
  type: FeatureTypeEnum,
  subtype: z.string(), // e.g., 'oak_tree', 'goblin', 'iron_ore', 'ancient_statue'
  name: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()), // JSON for any feature-specific data
  isVisible: z.boolean().default(true),
  isWalkable: z.boolean().default(true),
  blocksLineOfSight: z.boolean().default(false),
  interactable: z.boolean().default(false),
});

export type GridFeature = z.infer<typeof GridFeatureSchema>;
""""""


File: grid-tile-schema.ts
""""""
import { z } from 'zod';

/**
 * Grid Tile Schema
 * Represents a single tile in the infinite grid system
 */

export const BlockTypeEnum = z.enum([
  'air',
  'water',
  'ice',
  'grass',
  'dirt',
  'stone',
  'sand',
  'gravel',
  'clay',
  'snow',
  'packed_ice',
  'sandstone',
  'terracotta',
  'red_sand',
  'podzol',
  'mycelium',
  'basalt',
  'blackstone',
  'mud',
  'deepslate',
  'bedrock',
  'coal_ore',
  'iron_ore',
  'gold_ore',
  'diamond_ore',
  'emerald_ore',
  'lapis_ore',
  'redstone_ore',
  'wall',
  'floor',
  'wood',
  'leaves',
]);

export type BlockType = z.infer<typeof BlockTypeEnum>;

export const GridTileSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  z: z.union([z.literal(-3), z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), // Z-layer index (-3 to +3)
  blockType: BlockTypeEnum,
  biome: z.string(),
  elevation: z.number().optional(), // Surface elevation at this position
  lightLevel: z.number().int().min(0).max(15).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(), // Additional tile data
});

export type GridTile = z.infer<typeof GridTileSchema>;
""""""


File: history-schema.ts
""""""
import { z } from 'zod';
import { StructureSchema } from './structure-schema';

export const HistoricalPeriodSchema = z.object({
  periodNumber: z.number().int(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  narrative: z.string(),
  structures: z.array(StructureSchema),
  entropyEvents: z.array(z.unknown()),
  conditions: z.array(z.unknown()),
});

export const WorldHistorySchema = z.object({
  totalYears: z.number().int(),
  periods: z.array(HistoricalPeriodSchema),
  overallSummary: z.string(),
});

export type HistoricalPeriod = z.infer<typeof HistoricalPeriodSchema>;
export type WorldHistory = z.infer<typeof WorldHistorySchema>;
""""""


File: index.ts
""""""
export * from './biome-schema';
export * from './condition-schema';
export * from './grid-chunk-schema';
export * from './grid-feature-schema';
export * from './grid-tile-schema';
export * from './history-schema';
export * from './road-schema';
export * from './structure-schema';
export * from './entity-schema';
""""""


File: road-schema.ts
""""""
import { z } from 'zod';

export const WaypointSchema = z.object({
  x: z.number(),
  y: z.number(),
  type: z.enum(['junction', 'waystation', 'bridge', 'path']),
});

export const RoadSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  waypoints: z.array(WaypointSchema),
  terrain: z.enum(['flat', 'hilly', 'mountain', 'forest']),
  quality: z.enum(['trail', 'path', 'road', 'highway']),
});

export type Waypoint = z.infer<typeof WaypointSchema>;
export type Road = z.infer<typeof RoadSchema>;
""""""


File: structure-schema.ts
""""""
import { z } from 'zod';

export const StructureSizeEnum = z.enum(['tiny', 'small', 'medium', 'large', 'huge']);

export const StructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  size: StructureSizeEnum,
  width: z.number().min(16).max(8096).optional(), // Tile width (16-8096)
  height: z.number().min(16).max(8096).optional(), // Tile height (16-8096)
  description: z.string(),
  era: z.number(),
  type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural']),
  significance: z.number().min(1).max(10),
  relativePosition: z.string().optional(), // For history generation
  userId: z.string().optional(), // For user-created structures
});

export type StructureSize = z.infer<typeof StructureSizeEnum>;
export type Structure = z.infer<typeof StructureSchema>;
""""""


File: terrain-types.ts
""""""
import { type BiomeType } from './biome-schema';
import { type BlockType } from './grid-tile-schema';

export interface TerrainTile {
  x: number;
  y: number;
  z: number;
  biome: BiomeType | string; // Allow string for flexibility or legacy
  blockType: BlockType | string;
  lightLevel?: number;
}

/**
 * Compressed DTO for sending chunks over the wire.
 * We use a more explicit format than raw strings, but keep it JSON-serializable.
 */
export interface ChunkDTO {
  chunkX: number;
  chunkY: number;
  worldOffsetX: number;
  worldOffsetY: number;
  size: number;

  /**
   * 3D Grid of tiles.
   * [floor_index][y][x]
   * Floor index is mapped 0..6 (representing -3 to +3)
   */
  grid: {
    b: string; // biome (short key could be used later)
    t: string; // blockType
  }[][][];
}
""""""


