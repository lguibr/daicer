/**
 * Chunk Generation Worker
 * Handles CPU-intensive chunk generation in a separate thread
 */

import { generateChunk } from '../services/world-gen/worldGenService.js';
import type { WorldGenerationParams } from '../services/world-gen/worldGenService.js';

export interface ChunkWorkerParams {
  seed: number;
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  params: WorldGenerationParams;
}

/**
 * Generate a single chunk of world data
 * This worker wraps the worldGenService generateChunk function
 */
export default function chunkWorker(workerParams: ChunkWorkerParams) {
  return generateChunk(
    String(workerParams.seed),
    workerParams.chunkX,
    workerParams.chunkY,
    workerParams.chunkZ,
    workerParams.params
  );
}
