/**
 * Chunk Pre-Generator Service
 * Pre-generates critical grid chunks during world generation
 * Uses collapse data from structures + roads to influence terrain
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import type { Road } from '@daicer/shared/world/road-schema';
import { getWorkerPool } from '@/workers/workerPool';
import { logger } from '@/utils/logger';
import { getDb } from '@/config/firebase';

const CHUNK_SIZE = 32; // 32x32 tiles per chunk
const TILES_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;

interface CollapseData {
  influences: Array<{
    x: number;
    y: number;
    radius: number;
    strength: number;
    type: 'structure' | 'road';
  }>;
}

interface CachedChunk {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  tiles: Array<{
    x: number;
    y: number;
    z: number;
    elevation: number;
    biome: string;
    temperature: number;
    moisture: number;
  }>;
}

/**
 * Calculate which chunks contain or are near structures
 */
function getStructureChunks(structures: Structure[]): Array<{ x: number; y: number }> {
  const chunkSet = new Set<string>();

  for (const structure of structures) {
    const { x, y, width = 32, height = 32 } = structure;

    // Calculate chunk coordinates
    const startChunkX = Math.floor(x / CHUNK_SIZE);
    const endChunkX = Math.floor((x + width) / CHUNK_SIZE);
    const startChunkY = Math.floor(y / CHUNK_SIZE);
    const endChunkY = Math.floor((y + height) / CHUNK_SIZE);

    // Add all chunks this structure overlaps
    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      for (let cy = startChunkY; cy <= endChunkY; cy++) {
        chunkSet.add(`${cx},${cy}`);
      }
    }
  }

  return Array.from(chunkSet).map((key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });
}

/**
 * Calculate which chunks contain roads
 */
function getRoadChunks(roads: Road[]): Array<{ x: number; y: number }> {
  const chunkSet = new Set<string>();

  for (const road of roads) {
    // Roads have path array of points
    for (const point of road.path || []) {
      const chunkX = Math.floor(point.x / CHUNK_SIZE);
      const chunkY = Math.floor(point.y / CHUNK_SIZE);
      chunkSet.add(`${chunkX},${chunkY}`);
    }
  }

  return Array.from(chunkSet).map((key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });
}

/**
 * Pre-generate critical chunks around structures and roads
 */
export async function preGenerateChunks(
  roomId: string,
  structures: Structure[],
  roads: Road[],
  collapseData: CollapseData,
  worldParams: {
    seed: string;
    width: number;
    height: number;
    depth: number;
    waterLevel?: number;
    mountainousness?: number;
    jaggedness?: number;
    temperature?: number;
    moisture?: number;
  },
  writer?: (event: any) => void
): Promise<CachedChunk[]> {
  logger.info('[ChunkPreGen] Starting chunk pre-generation');

  const workerPool = getWorkerPool();
  const cachedChunks: CachedChunk[] = [];

  // 1. Get spawn area chunk (center of map at z=0)
  const spawnChunkX = Math.floor(worldParams.width / 2 / CHUNK_SIZE);
  const spawnChunkY = Math.floor(worldParams.height / 2 / CHUNK_SIZE);
  const spawnChunk = { x: spawnChunkX, y: spawnChunkY };

  // 2. Get chunks containing structures
  const structureChunks = getStructureChunks(structures);

  // 3. Get chunks containing roads
  const roadChunks = getRoadChunks(roads);

  // Combine and deduplicate
  const allChunkCoords = [spawnChunk, ...structureChunks, ...roadChunks];

  const uniqueChunks = Array.from(new Set(allChunkCoords.map((c) => `${c.x},${c.y}`))).map((key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });

  logger.info(`[ChunkPreGen] Generating ${uniqueChunks.length} critical chunks`);

  // Generate chunks at ground level (z=0) using worker pool
  let completedCount = 0;

  for (const { x, y } of uniqueChunks) {
    try {
      const chunk = await workerPool.run({
        seed: worldParams.seed,
        chunkX: x,
        chunkY: y,
        chunkZ: 0, // Ground level
        params: worldParams,
        collapseData, // Pass collapse influences
      });

      if (chunk && chunk.tiles) {
        cachedChunks.push({
          chunkX: x,
          chunkY: y,
          chunkZ: 0,
          tiles: chunk.tiles,
        });

        completedCount++;

        // Emit progress event
        if (writer) {
          writer({
            type: 'chunk_generated',
            chunkX: x,
            chunkY: y,
            chunkZ: 0,
            completed: completedCount,
            total: uniqueChunks.length,
          });
        }
      }
    } catch (error) {
      logger.error(`[ChunkPreGen] Failed to generate chunk (${x}, ${y}):`, error);
    }
  }

  logger.info(`[ChunkPreGen] Generated ${cachedChunks.length} chunks successfully`);

  // Cache chunks in Firestore
  await cacheChunksInFirestore(roomId, cachedChunks);

  return cachedChunks;
}

/**
 * Cache chunks in Firestore for fast room loading
 */
async function cacheChunksInFirestore(roomId: string, chunks: CachedChunk[]): Promise<void> {
  const db = getDb();
  const batch = db.batch();

  for (const chunk of chunks) {
    const chunkId = `${chunk.chunkX}_${chunk.chunkY}_${chunk.chunkZ}`;
    const chunkRef = db.collection('rooms').doc(roomId).collection('chunks').doc(chunkId);

    batch.set(chunkRef, {
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      chunkZ: chunk.chunkZ,
      tileCount: chunk.tiles.length,
      tiles: chunk.tiles,
      createdAt: Date.now(),
    });
  }

  await batch.commit();

  logger.info(`[ChunkPreGen] Cached ${chunks.length} chunks in Firestore`);
}
