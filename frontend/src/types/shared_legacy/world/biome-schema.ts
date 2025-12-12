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
