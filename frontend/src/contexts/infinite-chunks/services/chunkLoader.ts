/**
 * Chunk Loader Service
 * Handles loading chunks from backend API or client-side generator
 * NO WebSocket - simple REST API only
 */

import type { GlobalPlacementMap } from '@daicer/shared/world-gen/structures';
import { auth } from '../../../services/firebase';
import type { TerrainChunk, ChunkGenerator, InfiniteChunksConfig } from '../types';
import { getStructuresForChunk, stampStructureOnChunk } from './structureGenerator';
import { getChunkKey } from './gridExpander';

const CHUNK_BOUNDS = 8192; // ±8192 chunks = ~32k tiles radius with 4x4 chunks

/**
 * Loads a chunk from backend API or generator
 */
export async function loadChunk(
  chunkX: number,
  chunkY: number,
  config: InfiniteChunksConfig,
  chunkGenerator?: ChunkGenerator,
  placementMap?: GlobalPlacementMap | null
): Promise<TerrainChunk> {
  const { chunkSize, mode, roomId } = config;
  const worldX = chunkX * chunkSize;
  const worldY = chunkY * chunkSize;

  // CLIENT-SIDE GENERATION (debug mode)
  if (mode === 'generator' && chunkGenerator) {
    // Generate base terrain
    const chunkBiomes = chunkGenerator.generateChunk(worldX, worldY, chunkSize, chunkSize);

    // Get structures that overlap this chunk
    const structures = getStructuresForChunk(
      placementMap || null,
      worldX,
      worldY,
      chunkSize,
      roomId // Use roomId as seed
    );

    // Stamp structures onto chunk
    let finalBiomes = chunkBiomes;
    for (const structure of structures) {
      finalBiomes = stampStructureOnChunk(finalBiomes, structure, worldX, worldY);
    }

    return {
      chunkX,
      chunkY,
      worldOffsetX: worldX,
      worldOffsetY: worldY,
      biomes: finalBiomes,
      structures: structures.map((s) => ({
        name: s.name,
        type: s.type,
        x: s.worldX,
        y: s.worldY,
        material: s.material,
      })),
    };
  }

  // BACKEND API FETCH (game mode)
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  const layer = config.layer || 0;
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/grid/chunk/${roomId}/${chunkX}/${chunkY}/${layer}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to load chunk: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Invalid chunk response from backend');
  }

  return result.data;
}

/**
 * Determines which chunks need to be loaded based on player position
 * Returns chunks sorted by distance (closest first)
 */
export function getChunksToLoad(
  playerX: number,
  playerY: number,
  chunkSize: number,
  loadRadius: number,
  loadedChunks: Set<string>,
  loadingChunks: Set<string>
): Array<{ chunkX: number; chunkY: number; distance: number }> {
  const playerChunkX = Math.floor(playerX / chunkSize);
  const playerChunkY = Math.floor(playerY / chunkSize);

  const chunksToLoad: Array<{ chunkX: number; chunkY: number; distance: number }> = [];

  // Check chunks in a circular pattern around player
  for (let dy = -loadRadius; dy <= loadRadius; dy++) {
    for (let dx = -loadRadius; dx <= loadRadius; dx++) {
      const chunkX = playerChunkX + dx;
      const chunkY = playerChunkY + dy;

      // Skip chunks outside world bounds
      if (Math.abs(chunkX) > CHUNK_BOUNDS || Math.abs(chunkY) > CHUNK_BOUNDS) {
        continue;
      }

      const chunkKey = getChunkKey(chunkX, chunkY);

      // Skip if already loaded or loading
      if (loadedChunks.has(chunkKey) || loadingChunks.has(chunkKey)) {
        continue;
      }

      // Calculate distance from player chunk
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only load within circular radius (not square)
      if (distance <= loadRadius) {
        chunksToLoad.push({ chunkX, chunkY, distance });
      }
    }
  }

  // Sort by distance (closest first)
  chunksToLoad.sort((a, b) => a.distance - b.distance);

  return chunksToLoad;
}

/**
 * Gets the maximum number of concurrent chunk loads
 */
export function getMaxConcurrentLoads(): number {
  return 8; // Load up to 8 chunks at a time
}
