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

// New Z-Level Enum for strict typing logic (matches schema)
type GridLayer = -3 | -2 | -1 | 0 | 1 | 2 | 3;

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

  // Validate Z-Level (Phase 1 Strictness)
  if (!isValidLayer(z)) {
    throw new Error(`[GridChunkGenerator] Invalid Z-Layer ${z}. Must be between -3 and +3.`);
  }

  try {
    const { seed } = params;
    const chunkSeed = `${seed}-${chunkX}-${chunkY}-${z}`;

    logger.debug(`[GridChunkGenerator] 🎲 Starting generation`, {
      chunkX,
      chunkY,
      z,
      seed: chunkSeed.substring(0, 30),
    });

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

    // Generate tiles
    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const worldX = chunkX * CHUNK_SIZE + localX;
        const worldY = chunkY * CHUNK_SIZE + localY;

        const tile = generateTile(
          worldX,
          worldY,
          z, // Typed as GridLayer via isValidLayer check
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

    // Generate features for surface chunks (z === 0)
    // TODO: Add different feature logic for other layers (stalagmites in caves, clouds in sky)
    if (z === 0) {
      const chunkFeatures = generateFeatures(tiles, chunkSeed);
      features.push(...chunkFeatures);
    }

    const chunk: GridChunk = {
      chunkX,
      chunkY,
      z: z, // Validated
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

    return chunk;
  } catch (error) {
    logger.error(`[GridChunkGenerator] ❌ GENERATION FAILED!`, {
      chunkX,
      chunkY,
      z,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Type Guard for Z-Layer
 */
function isValidLayer(z: number): z is GridLayer {
  return [-3, -2, -1, 0, 1, 2, 3].includes(z);
}

/**
 * Generate a single tile with Phase 1 Layer Logic
 */
function generateTile(
  x: number,
  y: number,
  z: GridLayer,
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

  // 1. Calculate Physical Terrain Height (The "Ground" Truth)
  // Scale: 0.02, 4 octaves. Range approx -1 to 1.
  // We map this to Z-levels.
  // -1.0 -> -3 (Deep Ocean/Canyon)
  // 0.0 -> 0 (Sea Level/Plains)
  // 1.0 -> +3 (High Peak)
  const elevationScale = 0.02;
  const rawElevation = elevationNoise.octaveNoise(x * elevationScale, y * elevationScale, 4, 0.5);

  // Map rawElevation (-1 to 1) to "Ground Z" (-3 to +3)
  // We amplify it slightly to make mountains reach +2/+3
  const groundZ = Math.floor(rawElevation * 3.5);

  // 2. Biome Classification (Classic Moisture/Temp map)
  const moistureScale = 0.03;
  const rawMoisture = moistureNoise.octaveNoise(x * moistureScale + 1000, y * moistureScale + 1000, 3, 0.5);
  const biomeType = determineBiome(rawElevation, rawMoisture);

  // 3. Block Selection Logic (Strict Layering)
  let blockType = 'air';
  let lightLevel = 0;

  // --- SKY LAYER (z > groundZ) ---
  if (z > groundZ) {
    if (z <= params.waterLevel * 3 && rawElevation < -0.1) {
      // Water fills up to sea level (roughly Z=0 or -1 depending on params)
      blockType = 'water';
      lightLevel = 14;
    } else {
      blockType = 'air';
      lightLevel = 15;
    }
  }
  // --- SURFACE LAYER (z == groundZ) ---
  else if (z === groundZ) {
    blockType = getSurfaceBlock(biomeType);
    lightLevel = 15; // Sunlit
  }
  // --- UNDERGROUND LAYER (z < groundZ) ---
  else {
    // Default Subsurface
    blockType = getSubsurfaceBlock(biomeType);
    lightLevel = 0;

    // Deep Underground Override
    if (z <= -2) {
      blockType = 'stone';
    }

    // Cave Carving (3D Noise)
    if (caveNoise) {
      const isCave = generateCave(x, y, z, caveNoise, params.caveFrequency);
      if (isCave) {
        blockType = 'air'; // Cave air
      }
    }

    // Bedrock Floor (at strictly -3 if we want a hard floor, or just stone)
    // Spec says Z=-3 is bottom layer. Let's make it Bedrock if strictly -3 and not cave?
    // Or just leave it as stone/cave. Let's leave it natural for now.
  }

  return {
    x,
    y,
    z,
    blockType: blockType as any, // Type cast to Enum
    biome: biomeType,
    elevation: rawElevation * 100,
    lightLevel,
  };
}

/**
 * Determine Biome from Noise
 */
function determineBiome(elevation: number, moisture: number): string {
  if (elevation < -0.3) return 'ocean';
  if (elevation < -0.1) return 'beach';

  if (elevation < 0.1) {
    if (moisture < -0.2) return 'desert';
    if (moisture < 0.2) return 'plains';
    return 'swamp';
  }

  if (elevation < 0.4) {
    if (moisture < -0.1) return 'savanna';
    if (moisture < 0.3) return 'forest';
    return 'jungle';
  }

  if (elevation < 0.6) return 'hills';
  return 'mountains';
}

function getSurfaceBlock(biome: string): string {
  switch (biome) {
    case 'desert':
      return 'sand';
    case 'beach':
      return 'sand';
    case 'ocean':
      return 'sand';
    case 'mountains':
      return 'stone';
    case 'ice':
      return 'snow';
    default:
      return 'grass';
  }
}

function getSubsurfaceBlock(biome: string): string {
  switch (biome) {
    case 'desert':
      return 'sandstone';
    case 'beach':
      return 'sandstone';
    case 'swamp':
      return 'mud';
    case 'ice':
      return 'ice';
    default:
      return 'dirt';
  }
}

/**
 * Generate cave using 3D noise
 */
function generateCave(x: number, y: number, z: number, caveNoise: SimplexNoise, frequency: number): boolean {
  const caveScale = 0.05; // Tighter scale for smaller Z-range
  // 3D noise
  const caveValue = caveNoise.octaveNoise3(x * caveScale, y * caveScale, z * 0.2, 3, 0.5, 2.0); // Z-scale higher to stretch caves vertically?
  return Math.abs(caveValue) < 0.3 * frequency; // Threshold
}

/**
 * Generate features for surface chunks
 */
function generateFeatures(tiles: GridTile[], seed: string): GridFeature[] {
  const features: GridFeature[] = [];
  const rng = Alea(seed);

  // Filter for valid surface tiles (Grass/Sand/etc)
  for (const tile of tiles) {
    // Only spawn if this tile is solid and above is air (implicit in Phase 1 logic)
    // But since this function is called for a whole chunk z-slice, we just check blockType
    if (tile.blockType === 'air' || tile.blockType === 'water') continue;

    // Feature Logic... (simplified from original)
    if (tile.biome.includes('forest') && rng() < 0.15) {
      features.push({
        id: `tree_${tile.x}_${tile.y}`,
        position: { x: tile.x, y: tile.y, z: tile.z },
        type: 'tree',
        subtype: 'oak_tree', // simplifying for now
        metadata: { height: 5 },
        isVisible: true,
        isWalkable: false,
        blocksLineOfSight: true,
        interactable: true,
      });
    }
  }
  return features;
}

/**
 * Batch generate chunks for starting area
 */
export function generateStartingArea(params: ChunkGenerationParams): GridChunk[] {
  logger.info('[GridChunkGenerator] Generating starting area (32x32 chunks)');
  const chunks: GridChunk[] = [];
  const chunkCount = 32;
  const startChunkX = -16;
  const startChunkY = -16;

  for (let cy = 0; cy < chunkCount; cy++) {
    for (let cx = 0; cx < chunkCount; cx++) {
      // Generate just the Surface (0) for the starting area?
      // Or all 7 layers?
      // For performance, maybe just 0. But Phase 1 says "Vertical World".
      // Let's generate 0, and maybe -1 if we want caves immediately.
      // User constraints say "Infinite Coordinates", we load on demand.
      // For "Starting Area", let's just do Z=0 to keep bootstrap fast.
      const chunk = generateGridChunk(startChunkX + cx, startChunkY + cy, 0, params);
      chunk.isStartingArea = true;
      chunks.push(chunk);
    }
  }
  return chunks;
}
