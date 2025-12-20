import { SimplexNoise, Alea } from './noise';
import { STRUCTURE_TEMPLATES, structureTileToBiome, type StructureFloor } from './structures';
import { generateStructureFootprints, stampDetailedStructures } from './structures/generator';
import type { ChunkDTO } from '../world/terrain-types';

export interface GenerationParams {
  // Structures
  structureMinDistance: number;
  maxStructures: number;
  generateRoads: boolean;

  // Elevation Noise
  elevationScale: number;
  elevationOctaves: number;
  elevationPersistence: number;

  // Moisture Noise
  moistureScale: number;
  moistureOctaves: number;
  moisturePersistence: number;

  // Cellular Automata (Caves)
  caveFillPercentage: number;
  caveIterations: number;
  caveBirthLimit: number;
  caveDeathLimit: number;

  // BSP Rooms
  bspSize: number;
  bspMinRoomSize: number;
  bspMaxRoomSize: number;

  // Poisson Disc (Features)
  featureMinDistance: number;
  featureAttempts: number;
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  structureMinDistance: 30,
  maxStructures: 10,
  generateRoads: false,
  elevationScale: 0.02,
  elevationOctaves: 4,
  elevationPersistence: 0.5,
  moistureScale: 0.03,
  moistureOctaves: 3,
  moisturePersistence: 0.5,
  caveFillPercentage: 0.45,
  caveIterations: 5,
  caveBirthLimit: 4,
  caveDeathLimit: 3,
  bspSize: 64,
  bspMinRoomSize: 4,
  bspMaxRoomSize: 12,
  featureMinDistance: 20,
  featureAttempts: 30,
};

/**
 * Pure function to get biome and block type from noise at a specific coordinate.
 * This is the SINGLE SOURCE OF TRUTH for the "Natural World".
 */
export function getProceduralTile(
  x: number,
  y: number,
  z: number, // -3 to +3
  seed: string,
  params: GenerationParams,
  noise: SimplexNoise
): { biome: string; blockType: string } {
  // 1. Base Noise
  const elev = noise.octaveNoise(
    x * params.elevationScale,
    y * params.elevationScale,
    params.elevationOctaves,
    params.elevationPersistence
  );
  const moist = noise.octaveNoise(
    x * params.moistureScale + 1000,
    y * params.moistureScale + 1000,
    params.moistureOctaves,
    params.moisturePersistence
  );

  // 2. Determine Biome
  let biome = 'plains';
  if (elev < -0.3) biome = 'ocean';
  else if (elev < -0.1) biome = 'beach';
  else if (elev < 0.1) {
    if (moist < -0.2) biome = 'desert';
    else if (moist < 0.2) biome = 'plains';
    else biome = 'swamp';
  } else if (elev < 0.4) {
    if (moist < -0.1) biome = 'savanna';
    else if (moist < 0.3) biome = 'forest';
    else biome = 'jungle';
  } else if (elev < 0.6) {
    biome = 'hills';
  } else {
    biome = 'mountains';
  }

  // 3. Determine Block Type based on Z-Level and Biome
  let blockType = 'air';

  // Surface Level (z=0)
  if (z === 0) {
    // Water handling
    if (biome === 'ocean' || biome === 'deep_ocean') return { biome, blockType: 'water' };

    // Default surface blocks
    switch (biome) {
      case 'desert':
        blockType = 'sand';
        break;
      case 'beach':
        blockType = 'sand';
        break;
      case 'snowy_peaks':
        blockType = 'snow';
        break;
      case 'mountains':
        blockType = 'stone';
        break;
      case 'badlands':
        blockType = 'terracotta';
        break;
      default:
        blockType = 'grass';
    }
  }
  // Underground (z < 0)
  else if (z < 0) {
    blockType = 'stone';
    // Deep underground could be dark
  }
  // Sky/Air (z > 0)
  else {
    blockType = 'air';
  }

  return { biome, blockType };
}

/**
 * Unified Terrain Generator
 * Returns a ChunkDTO structure with 3D data.
 */
export function createUnifiedTerrainGenerator(seed: string, params: GenerationParams) {
  const CORE_SIZE = 1024;
  const noise = new SimplexNoise(seed);

  // --- CORE WORLD CACHE ---
  // We still pre-generate the Core World footprints for roads and global structures
  // But we store them differently or just use them as a "Layermask"
  let coreStructures: string[][][] | null = null;
  // We also need to know checking strictly for "Is this a road/structure?"

  try {
    const structureParams = {
      minDistance: params.structureMinDistance,
      maxStructures: params.maxStructures,
      generateRoads: params.generateRoads,
      elevationScale: params.elevationScale,
      elevationOctaves: params.elevationOctaves,
      elevationPersistence: params.elevationPersistence,
      moistureScale: params.moistureScale,
      moistureOctaves: params.moistureOctaves,
      moisturePersistence: params.moisturePersistence,
      caveFillPercentage: params.caveFillPercentage,
      caveIterations: params.caveIterations,
      caveBirthLimit: params.caveBirthLimit,
      caveDeathLimit: params.caveDeathLimit,
      bspSize: params.bspSize,
      bspMinRoomSize: params.bspMinRoomSize,
      bspMaxRoomSize: params.bspMaxRoomSize,
      featureMinDistance: params.featureMinDistance,
      featureAttempts: params.featureAttempts,
      roadMaterial: 'stone' as any,
      wfcBlendEdges: false,
    };

    const footprints = generateStructureFootprints(CORE_SIZE, CORE_SIZE, seed, structureParams);

    // stampDetailedStructures returns [floor][y][x] strings
    coreStructures = stampDetailedStructures(
      footprints.biomeGrid,
      footprints.detailedStructures || [],
      footprints.biomeGrid
    );
  } catch (e) {
    console.warn('[UnifiedGen] Failed to generate core roads', e);
  }

  /**
   * Generates a single tile at (x,y,z)
   * Resolves: Core Structure -> Stateless Structure -> Procedural Terrain
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTileAt = (x: number, y: number, z: number): { biome: string; blockType: string } => {
    const floorIndex = z + 3; // Map -3..3 to 0..6

    // 1. Check Core World Cache (if inside bounds)
    if (coreStructures && x >= 0 && y >= 0 && x < CORE_SIZE && y < CORE_SIZE) {
      const coreBlock = coreStructures[floorIndex]?.[y]?.[x];
      // If coreBlock is present and NOT empty string, use it
      if (coreBlock && coreBlock !== '') {
        // Parse the string "biome" from the old generator
        // The old generator returned strings like 'stone', 'plains', 'wall', etc.
        // We need to infer blockType from it if possible, or mapping

        // Quick heuristic mapping from the string soup
        const raw = coreBlock;
        let b = 'plains';
        let t = 'grass';

        if (raw === 'stone') {
          t = 'stone';
          b = 'plains';
        } else if (raw === 'wood') {
          t = 'wood';
          b = 'forest';
        } else if (raw === 'wall') {
          t = 'wall';
          b = 'plains';
        } else if (raw === 'floor') {
          t = 'floor';
          b = 'plains';
        } else if (raw === 'water') {
          t = 'water';
          b = 'ocean';
        } else {
          // It might be a biome name like 'forest'
          b = raw;
          t = 'grass'; // default
        }
        return { biome: b, blockType: t };
      }
    }

    // 2. Stateless Structures (for non-Core world)
    // TODO: Implement stateless structures here if needed, or rely on procedural for outside
    // For MVP, we stick to Procedural for everything else

    // 3. Procedural Terrain
    return getProceduralTile(x, y, z, seed, params, noise);
  };

  /**
   * Bundle a chunk
   */
  return (chunkX: number, chunkY: number, size: number): ChunkDTO => {
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // Initialize 7-layer grid
    const grid: { b: string; t: string }[][][] = [];
    for (let f = 0; f < 7; f++) grid[f] = [];

    for (let floor = 0; floor < 7; floor++) {
      const z = floor - 3;
      for (let y = 0; y < size; y++) {
        const row: { b: string; t: string }[] = [];
        for (let x = 0; x < size; x++) {
          const worldX = worldOffsetX + x;
          const worldY = worldOffsetY + y;

          const tile = getTileAt(worldX, worldY, z);
          row.push({ b: tile.biome, t: tile.blockType });
        }
        grid[floor].push(row);
      }
    }

    return {
      chunkX,
      chunkY,
      worldOffsetX,
      worldOffsetY,
      size,
      grid,
    };
  };
}

// Re-export the legacy generator for now to avoid breaking imports immediately,
// strictly aliased or wrapped if needed.
// But we will REPLACE the content of createSimpleChunkGenerator to use the new logic
// while maintaining the signature for compat if possible, OR just export the new one.

// Backward compatibility wrapper
export function createSimpleChunkGenerator(seed: string, params: GenerationParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unified = createUnifiedTerrainGenerator(seed, params);
  const noise = new SimplexNoise(seed);

  const CORE_SIZE = 1024;
  let coreStructures: string[][][] | null = null;

  // Initialize Core Structures once (Closure)
  try {
    const structureParams = {
      minDistance: params.structureMinDistance,
      maxStructures: params.maxStructures,
      generateRoads: params.generateRoads,
      elevationScale: params.elevationScale,
      elevationOctaves: params.elevationOctaves,
      elevationPersistence: params.elevationPersistence,
      moistureScale: params.moistureScale,
      moistureOctaves: params.moistureOctaves,
      moisturePersistence: params.moisturePersistence,
      caveFillPercentage: params.caveFillPercentage,
      caveIterations: params.caveIterations,
      caveBirthLimit: params.caveBirthLimit,
      caveDeathLimit: params.caveDeathLimit,
      bspSize: params.bspSize, // params.bspSize
      bspMinRoomSize: params.bspMinRoomSize,
      bspMaxRoomSize: params.bspMaxRoomSize,
      featureMinDistance: params.featureMinDistance,
      featureAttempts: params.featureAttempts,
      roadMaterial: 'stone' as any,
      wfcBlendEdges: false,
    };
    const footprints = generateStructureFootprints(CORE_SIZE, CORE_SIZE, seed, structureParams);
    coreStructures = stampDetailedStructures(
      footprints.biomeGrid,
      footprints.detailedStructures || [],
      footprints.biomeGrid
    );
  } catch (e) {
    // console.warn('Failed to gen core structures', e);
  }

  // Return the generator function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (worldX: number, worldY: number, width: number, height: number): string[][][] => {
    const grid: string[][][] = []; // [floor][y][x]

    for (let f = 0; f < 7; f++) {
      const z = f - 3;
      const floorGrid: string[][] = [];
      for (let ly = 0; ly < height; ly++) {
        const row: string[] = [];
        for (let lx = 0; lx < width; lx++) {
          const wx = worldX + lx;
          const wy = worldY + ly;

          // Check Core
          let val = '';
          if (coreStructures && wx >= 0 && wy >= 0 && wx < CORE_SIZE && wy < CORE_SIZE) {
            val = coreStructures[f]?.[wy]?.[wx] || '';
          }

          if (!val) {
            // Procedural
            const tile = getProceduralTile(wx, wy, z, seed, params, noise);
            if (z === 0) val = tile.biome;
            else val = '';
          }
          row.push(val);
        }
        floorGrid.push(row);
      }
      grid.push(floorGrid);
    }
    return grid;
  };
}
