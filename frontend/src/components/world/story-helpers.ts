/**
 * Storybook Story Helpers
 * Utilities for creating comprehensive grid chunk test data
 */

import type { GridChunk, GridTile } from '@daicer/shared';

/**
 * Biome to BlockType mapping (from biome definitions)
 */
const BIOME_BLOCKS: Record<string, { surface: string; subsurface: string; underground: string }> = {
  ocean: { surface: 'water', subsurface: 'sand', underground: 'stone' },
  deep_ocean: { surface: 'water', subsurface: 'gravel', underground: 'stone' },
  frozen_ocean: { surface: 'ice', subsurface: 'packed_ice', underground: 'stone' },
  beach: { surface: 'sand', subsurface: 'sand', underground: 'stone' },
  plains: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  forest: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  birch_forest: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  dark_forest: { surface: 'podzol', subsurface: 'dirt', underground: 'stone' },
  jungle: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  savanna: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  desert: { surface: 'sand', subsurface: 'sandstone', underground: 'stone' },
  badlands: { surface: 'terracotta', subsurface: 'red_sand', underground: 'stone' },
  mountains: { surface: 'stone', subsurface: 'stone', underground: 'stone' },
  snowy_peaks: { surface: 'snow', subsurface: 'stone', underground: 'stone' },
  tundra: { surface: 'snow', subsurface: 'dirt', underground: 'stone' },
  taiga: { surface: 'grass', subsurface: 'dirt', underground: 'stone' },
  snowy_taiga: { surface: 'snow', subsurface: 'dirt', underground: 'stone' },
  swamp: { surface: 'mud', subsurface: 'dirt', underground: 'stone' },
  mushroom_fields: { surface: 'mycelium', subsurface: 'dirt', underground: 'stone' },
};

// Helper type for Z
type GridZ = GridChunk['z'];

/**
 * Create empty grid chunk (all air)
 */
export function createEmptyChunk(chunkX: number, chunkY: number, z: GridZ): GridChunk {
  const tiles: GridTile[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      tiles.push({
        x: chunkX * 8 + x,
        y: chunkY * 8 + y,
        z,
        blockType: 'air',
        biome: 'void',
        elevation: 0,
        lightLevel: 15,
      });
    }
  }

  return {
    chunkX,
    chunkY,
    z,
    tiles,
    features: [],
    biomes: ['void'],
    seed: `empty-${chunkX}-${chunkY}-${z}`,
    generated: true,
    generatedAt: Date.now(),
    hasStructure: false,
    hasCave: false,
    isStartingArea: true,
  };
}

/**
 * Create biome-specific chunk with proper block types
 */
export function createBiomeChunk(chunkX: number, chunkY: number, z: GridZ, biomeType: string): GridChunk {
  const blocks = BIOME_BLOCKS[biomeType] || { surface: 'grass', subsurface: 'dirt', underground: 'stone' };
  const tiles: GridTile[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      // Add variation within biome
      let blockType = blocks.surface;

      if ((x + y) % 5 === 0) {
        blockType = blocks.subsurface;
      } else if ((x + y) % 7 === 0) {
        blockType = blocks.underground;
      }

      tiles.push({
        x: chunkX * 8 + x,
        y: chunkY * 8 + y,
        z,
        blockType: blockType as GridTile['blockType'],
        biome: biomeType,
        elevation: 0,
        lightLevel: z >= 0 ? 15 : 5,
      });
    }
  }

  return {
    chunkX,
    chunkY,
    z,
    tiles,
    features: [],
    biomes: [biomeType],
    seed: `biome-${biomeType}-${chunkX}-${chunkY}`,
    generated: true,
    generatedAt: Date.now(),
    hasStructure: false,
    hasCave: false,
    isStartingArea: true,
  };
}

/**
 * Create chunk with biome transition
 */
export function createTransitionChunk(
  chunkX: number,
  chunkY: number,
  z: GridZ,
  biome1: string,
  biome2: string,
  axis: 'x' | 'y'
): GridChunk {
  const blocks1 = BIOME_BLOCKS[biome1] || { surface: 'grass', subsurface: 'dirt', underground: 'stone' };
  const blocks2 = BIOME_BLOCKS[biome2] || { surface: 'sand', subsurface: 'sandstone', underground: 'stone' };
  const tiles: GridTile[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      // Determine which biome based on axis
      const progress = axis === 'x' ? x / 7 : y / 7; // 0 to 1
      const useBiome2 = progress > 0.5;

      const blocks = useBiome2 ? blocks2 : blocks1;
      const biome = useBiome2 ? biome2 : biome1;

      let blockType = blocks.surface;
      if ((x + y) % 5 === 0) {
        blockType = blocks.subsurface;
      }

      tiles.push({
        x: chunkX * 8 + x,
        y: chunkY * 8 + y,
        z,
        blockType: blockType as GridTile['blockType'],
        biome,
        elevation: 0,
        lightLevel: 15,
      });
    }
  }

  return {
    chunkX,
    chunkY,
    z,
    tiles,
    features: [],
    biomes: [biome1, biome2],
    seed: `transition-${biome1}-${biome2}`,
    generated: true,
    generatedAt: Date.now(),
    hasStructure: false,
    hasCave: false,
    isStartingArea: true,
  };
}

/**
 * Create mock fetch function for stories
 */
export function createMockFetch(chunks: Record<string, GridChunk>): typeof fetch {
  return async (url: string | URL | Request) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    console.log('[MockFetch] Called with:', urlString);

    const match = urlString.match(/chunk\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)/);
    if (match && match[2] && match[3] && match[4]) {
      const cx = parseInt(match[2], 10);
      const cy = parseInt(match[3], 10);
      const z = parseInt(match[4], 10);
      const key = `${cx}_${cy}_${z}`;

      const chunk = chunks[key];

      if (chunk) {
        console.log('[MockFetch] Returning chunk:', key, 'tiles:', chunk.tiles.length);
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => chunk,
          text: async () => JSON.stringify(chunk),
        } as Response;
      }

      console.warn('[MockFetch] Chunk not found:', key);
    }

    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Chunk not found' }),
      text: async () => 'Not found',
    } as Response;
  };
}

/**
 * Create a 3x3 grid of chunks (viewport coverage)
 */
export function createChunkGrid(generator: (cx: number, cy: number, z: GridZ) => GridChunk): Record<string, GridChunk> {
  const chunks: Record<string, GridChunk> = {};

  for (let cy = -1; cy <= 1; cy++) {
    for (let cx = -1; cx <= 1; cx++) {
      const chunk = generator(cx, cy, 0);
      chunks[`${cx}_${cy}_0`] = chunk;
    }
  }

  return chunks;
}
