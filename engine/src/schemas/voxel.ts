import { z } from 'zod';

// Enums
export const BlockTypeSchema = z.nativeEnum({
  AIR: 'air',
  GRASS: 'grass',
  DIRT: 'dirt',
  STONE: 'stone',
  WATER: 'water',
  SAND: 'sand',
  SNOW: 'snow',
  WALL_STONE: 'wall_stone',
  WALL_WOOD: 'wall_wood',
  FLOOR_WOOD: 'floor_wood',
  FLOOR_STONE: 'floor_stone',
  DOOR: 'door',
  STAIRS_UP: 'stairs_up',
  STAIRS_DOWN: 'stairs_down',
  LAVA: 'lava',
  BEDROCK: 'bedrock',
  TREE_LEAVES: 'tree_leaves',
  CACTUS: 'cactus',
} as const); // Helper since TS Enums in Zod can be tricky, using const object or nativeEnum if real TS enum

// Re-defining TS enums as Zod Enums for better schema validation
export const BiomeTypeSchema = z.enum(['ocean', 'beach', 'plains', 'forest', 'desert', 'mountain', 'snowy_peaks']);

export const ZLevelSchema = z.union([
  z.literal(-3),
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: ZLevelSchema,
});

export const StructureInfoSchema = z.object({
  type: z.enum(['city', 'castle', 'tower', 'dungeon', 'none']),
  worldX: z.number(),
  worldY: z.number(),
  size: z.number(),
  seed: z.string(),
});

export const TileSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: ZLevelSchema,
  block: z.string(), // BlockTypeSchema ideally
  biome: BiomeTypeSchema,
  isWalkable: z.boolean(),
  isTransparent: z.boolean(),
  variant: z.number().optional(),
});

export const ChunkDTOSchema = z.object({
  x: z.number(),
  y: z.number(),
  tiles: z.array(z.array(z.array(TileSchema))),
});

export const WorldConfigSchema = z.object({
  seed: z.string(),
  chunkSize: z.number(),
  globalScale: z.number(),
  seaLevel: z.number(),
  elevationScale: z.number(),
  roughness: z.number(),
  detail: z.number(),
  moistureScale: z.number(),
  temperatureOffset: z.number(),
  structureChance: z.number(),
  structureSpacing: z.number(),
  structureSizeAvg: z.number(),
  roadDensity: z.number(),
  fogRadius: z.number(),
});
