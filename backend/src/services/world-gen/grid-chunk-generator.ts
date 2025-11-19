/**
 * Grid Chunk Generator
 * Generates chunks on-demand for the infinite grid system
 */

import type { GridChunk, GridTile, GridFeature } from '@daicer/shared';
import { CHUNK_SIZE } from '@daicer/shared';
import { SimplexNoise, Alea } from './noise';
import { selectBiome, type BiomeDefinition } from './biomes';
import { logger } from '@/utils/logger';

export interface ChunkGenerationParams {
  seed: string;
  waterLevel?: number;
  mountainousness?: number;
  caveFrequency?: number;
  oreDistribution?: Record<string, number>;
  temperatureBias?: number;
  moistureBias?: number;
  continentalnessBias?: number;
}

/**
 * Generate a single chunk at the specified coordinates
 * This is the core function called on-demand for infinite world generation
 */
export function generateGridChunk(chunkX: number, chunkY: number, z: number, params: ChunkGenerationParams): GridChunk {
  logger.info(`[GridChunkGenerator] 🎬 ENTERED generateGridChunk`, { chunkX, chunkY, z });

  try {
    const { seed } = params;
    const chunkSeed = `${seed}-${chunkX}-${chunkY}-${z}`;

    logger.info(`[GridChunkGenerator] 🎲 Starting generation`, { chunkX, chunkY, z, seed: chunkSeed.substring(0, 30) });

    // Initialize noise generators
    const elevationNoise = new SimplexNoise(`${seed}-elev`);
    const temperatureNoise = new SimplexNoise(`${seed}-temp`);
    const moistureNoise = new SimplexNoise(`${seed}-moist`);
    const continentalnessNoise = new SimplexNoise(`${seed}-cont`);
    const erosionNoise = new SimplexNoise(`${seed}-erosion`);
    const weirdnessNoise = new SimplexNoise(`${seed}-weird`);

    // Cave noise (only for underground layers)
    const caveNoise = z < 0 ? new SimplexNoise(`${seed}-cave`) : null;

    const tiles: GridTile[] = [];
    const features: GridFeature[] = [];
    const biomesInChunk = new Set<string>();

    const waterLevel = params.waterLevel ?? -0.1;
    const mountainousness = params.mountainousness ?? 1.0;
    const caveFrequency = params.caveFrequency ?? 0.5;

    logger.debug(
      `[GridChunkGenerator] Generating ${CHUNK_SIZE * CHUNK_SIZE} tiles for chunk (${chunkX}, ${chunkY}, ${z})`
    );

    // Generate tiles
    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const worldX = chunkX * CHUNK_SIZE + localX;
        const worldY = chunkY * CHUNK_SIZE + localY;

        const tile = generateTile(
          worldX,
          worldY,
          z,
          {
            elevationNoise,
            temperatureNoise,
            moistureNoise,
            continentalnessNoise,
            erosionNoise,
            weirdnessNoise,
            caveNoise,
          },
          {
            waterLevel,
            mountainousness,
            caveFrequency,
            temperatureBias: params.temperatureBias ?? 0,
            moistureBias: params.moistureBias ?? 0,
            continentalnessBias: params.continentalnessBias ?? 0,
          }
        );

        tiles.push(tile);
        biomesInChunk.add(tile.biome);
      }
    }

    logger.info(`[GridChunkGenerator] ✅ Generated ${tiles.length} tiles, ${biomesInChunk.size} unique biomes`, {
      chunkX,
      chunkY,
      z,
      tileCount: tiles.length,
      biomes: Array.from(biomesInChunk),
    });

    // Generate features for surface chunks (z === 0)
    if (z === 0) {
      const chunkFeatures = generateFeatures(chunkX, chunkY, tiles, chunkSeed);
      features.push(...chunkFeatures);
      logger.debug(`[GridChunkGenerator] Added ${chunkFeatures.length} features to chunk`);
    }

    const chunk = {
      chunkX,
      chunkY,
      z,
      tiles,
      features,
      biomes: Array.from(biomesInChunk),
      seed: chunkSeed,
      generated: true,
      generatedAt: Date.now(),
      hasStructure: false,
      hasCave: z < 0 && tiles.some((t) => t.blockType === 'air'),
      isStartingArea: false,
    };

    logger.info(`[GridChunkGenerator] 🎉 Chunk complete!`, {
      chunkX,
      chunkY,
      z,
      tiles: chunk.tiles.length,
      features: chunk.features.length,
      firstTile: chunk.tiles[0] ? `${chunk.tiles[0].blockType} at (${chunk.tiles[0].x}, ${chunk.tiles[0].y})` : 'none',
    });

    logger.info(`[GridChunkGenerator] 🏁 RETURNING chunk`, { chunkX, chunkY, z });
    return chunk;
  } catch (error) {
    logger.error(`[GridChunkGenerator] ❌❌❌ GENERATION FAILED!`, {
      chunkX,
      chunkY,
      z,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Generate a single tile
 */
function generateTile(
  x: number,
  y: number,
  z: number,
  noiseGenerators: {
    elevationNoise: SimplexNoise;
    temperatureNoise: SimplexNoise;
    moistureNoise: SimplexNoise;
    continentalnessNoise: SimplexNoise;
    erosionNoise: SimplexNoise;
    weirdnessNoise: SimplexNoise;
    caveNoise: SimplexNoise | null;
  },
  params: {
    waterLevel: number;
    mountainousness: number;
    caveFrequency: number;
    temperatureBias: number;
    moistureBias: number;
    continentalnessBias: number;
  }
): GridTile {
  const {
    elevationNoise,
    temperatureNoise,
    moistureNoise,
    continentalnessNoise,
    erosionNoise,
    weirdnessNoise,
    caveNoise,
  } = noiseGenerators;

  // Generate climate data
  const scale = 0.003;
  const climate = {
    temperature: temperatureNoise.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + params.temperatureBias,
    moisture: moistureNoise.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + params.moistureBias,
    continentalness:
      continentalnessNoise.octaveNoise(x * scale * 0.5, y * scale * 0.5, 3, 0.6, 1.8) + params.continentalnessBias,
    erosion: erosionNoise.octaveNoise(x * scale * 2, y * scale * 2, 5, 0.4, 2.2),
    weirdness: weirdnessNoise.domainWarpedNoise(x * scale * 1.5, y * scale * 1.5, 0.5, 4),
  };

  // Generate surface elevation
  const baseElevation = elevationNoise.domainWarpedNoise(x * 0.005, y * 0.005, 30, 4) * params.mountainousness;
  const ridges = elevationNoise.ridgeNoise(x * 0.01, y * 0.01, 3) * 0.3 * params.mountainousness;
  const elevationNormalized = baseElevation + ridges;
  const elevation = elevationNormalized * 100; // Scale to -100 to +100 range

  // Select biome
  const biome =
    z > 0
      ? selectBiome({ temperature: 0, moisture: 0, continentalness: 0, erosion: 0, weirdness: 0 }, 1.0)
      : selectBiome(climate, elevationNormalized);

  // Determine block type based on z-level
  let blockType: string = 'air';
  let lightLevel = 0;

  if (z > elevation) {
    // Above surface - air or water
    if (z <= params.waterLevel * 100 && climate.continentalness < 0) {
      blockType = climate.temperature < -0.3 ? 'ice' : 'water';
      lightLevel = Math.max(0, 15 - Math.floor((params.waterLevel * 100 - z) / 10));
    } else {
      blockType = 'air';
      lightLevel = z > elevation ? 15 : 0;
    }
  } else if (z > elevation - 5) {
    // Surface layer
    blockType = biome.surfaceBlock;
    lightLevel = 12;
  } else if (z > elevation - 10) {
    // Subsurface layer
    blockType = biome.subsurfaceBlock;
    lightLevel = 5;
  } else {
    // Underground
    blockType = biome.undergroundBlock;

    // Check for caves (underground only)
    if (z < 0 && caveNoise) {
      const isCave = generateCave(x, y, z, caveNoise, params.caveFrequency);
      if (isCave) {
        blockType = 'air';
        lightLevel = 0;
      }
    }

    // Bedrock at bottom
    if (z < -50) {
      blockType = 'bedrock';
    } else if (z < -30) {
      blockType = 'deepslate';
    }
  }

  return {
    x,
    y,
    z,
    blockType: blockType as any,
    biome: biome.type,
    elevation,
    lightLevel,
  };
}

/**
 * Generate cave using 3D noise
 */
function generateCave(x: number, y: number, z: number, caveNoise: SimplexNoise, frequency: number): boolean {
  const caveScale = 0.02;
  const depth = Math.abs(z);

  // 3D noise for cave carving
  const caveValue = caveNoise.octaveNoise3(x * caveScale, y * caveScale, z * caveScale, 3, 0.5, 2.0);

  // Threshold depends on depth (more caves deeper underground)
  const threshold = 0.5 + depth * 0.01;

  return Math.abs(caveValue) < threshold * frequency;
}

/**
 * Generate features for a chunk (trees, resources, etc.)
 */
function generateFeatures(chunkX: number, chunkY: number, tiles: GridTile[], seed: string): GridFeature[] {
  const features: GridFeature[] = [];
  const rng = Alea(seed);

  // Find surface tiles (biome determines spawn rates)
  for (const tile of tiles) {
    // Only spawn on surface layer (z === 0)
    if (tile.z !== 0) continue;
    if (tile.blockType === 'water' || tile.blockType === 'air') continue;

    // Get biome name for feature spawning
    const biomeName = tile.biome;

    // Tree spawning (simple example)
    if (biomeName === 'forest' || biomeName === 'birch_forest' || biomeName === 'dark_forest') {
      if (rng() < 0.15) {
        // 15% chance per tile
        features.push({
          id: `tree_${tile.x}_${tile.y}`,
          position: { x: tile.x, y: tile.y, z: 0 },
          type: 'tree',
          subtype: biomeName === 'birch_forest' ? 'birch_tree' : 'oak_tree',
          metadata: { height: Math.floor(rng() * 3) + 5 }, // 5-7 blocks tall
          isVisible: true,
          isWalkable: false,
          blocksLineOfSight: true,
          interactable: true,
        });
      }
    }

    // Resource spawning
    if (tile.blockType === 'stone' && rng() < 0.05) {
      features.push({
        id: `resource_${tile.x}_${tile.y}`,
        position: { x: tile.x, y: tile.y, z: 0 },
        type: 'resource',
        subtype: 'stone_outcrop',
        metadata: { quantity: Math.floor(rng() * 10) + 5 },
        isVisible: true,
        isWalkable: true,
        blocksLineOfSight: false,
        interactable: true,
      });
    }
  }

  return features;
}

/**
 * Batch generate chunks for starting area
 * Generates 32x32 chunks (256x256 tiles = 2048x2048 pixels with 8px tiles)
 */
export function generateStartingArea(seed: string, params: ChunkGenerationParams): GridChunk[] {
  logger.info('[GridChunkGenerator] Generating starting area (32x32 chunks = 256x256 tiles)');

  const chunks: GridChunk[] = [];
  const startChunkX = -16; // Center around 0,0
  const startChunkY = -16;
  const chunkCount = 32; // 32x32 chunks

  // Generate only z=0 (surface) for starting area
  for (let cy = 0; cy < chunkCount; cy++) {
    for (let cx = 0; cx < chunkCount; cx++) {
      const chunkX = startChunkX + cx;
      const chunkY = startChunkY + cy;

      const chunk = generateGridChunk(chunkX, chunkY, 0, params);
      chunk.isStartingArea = true;
      chunks.push(chunk);
    }
  }

  logger.info(`[GridChunkGenerator] Generated ${chunks.length} starting area chunks`);
  return chunks;
}
