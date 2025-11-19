/**
 * Chunk Generator
 * Generates ultra-small biome chunks on-demand for infinite terrain
 * Default 4x4 for maximum granularity and smooth loading
 */

import { generateBiomeMap } from './biome-generator';
import { logger } from '@/utils/logger';

export interface TerrainChunk {
  chunkX: number;
  chunkY: number;
  worldOffsetX: number;
  worldOffsetY: number;
  biomes: string[][];
  structures: Array<{
    name: string;
    type: string;
    x: number;
    y: number;
    [key: string]: any;
  }>;
}

// In-memory chunk cache for fast retrieval
const chunkCache = new Map<string, TerrainChunk>();

// Chunk bounds: ±8192 chunks = ~32k tiles radius with 4x4 chunks
const CHUNK_BOUNDS = 8192;

/**
 * Generate cache key for a chunk
 */
function getChunkKey(roomId: string, chunkX: number, chunkY: number): string {
  return `${roomId}:${chunkX},${chunkY}`;
}

interface GenerateChunkOptions {
  roomId: string;
  chunkX: number;
  chunkY: number;
  chunkSize?: number;
}

/**
 * Generate a single terrain chunk with caching
 * Uses SAME seed as original map for continuity, but different world offset
 * Default 4x4 for ultra-granular loading
 */
export function generateTerrainChunk({ roomId, chunkX, chunkY, chunkSize = 4 }: GenerateChunkOptions): TerrainChunk {
  // Bounds check: prevent infinite chunk generation
  if (Math.abs(chunkX) > CHUNK_BOUNDS || Math.abs(chunkY) > CHUNK_BOUNDS) {
    logger.warn(`[Chunk] Chunk coordinates out of bounds: (${chunkX}, ${chunkY}), max ±${CHUNK_BOUNDS}`);
    throw new Error(`Chunk coordinates out of bounds (max ±${CHUNK_BOUNDS})`);
  }

  // Check cache first
  const cacheKey = getChunkKey(roomId, chunkX, chunkY);
  const cached = chunkCache.get(cacheKey);
  if (cached) {
    logger.debug(`[Chunk] Cache hit for chunk (${chunkX}, ${chunkY})`);
    return cached;
  }

  logger.debug(`[Chunk] Cache miss, generating chunk (${chunkX}, ${chunkY})`);

  // Calculate world offset (where this chunk sits in global coordinates)
  const worldOffsetX = chunkX * chunkSize;
  const worldOffsetY = chunkY * chunkSize;

  // IMPORTANT: Use SAME seed + world offset for continuous noise
  const biomeMap = generateBiomeMap({
    seed: roomId, // Same seed as main world for continuity
    width: chunkSize,
    height: chunkSize,
    offsetX: worldOffsetX, // Sample noise at correct world position
    offsetY: worldOffsetY,
    temperatureBias: 0,
    moistureBias: 0,
    continentalnessBias: 0,
    biomeRegionSize: 16, // Even smaller regions for 4x4 chunks
  });

  // For now, chunks don't have structures (structures only in initial map)
  // Future: could generate procedural structures based on chunk seed
  const structures: TerrainChunk['structures'] = [];

  const chunk: TerrainChunk = {
    chunkX,
    chunkY,
    worldOffsetX,
    worldOffsetY,
    biomes: biomeMap.grid,
    structures,
  };

  // Store in cache before returning
  chunkCache.set(cacheKey, chunk);

  return chunk;
}

/**
 * Generate multiple chunks in a region
 * Useful for pre-loading areas or batch generation
 */
export function generateChunkRegion({
  roomId,
  startChunkX,
  startChunkY,
  chunkCountX,
  chunkCountY,
  chunkSize = 4, // Default 4x4 ultra-small chunks
}: {
  roomId: string;
  startChunkX: number;
  startChunkY: number;
  chunkCountX: number;
  chunkCountY: number;
  chunkSize?: number;
}): TerrainChunk[] {
  const chunks: TerrainChunk[] = [];

  for (let cy = startChunkY; cy < startChunkY + chunkCountY; cy++) {
    for (let cx = startChunkX; cx < startChunkX + chunkCountX; cx++) {
      chunks.push(
        generateTerrainChunk({
          roomId,
          chunkX: cx,
          chunkY: cy,
          chunkSize,
        })
      );
    }
  }

  return chunks;
}

/**
 * Clear chunk cache for a specific room or all rooms
 * @param roomId - Optional room ID to clear cache for specific room
 */
export function clearChunkCache(roomId?: string): void {
  if (roomId) {
    // Clear only for specific room
    let cleared = 0;
    for (const key of chunkCache.keys()) {
      if (key.startsWith(`${roomId}:`)) {
        chunkCache.delete(key);
        cleared++;
      }
    }
    logger.info(`[Chunk Cache] Cleared ${cleared} chunks for room ${roomId}`);
  } else {
    // Clear entire cache
    const size = chunkCache.size;
    chunkCache.clear();
    logger.info(`[Chunk Cache] Cleared all ${size} cached chunks`);
  }
}

/**
 * Get cache statistics
 */
export function getChunkCacheStats() {
  return {
    size: chunkCache.size,
    keys: Array.from(chunkCache.keys()).slice(0, 10), // Show first 10 keys
    totalKeys: chunkCache.size,
  };
}
