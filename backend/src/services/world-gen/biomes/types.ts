/**
 * Biome System Types
 * Based on Minecraft's 5-layer climate system
 */

export type BiomeType =
  | 'ocean'
  | 'deep_ocean'
  | 'frozen_ocean'
  | 'beach'
  | 'river'
  | 'lake'
  | 'frozen_river'
  | 'swamp'
  | 'mangrove_swamp'
  | 'jungle'
  | 'bamboo_jungle'
  | 'rainforest'
  | 'tropical_forest'
  | 'forest'
  | 'birch_forest'
  | 'dark_forest'
  | 'taiga'
  | 'snowy_taiga'
  | 'plains'
  | 'sunflower_plains'
  | 'meadow'
  | 'savanna'
  | 'badlands'
  | 'desert'
  | 'snowy_plains'
  | 'ice_spikes'
  | 'tundra'
  | 'mountains'
  | 'snowy_mountains'
  | 'volcanic'
  | 'mushroom_island'
  | 'void'; // For z > 0 (above ground empty space)

export interface BiomeDefinition {
  readonly type: BiomeType;
  readonly name: string;
  readonly description: string;

  // Climate thresholds (5-layer system)
  readonly temperature: { min: number; max: number }; // -1 to 1
  readonly moisture: { min: number; max: number }; // -1 to 1
  readonly continentalness: { min: number; max: number }; // -1 to 1 (ocean to inland)
  readonly erosion: { min: number; max: number }; // -1 to 1 (flat to eroded)
  readonly weirdness: { min: number; max: number }; // -1 to 1 (normal to unusual)

  // Terrain generation
  readonly baseElevation: number; // -100 to 100 (meters relative to sea level)
  readonly roughness: number; // 0 to 1 (0 = flat, 1 = very rough)

  // Block palette (what blocks appear in this biome)
  readonly surfaceBlock: string; // grass, sand, snow, etc
  readonly soilBlock: string; // dirt, sand, gravel, etc
  readonly stoneBlock: string; // stone, sandstone, terracotta, etc

  // Feature spawning (trees, creatures, resources)
  readonly treeChance: number; // 0 to 1
  readonly creatureSpawnRate: number; // 0 to 1
  readonly resourceDensity: number; // 0 to 1

  // Visual appearance
  readonly skyColor: string; // Hex color
  readonly fogColor: string; // Hex color
  readonly waterColor?: string; // Hex color (for water biomes)
}

/**
 * Climate data for biome selection (5-layer system)
 */
export interface ClimateData {
  temperature: number; // -1 to 1
  moisture: number; // -1 to 1
  continentalness: number; // -1 to 1 (ocean to inland)
  erosion: number; // -1 to 1 (flat to eroded)
  weirdness: number; // -1 to 1
}
