/**
 * Biome Selection Algorithm
 * 5-layer climate-based biome selection with weighted scoring
 */

import type { BiomeDefinition, ClimateData } from './types';
import { BIOMES } from './data';

/**
 * Select best matching biome based on 5-layer climate system
 *
 * Scoring weights:
 * - Temperature: 100 points (match) or -50×distance (mismatch)
 * - Moisture: 100 points or -50×distance
 * - Continentalness: 150 points or -80×distance (highest weight - ocean vs land)
 * - Erosion: 80 points or -40×distance
 * - Weirdness: 50 points or -30×distance
 * - Elevation: -20×distance penalty
 *
 * @param climate - 5-layer climate data
 * @param elevation - Terrain elevation for additional matching
 * @returns Best matching biome definition
 */
export function selectBiome(climate: ClimateData, elevation: number): BiomeDefinition {
  const biomeList = Object.values(BIOMES).filter((b) => b.type !== 'void');

  if (biomeList.length === 0) {
    return BIOMES.plains; // Fallback to plains
  }

  let bestBiome = biomeList[0] as BiomeDefinition;
  let bestScore = -Infinity;

  for (const biome of biomeList) {
    // Calculate fitness score based on how well climate matches biome requirements
    let score = 0;

    // Temperature match
    if (climate.temperature >= biome.temperature.min && climate.temperature <= biome.temperature.max) {
      score += 100;
    } else {
      const tempDist = Math.min(
        Math.abs(climate.temperature - biome.temperature.min),
        Math.abs(climate.temperature - biome.temperature.max)
      );
      score -= tempDist * 50;
    }

    // Moisture match
    if (climate.moisture >= biome.moisture.min && climate.moisture <= biome.moisture.max) {
      score += 100;
    } else {
      const moistDist = Math.min(
        Math.abs(climate.moisture - biome.moisture.min),
        Math.abs(climate.moisture - biome.moisture.max)
      );
      score -= moistDist * 50;
    }

    // Continentalness match (most important for ocean vs land)
    if (climate.continentalness >= biome.continentalness.min && climate.continentalness <= biome.continentalness.max) {
      score += 150; // Higher weight
    } else {
      const contDist = Math.min(
        Math.abs(climate.continentalness - biome.continentalness.min),
        Math.abs(climate.continentalness - biome.continentalness.max)
      );
      score -= contDist * 80;
    }

    // Erosion match
    if (climate.erosion >= biome.erosion.min && climate.erosion <= biome.erosion.max) {
      score += 80;
    } else {
      const erosionDist = Math.min(
        Math.abs(climate.erosion - biome.erosion.min),
        Math.abs(climate.erosion - biome.erosion.max)
      );
      score -= erosionDist * 40;
    }

    // 5. Weirdness (optional, default to match)
    let weirdnessScore = 1;
    if (biome.weirdness && climate.weirdness !== undefined) {
      if (climate.weirdness >= biome.weirdness.min && climate.weirdness <= biome.weirdness.max) {
        weirdnessScore = 50;
      } else {
        const weirdDist = Math.min(
          Math.abs(climate.weirdness - biome.weirdness.min),
          Math.abs(climate.weirdness - biome.weirdness.max)
        );
        weirdnessScore = -weirdDist * 30;
      }
    }

    // Elevation bonus/penalty
    const elevationDiff = Math.abs(elevation - biome.baseElevation);
    const elevationScore = -elevationDiff * 20;

    const totalScore = score + weirdnessScore + elevationScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestBiome = biome;
    }
  }

  return bestBiome;
}
