/* eslint-disable max-lines, complexity */
/**
 * World Generation Service
 *
 * Handles procedural generation of game worlds/maps with:
 * - 21 vertical levels (-10 underground to +10 sky)
 * - 5-layer climate system (temperature, moisture, continentalness, erosion, weirdness)
 * - Multi-dimensional biome selection
 * - 3D cave generation
 * - Domain warping for organic terrain
 */

import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../../utils/logger';
import { WorldMap } from '../generation/types';
import { SimplexNoise } from './noise';
import { selectBiome, BIOMES, ClimateData } from './biomes';
import type { CollapseData } from './world-collapse';
import { applyCollapseInfluence } from './world-collapse';

// Lazy-load Firestore to avoid initialization issues
const getDb = () => getFirestore();

export interface WorldGenerationParams {
  seed: string;
  width: number;
  height: number;
  depth: number; // 21 levels: -10 to +10
  waterLevel?: number;
  mountainousness?: number;
  jaggedness?: number;
  temperature?: number; // Global temperature bias
  moisture?: number; // Global moisture bias
  continentalness?: number; // Land mass distribution
  erosion?: number; // Terrain smoothness
  weirdness?: number; // Terrain variation
  caveFrequency?: number; // Cave density
  oreDistribution?: Record<string, number>; // Ore spawn rates
  collapseData?: CollapseData; // Structure/road influence data
}

/**
 * Generate a basic world map
 */
export async function generateWorld(userId: string, name: string, params: WorldGenerationParams): Promise<string> {
  try {
    const { seed, width, height, depth } = params;

    logger.info(`[WorldGenService] Generating world: ${name} (${width}x${height}x${depth || 21})`);

    const worldData: Partial<WorldMap> = {
      name,
      width,
      height,
      depth: depth || 21,
      seed,
      parameters: params,
      createdAt: new Date(),
      createdBy: userId,
      // Note: chunks are generated on-demand via generateChunk(), not stored
    };

    const docRef = await getDb().collection('worldMaps').add(worldData);

    logger.info(`[WorldGenService] World created: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('[WorldGenService] Error generating world:', error);
    throw new Error('Failed to generate world');
  }
}

/**
 * Get a world map
 */
export async function getWorldMap(worldId: string): Promise<WorldMap | null> {
  try {
    const doc = await getDb().collection('worldMaps').doc(worldId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as WorldMap;
  } catch (error) {
    logger.error('[WorldGenService] Error getting world:', error);
    throw new Error('Failed to get world');
  }
}

/**
 * Get all worlds for a user
 */
export async function getUserWorlds(userId: string): Promise<WorldMap[]> {
  try {
    const snapshot = await getDb()
      .collection('worldMaps')
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WorldMap[];
  } catch (error) {
    logger.error('[WorldGenService] Error getting worlds:', error);
    throw new Error('Failed to get worlds');
  }
}

/**
 * Delete a world map
 */
export async function deleteWorldMap(worldId: string): Promise<void> {
  try {
    await getDb().collection('worldMaps').doc(worldId).delete();

    logger.info(`[WorldGenService] World deleted: ${worldId}`);
  } catch (error) {
    logger.error('[WorldGenService] Error deleting world:', error);
    throw new Error('Failed to delete world');
  }
}

export type BlockType =
  | 'air'
  | 'water'
  | 'ice'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'sand'
  | 'gravel'
  | 'clay'
  | 'snow'
  | 'packed_ice'
  | 'sandstone'
  | 'terracotta'
  | 'red_sand'
  | 'podzol'
  | 'mycelium'
  | 'basalt'
  | 'blackstone'
  | 'mud'
  | 'deepslate'
  | 'bedrock'
  | 'coal_ore'
  | 'iron_ore'
  | 'gold_ore'
  | 'diamond_ore'
  | 'emerald_ore'
  | 'lapis_ore'
  | 'redstone_ore';

interface ChunkTile {
  x: number;
  y: number;
  z: number; // -10 to +10 (underground to sky)
  blockType: BlockType;
  biome: string;
  elevation: number; // Surface elevation at this x,y
  climate: ClimateData;
  isCave: boolean;
  isOre: boolean;
  lightLevel: number; // 0-15
}

interface GeneratedChunk {
  chunkX: number;
  chunkY: number;
  chunkZ: number; // -10 to +10
  tiles: ChunkTile[];
  biomes: Set<string>; // Unique biomes in chunk
}

/**
 * Generate climate data for a position
 */
function generateClimate(
  x: number,
  y: number,
  noiseGenerators: {
    temperature: SimplexNoise;
    moisture: SimplexNoise;
    continentalness: SimplexNoise;
    erosion: SimplexNoise;
    weirdness: SimplexNoise;
  },
  params: WorldGenerationParams
): ClimateData {
  const scale = 0.003; // Global scale for climate features
  const tempBias = params.temperature || 0;
  const moistBias = params.moisture || 0;
  const contBias = params.continentalness || 0;
  const erosionBias = params.erosion || 0;
  const weirdBias = params.weirdness || 0;

  return {
    temperature: noiseGenerators.temperature.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + tempBias,
    moisture: noiseGenerators.moisture.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + moistBias,
    continentalness:
      noiseGenerators.continentalness.octaveNoise(x * scale * 0.5, y * scale * 0.5, 3, 0.6, 1.8) + contBias,
    erosion: noiseGenerators.erosion.octaveNoise(x * scale * 2, y * scale * 2, 5, 0.4, 2.2) + erosionBias,
    weirdness: noiseGenerators.weirdness.domainWarpedNoise(x * scale * 1.5, y * scale * 1.5, 0.5, 4) + weirdBias,
  };
}

/**
 * Generate 3D cave system using cheese and spaghetti algorithms
 */
function generateCaves(
  x: number,
  y: number,
  z: number,
  noiseGenerators: {
    cheese: SimplexNoise;
    spaghetti1: SimplexNoise;
    spaghetti2: SimplexNoise;
  },
  caveFrequency: number
): boolean {
  // Only generate caves underground (z <= 0)
  if (z > 0) return false;

  const caveScale = 0.02;
  const depth = Math.abs(z);

  // Cheese caves - large caverns
  const cheese = noiseGenerators.cheese.octaveNoise3(
    x * caveScale * 0.7,
    y * caveScale * 0.7,
    z * caveScale * 0.7,
    3,
    0.5,
    2.0
  );

  // Spaghetti caves - tunnels
  const spag1 = noiseGenerators.spaghetti1.octaveNoise3(x * caveScale, y * caveScale, z * caveScale, 4, 0.5, 2.0);

  const spag2 = noiseGenerators.spaghetti2.octaveNoise3(
    x * caveScale + 100,
    y * caveScale + 100,
    z * caveScale + 100,
    4,
    0.5,
    2.0
  );

  // Tighter caves near surface
  const cheeseThreshold = 0.5 + depth * 0.03;

  const isCheeseCave = Math.abs(cheese) < cheeseThreshold * caveFrequency;
  const isSpaghettiCave = Math.abs(spag1) < 0.3 * caveFrequency && Math.abs(spag2) < 0.3 * caveFrequency;

  return isCheeseCave || isSpaghettiCave;
}

/**
 * Determine ore type based on depth and noise
 */
function determineOre(
  z: number,
  x: number,
  y: number,
  oreNoise: SimplexNoise,
  oreDistribution: Record<string, number>
): BlockType | null {
  if (z > 0) return null; // No ores above ground

  const depth = Math.abs(z);
  const oreValue = oreNoise.octaveNoise3(x * 0.05, y * 0.05, z * 0.05, 3, 0.6, 2.0);

  // Ore distribution by depth (deeper = rarer ores)
  if (depth >= 8 && oreValue > 0.85 && (oreDistribution.diamond || 0) > Math.random()) {
    return 'diamond_ore';
  }
  if (depth >= 6 && oreValue > 0.8 && (oreDistribution.gold || 0) > Math.random()) {
    return 'gold_ore';
  }
  if (depth >= 7 && oreValue > 0.82 && (oreDistribution.emerald || 0) > Math.random()) {
    return 'emerald_ore';
  }
  if (depth >= 3 && oreValue > 0.75 && (oreDistribution.iron || 0) > Math.random()) {
    return 'iron_ore';
  }
  if (depth >= 1 && oreValue > 0.7 && (oreDistribution.coal || 0) > Math.random()) {
    return 'coal_ore';
  }
  if (depth >= 2 && oreValue > 0.78 && (oreDistribution.lapis || 0) > Math.random()) {
    return 'lapis_ore';
  }
  if (depth >= 4 && oreValue > 0.72 && (oreDistribution.redstone || 0) > Math.random()) {
    return 'redstone_ore';
  }

  return null;
}

/**
 * Generate a 3D chunk with full climate, biome, and cave systems
 */
export function generateChunk(
  seed: string,
  chunkX: number,
  chunkY: number,
  chunkZ: number, // -10 to +10
  params: WorldGenerationParams
): GeneratedChunk {
  // Optimize for surface-only chunks (2D map rendering)
  const isSurfaceChunk = chunkZ === 0;

  // Initialize all noise generators
  const elevationNoise = new SimplexNoise(seed);
  const temperatureNoise = new SimplexNoise(`${seed}-temp`);
  const moistureNoise = new SimplexNoise(`${seed}-moist`);
  const continentalnessNoise = new SimplexNoise(`${seed}-cont`);
  const erosionNoise = new SimplexNoise(`${seed}-erosion`);
  const weirdnessNoise = new SimplexNoise(`${seed}-weird`);

  // Only initialize cave/ore noise if needed (not for surface chunks)
  const cheeseNoise = isSurfaceChunk ? null : new SimplexNoise(`${seed}-cheese`);
  const spaghetti1Noise = isSurfaceChunk ? null : new SimplexNoise(`${seed}-spag1`);
  const spaghetti2Noise = isSurfaceChunk ? null : new SimplexNoise(`${seed}-spag2`);
  const oreNoise = isSurfaceChunk ? null : new SimplexNoise(`${seed}-ore`);

  const chunkSize = 8;
  const tiles: ChunkTile[] = [];
  const biomesInChunk = new Set<string>();

  const noiseGens = {
    temperature: temperatureNoise,
    moisture: moistureNoise,
    continentalness: continentalnessNoise,
    erosion: erosionNoise,
    weirdness: weirdnessNoise,
  };

  const caveGens =
    cheeseNoise && spaghetti1Noise && spaghetti2Noise
      ? {
          cheese: cheeseNoise,
          spaghetti1: spaghetti1Noise,
          spaghetti2: spaghetti2Noise,
        }
      : null;

  const caveFreq = params.caveFrequency || 0.5;
  const oreDistrib = params.oreDistribution || { coal: 0.3, iron: 0.2, gold: 0.1, diamond: 0.05 };
  const mountainousness = params.mountainousness || 1.0;
  const jaggedness = params.jaggedness || 1.0;
  const waterLevel = params.waterLevel || -0.1;

  // Optimize Z-loop for surface chunks (only generate near-surface layers)
  const startZ = isSurfaceChunk ? 3 : 0; // Middle layers only for 2D
  const endZ = isSurfaceChunk ? 6 : chunkSize; // ~3 layers instead of 8

  for (let localZ = startZ; localZ < endZ; localZ += 1) {
    const worldZ = chunkZ * chunkSize + localZ - 80; // Center around 0 (-10*8 to +10*8)

    for (let localY = 0; localY < chunkSize; localY += 1) {
      for (let localX = 0; localX < chunkSize; localX += 1) {
        const worldX = chunkX * chunkSize + localX;
        const worldY = chunkY * chunkSize + localY;

        // Generate climate for this position
        const climate = generateClimate(worldX, worldY, noiseGens, params);

        // Generate surface elevation with domain warping for organic look
        const baseElevation =
          elevationNoise.domainWarpedNoise(worldX * 0.005, worldY * 0.005, 30 * jaggedness, 4) * mountainousness;

        const ridges = elevationNoise.ridgeNoise(worldX * 0.01, worldY * 0.01, 3) * 0.3 * mountainousness;

        let elevationNormalized = baseElevation + ridges;

        // Apply collapse influence if available
        if (params.collapseData) {
          elevationNormalized = applyCollapseInfluence(worldX, worldY, elevationNormalized, params.collapseData);
        }

        const elevation = elevationNormalized * 100; // Scale to -100 to +100 range

        // Select biome based on climate
        const biome = worldZ > 0 ? BIOMES.void : selectBiome(climate, elevation / 100);
        biomesInChunk.add(biome.type);

        // Apply biome-specific terrain modifiers
        const biomeElevation = elevation + biome.baseElevation * 100 + (biome.elevationVariance || 0) * 50;

        // Determine block type based on z-level
        let blockType: BlockType = 'air';
        let isCave = false;
        let isOre = false;

        if (worldZ > biomeElevation) {
          // Above surface - air or water
          if (worldZ <= waterLevel * 100 && climate.continentalness < 0) {
            blockType = climate.temperature < -0.3 ? 'ice' : 'water';
          } else {
            blockType = 'air';
          }
        } else if (worldZ > biomeElevation - 5) {
          // Surface layer
          blockType = biome.surfaceBlock as BlockType;
        } else if (worldZ > biomeElevation - 10) {
          // Subsurface layer
          blockType = biome.subsurfaceBlock as BlockType;
        } else {
          // Underground - skip expensive operations for surface chunks
          if (isSurfaceChunk) {
            // For 2D rendering, just use underground block (no caves/ores)
            blockType = biome.undergroundBlock as BlockType;
          } else {
            // Full 3D generation with caves and ores
            // Check for caves
            if (caveGens) {
              isCave = generateCaves(worldX, worldY, worldZ, caveGens, caveFreq);
            }

            if (isCave) {
              blockType = 'air';
            } else if (worldZ < -315) {
              // Bedrock at bottom
              blockType = 'bedrock';
            } else if (worldZ < -200) {
              blockType = 'deepslate';
            } else {
              blockType = biome.undergroundBlock as BlockType;

              // Check for ore veins
              if (oreNoise) {
                const ore = determineOre(worldZ, worldX, worldY, oreNoise, oreDistrib);
                if (ore) {
                  blockType = ore;
                  isOre = true;
                }
              }
            }
          }
        }

        // Calculate light level (simplified)
        let lightLevel = 0;
        if (blockType === 'air' && worldZ > biomeElevation) {
          lightLevel = 15; // Full sunlight above surface
        } else if (blockType === 'water') {
          lightLevel = Math.max(0, 15 - Math.floor((waterLevel * 100 - worldZ) / 10));
        }

        tiles.push({
          x: worldX,
          y: worldY,
          z: worldZ,
          blockType,
          biome: biome.type,
          elevation: biomeElevation,
          climate,
          isCave,
          isOre,
          lightLevel,
        });
      }
    }
  }

  return {
    chunkX,
    chunkY,
    chunkZ,
    tiles,
    biomes: biomesInChunk,
  };
}
