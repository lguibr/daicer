/**
 * Biome Generator
 * Combines noise-based climate with Voronoi regions for biome distribution
 */

import type { BiomeMap } from '@daicer/shared';
import { logger } from '@/utils/logger';
import { SimplexNoise, Alea } from './noise';
import { poissonDiscSampling, type Point2D } from './poisson';
import { selectBiome, type ClimateData } from './biomes';

export interface BiomeGenerationParams {
  seed: string;
  width: number; // In tiles
  height: number; // In tiles
  offsetX?: number; // World offset for chunks (for continuity)
  offsetY?: number; // World offset for chunks (for continuity)
  temperatureBias?: number;
  moistureBias?: number;
  continentalnessBias?: number;
  biomeRegionSize?: number; // Size of Voronoi regions (default 100 tiles)
}

/**
 * Generate biome map combining noise climate with Voronoi regions
 */
export function generateBiomeMap(params: BiomeGenerationParams): BiomeMap {
  const {
    seed,
    width,
    height,
    offsetX = 0,
    offsetY = 0,
    temperatureBias = 0,
    moistureBias = 0,
    continentalnessBias = 0,
    biomeRegionSize = 100,
  } = params;

  logger.info(
    `[BiomeGenerator] Generating ${width}x${height} biome map with seed: ${seed} at offset (${offsetX}, ${offsetY})`
  );

  const rng = Alea(seed);

  // For infinite terrain chunks (non-zero offset), skip Voronoi regions
  // Only use pure noise-based biomes for seamless generation
  const useVoronoi = offsetX === 0 && offsetY === 0;
  let voronoiSeeds: Point2D[] = [];

  if (useVoronoi) {
    // Generate Voronoi seeds only for initial map
    voronoiSeeds = poissonDiscSampling(width, height, biomeRegionSize, 30, seed);
    logger.debug(`[BiomeGenerator] Generated ${voronoiSeeds.length} Voronoi regions`);
  } else {
    logger.debug(`[BiomeGenerator] Skipping Voronoi for chunk at offset (${offsetX}, ${offsetY})`);
  }

  // Initialize noise generators for climate
  const tempNoise = new SimplexNoise(`${seed}-temp`);
  const moistNoise = new SimplexNoise(`${seed}-moist`);
  const contNoise = new SimplexNoise(`${seed}-cont`);
  const erosionNoise = new SimplexNoise(`${seed}-erosion`);
  const weirdNoise = new SimplexNoise(`${seed}-weird`);

  // Generate full-resolution biome grid
  const grid: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const worldX = x + offsetX; // Apply offset for chunk continuity
      const worldY = y + offsetY;

      // Generate climate at this position
      const climateBase = generateClimateAt(
        worldX,
        worldY,
        tempNoise,
        moistNoise,
        contNoise,
        erosionNoise,
        weirdNoise,
        temperatureBias,
        moistureBias,
        continentalnessBias
      );

      // Find nearest Voronoi seed (skip if no Voronoi)
      let climate = climateBase;

      if (useVoronoi && voronoiSeeds.length > 0) {
        const nearestSeed = findNearestVoronoiSeed(worldX, worldY, voronoiSeeds);

        // Add Voronoi influence to climate (regions have slight climate bias)
        const regionInfluence = 0.2; // 20% influence from region
        const regionTemp = (nearestSeed.x / width - 0.5) * 2; // -1 to 1 based on x position
        const regionMoist = (nearestSeed.y / height - 0.5) * 2; // -1 to 1 based on y position

        climate = {
          ...climateBase,
          temperature: climateBase.temperature * (1 - regionInfluence) + regionTemp * regionInfluence,
          moisture: climateBase.moisture * (1 - regionInfluence) + regionMoist * regionInfluence,
        };
      }

      // Generate base elevation for biome selection
      const elevationScale = 0.005;
      const baseElevation = tempNoise.octaveNoise(worldX * elevationScale, worldY * elevationScale, 4, 0.5, 2.0);

      // Select biome
      const biome = selectBiome(climate, baseElevation);
      row.push(biome.type);
    }
    grid.push(row);
  }

  return {
    width,
    height,
    seed,
    grid,
    temperatureBias,
    moistureBias,
    continentalnessBias,
  };
}

/**
 * Generate climate data at a specific position
 */
function generateClimateAt(
  x: number,
  y: number,
  tempNoise: SimplexNoise,
  moistNoise: SimplexNoise,
  contNoise: SimplexNoise,
  erosionNoise: SimplexNoise,
  weirdNoise: SimplexNoise,
  tempBias: number,
  moistBias: number,
  contBias: number
): ClimateData {
  const scale = 0.003; // Climate features are large-scale

  return {
    temperature: tempNoise.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + tempBias,
    moisture: moistNoise.octaveNoise(x * scale, y * scale, 4, 0.5, 2.0) + moistBias,
    continentalness: contNoise.octaveNoise(x * scale * 0.5, y * scale * 0.5, 3, 0.6, 1.8) + contBias,
    erosion: erosionNoise.octaveNoise(x * scale * 2, y * scale * 2, 5, 0.4, 2.2),
    weirdness: weirdNoise.domainWarpedNoise(x * scale * 1.5, y * scale * 1.5, 0.5, 4),
  };
}

/**
 * Find nearest Voronoi seed to a point
 */
function findNearestVoronoiSeed(x: number, y: number, seeds: Point2D[]): Point2D {
  let minDist = Infinity;
  let nearest = seeds[0];

  for (const seed of seeds) {
    const dx = x - seed.x;
    const dy = y - seed.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = seed;
    }
  }

  return nearest;
}

/**
 * Get biome at a specific tile position from biome map
 * Uses nearest-neighbor upsampling from the downsampled grid
 */
export function getBiomeAt(biomeMap: BiomeMap, x: number, y: number): string {
  const sampleScale = 4;
  const gridX = Math.floor(x / sampleScale);
  const gridY = Math.floor(y / sampleScale);

  // Clamp to grid bounds
  const clampedX = Math.max(0, Math.min(biomeMap.grid[0].length - 1, gridX));
  const clampedY = Math.max(0, Math.min(biomeMap.grid.length - 1, gridY));

  return biomeMap.grid[clampedY][clampedX];
}
