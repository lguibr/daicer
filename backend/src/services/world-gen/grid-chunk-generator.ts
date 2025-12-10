/**
 * Grid Chunk Generator
 * Generates chunks on-demand for the infinite grid system
 */

import type { GridChunk } from '@daicer/shared/world/grid-chunk-schema';
import type { GridTile } from '@daicer/shared/world/grid-tile-schema';
import type { GridFeature } from '@daicer/shared/world/grid-feature-schema';
import { CHUNK_SIZE } from '@daicer/shared/world/grid-chunk-schema';
import { SimplexNoise, Alea } from './noise';
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
    const moistureNoise = new SimplexNoise(`${seed}-moist`);

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
            moistureNoise,
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
      const chunkFeatures = generateFeatures(tiles, chunkSeed);
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
    moistureNoise: SimplexNoise;
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
  const { elevationNoise, moistureNoise, caveNoise } = noiseGenerators;

  // --- FRONTEND PARITY LOGIC ---
  // Matches useWorldGeneration.ts exactly

  // 1. Elevation (Scale 0.02, 4 octaves)
  const elevationScale = 0.02;
  const rawElevation = elevationNoise.octaveNoise(x * elevationScale, y * elevationScale, 4, 0.5);

  // 2. Moisture (Scale 0.03, 3 octaves, offset 1000)
  const moistureScale = 0.03;
  const rawMoisture = moistureNoise.octaveNoise(x * moistureScale + 1000, y * moistureScale + 1000, 3, 0.5);

  // 3. Biome Classification
  let biomeType = 'plains';

  // Frontend logic copy-paste:
  if (rawElevation < -0.3) {
    biomeType = 'ocean';
  } else if (rawElevation < -0.1) {
    biomeType = 'beach';
  } else if (rawElevation < 0.1) {
    if (rawMoisture < -0.2) biomeType = 'desert';
    else if (rawMoisture < 0.2) biomeType = 'plains';
    else biomeType = 'swamp';
  } else if (rawElevation < 0.4) {
    if (rawMoisture < -0.1) biomeType = 'savanna';
    else if (rawMoisture < 0.3) biomeType = 'forest';
    else biomeType = 'jungle';
  } else if (rawElevation < 0.6) {
    biomeType = 'hills';
  } else {
    biomeType = 'mountains';
  }

  // --- END FRONTEND PARITY LOGIC ---

  // Map biome name to block types (simplified mapping)
  // In a real scenario, we might want to use the BiomeDefinition from biomes.ts,
  // but for now we'll map manually to ensure visual parity with frontend's expectations
  // or use a helper if available.
  // Let's try to use the existing selectBiome if we can map the inputs,
  // OR just define the blocks directly here to be 100% sure.

  // Let's define a simple mapping for now to guarantee the "look" matches
  let surfaceBlock = 'grass';
  let subsurfaceBlock = 'dirt';
  let undergroundBlock = 'stone';

  switch (biomeType) {
    case 'ocean':
      surfaceBlock = 'sand';
      subsurfaceBlock = 'sand';
      break;
    case 'beach':
      surfaceBlock = 'sand';
      subsurfaceBlock = 'sand';
      break;
    case 'desert':
      surfaceBlock = 'sand';
      subsurfaceBlock = 'sandstone';
      break;
    case 'swamp':
      surfaceBlock = 'grass';
      subsurfaceBlock = 'mud';
      break; // Approximate
    case 'mountains':
      surfaceBlock = 'stone';
      subsurfaceBlock = 'stone';
      break;
    case 'hills':
      surfaceBlock = 'grass';
      subsurfaceBlock = 'stone';
      break;
    case 'jungle':
      surfaceBlock = 'grass';
      subsurfaceBlock = 'dirt';
      break;
    case 'forest':
      surfaceBlock = 'grass';
      subsurfaceBlock = 'dirt';
      break;
    case 'savanna':
      surfaceBlock = 'grass';
      subsurfaceBlock = 'dirt';
      break; // Dry grass?
    case 'ice':
      surfaceBlock = 'snow';
      subsurfaceBlock = 'ice';
      break;
    default:
      surfaceBlock = 'grass';
      subsurfaceBlock = 'dirt';
  }

  // Determine block type based on z-level
  // Frontend treats z=0 as surface.
  // Backend supports 3D chunks.
  // We need to map the "elevation" (which is -1 to 1) to a Z-height.

  // Frontend logic:
  // if (floor === 3) -> Surface generation.
  // Frontend doesn't really have "height" in the grid, it just paints the tile.
  // BUT, for the backend 3D world, we need to give it some depth.

  // Let's say "Surface" is around Z=0.
  // Elevation -1 to 1.
  // Let's scale it slightly so mountains actually go up.
  const terrainHeight = Math.floor(rawElevation * 10); // -10 to +10 range roughly

  let blockType: string = 'air';
  let lightLevel = 0;

  if (z > terrainHeight) {
    // Above terrain
    if (z <= params.waterLevel * 10 && rawElevation < -0.1) {
      // Water level check
      blockType = 'water';
      lightLevel = 15; // Simplified
    } else {
      blockType = 'air';
      lightLevel = 15;
    }
  } else if (z === terrainHeight) {
    blockType = surfaceBlock;
    lightLevel = 15;
  } else if (z > terrainHeight - 4) {
    blockType = subsurfaceBlock;
    lightLevel = 0;
  } else {
    blockType = undergroundBlock;
    lightLevel = 0;

    // Caves
    if (z < 0 && caveNoise) {
      const isCave = generateCave(x, y, z, caveNoise, params.caveFrequency);
      if (isCave) blockType = 'air';
    }

    // Bedrock
    if (z < -60) blockType = 'bedrock';
  }

  return {
    x,
    y,
    z,
    blockType: blockType as any,
    biome: biomeType,
    elevation: rawElevation * 100, // Keep consistent scale for metadata
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
function generateFeatures(tiles: GridTile[], seed: string): GridFeature[] {
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
export function generateStartingArea(params: ChunkGenerationParams): GridChunk[] {
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
