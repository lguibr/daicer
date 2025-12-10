/**
 * @file backend/src/services/world-gen/tacticalBridge.ts
 * @description Bridge between world-gen biomes and tactical terrain
 */

import { v4 as uuidv4 } from 'uuid';
import type { BiomeType } from './biomes';
import { selectBiome } from './biomes';
import { createWorldNoise } from './noise';
import type { GridCell } from '../../tactical/types/arena';
import { TerrainType, createGridCell } from '../../tactical/types/arena';
import type { TacticalArena } from '../../tactical/state/schema';

/**
 * Map 37 world-gen biome types to tactical terrain
 * Uses biome type + elevation to determine tactical properties
 */
export function biomeToTacticalTerrain(biome: BiomeType, elevation: number): TerrainType {
  // Deep water = impassable wall
  if (['ocean', 'deep_ocean', 'frozen_ocean'].includes(biome)) {
    return elevation < -0.5 ? TerrainType.WALL : TerrainType.FLOOR;
  }

  // Shallow water = floor (walkable but visible as water in 3D)
  if (['river', 'lake', 'frozen_river'].includes(biome)) {
    return TerrainType.FLOOR;
  }

  // Mountains & volcanic - steep cliffs are walls, peaks are elevated
  if (['mountains', 'snowy_mountains', 'volcanic'].includes(biome)) {
    if (elevation > 0.7) return TerrainType.WALL; // Impassable cliff
    if (elevation > 0.4) return TerrainType.ELEVATION_HIGH; // High ground
    return TerrainType.DIFFICULT; // Rocky slopes
  }

  // Dense forests - heavy undergrowth with lots of cover
  if (['jungle', 'bamboo_jungle', 'dark_forest', 'rainforest'].includes(biome)) {
    // Random distribution of cover vs difficult terrain
    return Math.random() > 0.6 ? TerrainType.COVER_FULL : TerrainType.COVER_HALF;
  }

  // Light forests - some cover, some difficult
  if (['forest', 'birch_forest', 'taiga', 'snowy_taiga', 'tropical_forest'].includes(biome)) {
    return Math.random() > 0.7 ? TerrainType.COVER_HALF : TerrainType.DIFFICULT;
  }

  // Swamps - wet, difficult terrain
  if (['swamp', 'mangrove_swamp'].includes(biome)) {
    return TerrainType.DIFFICULT;
  }

  // Deserts & badlands - hot, some hazards (quicksand, lava cracks)
  if (['desert', 'badlands'].includes(biome)) {
    return Math.random() > 0.92 ? TerrainType.HAZARD : TerrainType.FLOOR;
  }

  // Beaches & plains - open, clear terrain
  if (['beach', 'plains', 'sunflower_plains', 'meadow', 'savanna'].includes(biome)) {
    return TerrainType.FLOOR;
  }

  // Snow/ice - slippery, difficult
  if (['snowy_plains', 'ice_spikes', 'tundra'].includes(biome)) {
    return Math.random() > 0.85 ? TerrainType.DIFFICULT : TerrainType.FLOOR;
  }

  // Mushroom islands - unique but generally open
  if (biome === 'mushroom_island') {
    return TerrainType.FLOOR;
  }

  // Default: open floor
  return TerrainType.FLOOR;
}

/**
 * Extract tactical chunk from world coordinates
 * Returns 15x15 grid centered at world position
 */
export async function extractTacticalChunk(
  worldSeed: number,
  worldX: number,
  worldY: number,
  radius: number = 7
): Promise<{ cells: GridCell[]; worldCoords: { x: number; y: number } }> {
  const cells: GridCell[] = [];

  // Create noise functions for this world
  const noise = createWorldNoise(worldSeed);

  // Extract chunk
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const wx = worldX + dx;
      const wy = worldY + dy;

      // Calculate climate data for this position
      const scale = 0.001; // Same scale as world gen
      const temperature = noise.octaveNoise(wx * scale, wy * scale, 4);
      const moisture = noise.octaveNoise(wx * scale + 1000, wy * scale + 1000, 4);
      const continentalness = noise.octaveNoise(wx * scale + 2000, wy * scale + 2000, 4);
      const erosion = noise.octaveNoise(wx * scale + 3000, wy * scale + 3000, 4);
      const weirdness = noise.octaveNoise(wx * scale + 4000, wy * scale + 4000, 4);

      // Calculate base elevation
      const baseElevation = noise.octaveNoise(wx * scale + 5000, wy * scale + 5000, 6);

      // Select biome
      const biomeDefinition = selectBiome(
        { temperature, moisture, continentalness, erosion, weirdness },
        baseElevation
      );

      // Map to tactical terrain
      const terrain = biomeToTacticalTerrain(biomeDefinition.type, baseElevation);

      // Create grid cell
      const cell = createGridCell(dx + radius, dy + radius, terrain);
      cells.push(cell);
    }
  }

  return { cells, worldCoords: { x: worldX, y: worldY } };
}

/**
 * Generate full tactical arena from world coordinates
 */
export async function generateArenaFromWorld(
  worldSeed: number,
  worldX: number,
  worldY: number,
  name?: string
): Promise<TacticalArena> {
  const { cells, worldCoords } = await extractTacticalChunk(worldSeed, worldX, worldY);

  const gridWidth = 15;
  const gridHeight = 15;

  // Find spawn zones - open terrain far from edges
  const playerSpawns = cells
    .filter((c) => c.terrain === TerrainType.FLOOR && c.x < 5 && c.y > 5 && c.y < 10)
    .map((c) => ({ x: c.x, y: c.y }));

  const enemySpawns = cells
    .filter((c) => c.terrain === TerrainType.FLOOR && c.x > 10 && c.y > 5 && c.y < 10)
    .map((c) => ({ x: c.x, y: c.y }));

  return {
    id: `world-${worldX}-${worldY}-${uuidv4().slice(0, 8)}`,
    name: name || `Tactical Zone (${worldX}, ${worldY})`,
    description: `Generated from world seed ${worldSeed}`,
    gridWidth,
    gridHeight,
    cells,
    spawnZones: {
      players: playerSpawns.length > 0 ? playerSpawns : [{ x: 2, y: 7 }],
      enemies: enemySpawns.length > 0 ? enemySpawns : [{ x: 12, y: 7 }],
    },
    sourceType: 'world_generated',
    worldCoordinates: worldCoords,
  };
}
