/**
 * Chunk Loader Service
 * Handles loading chunks from backend API or client-side generator
 * NO WebSocket - simple REST API only
 */

import type { GlobalPlacementMap } from '@daicer/shared/world-gen/structures';
import type { GridTile } from '@daicer/shared/world';
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

  try {
    console.log(`[ChunkLoader] Loading chunk ${chunkX},${chunkY} (mode: ${mode})`);

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

      const tiles: GridTile[][] = finalBiomes.map((row, y) =>
        row.map(
          (biome, x) =>
            ({
              x: worldX + x,
              y: worldY + y,
              z: 0,
              biome,
              blockType: 'grass',
              lightLevel: 15,
            }) as GridTile
        )
      );

      const result: TerrainChunk = {
        chunkX,
        chunkY,
        worldOffsetX: worldX,
        worldOffsetY: worldY,
        biomes: finalBiomes,
        tiles,
        seed: roomId,
        z: 0,
        generated: true,
        hasStructure: structures.length > 0,
        hasCave: false,
        isStartingArea: chunkX === 0 && chunkY === 0,
        features: [],
        structures: structures.map((s) => ({
          name: s.name,
          type: s.type,
          x: s.worldX,
          y: s.worldY,
          rotation: 0,
          floor: 0,
          material: s.material,
        })),
      };
      console.log(`[ChunkLoader] Generated chunk data for ${chunkX},${chunkY}:`, result);
      return result;
    }

    // BACKEND API FETCH (game mode)
    // BACKEND API FETCH (game mode)
    // Use Strapi JWT instead of Firebase auth
    const token = localStorage.getItem('strapi_jwt');
    if (!token && !auth.currentUser) {
      console.warn('[ChunkLoader] No authentication token found');
      // We might want to throw, but for now let's try or return dummy
      // throw new Error('User not authenticated');
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
    const url = `${apiUrl}/api/terrain/chunk`;
    console.log(`[ChunkLoader] Fetching chunk via POST: ${url} for ${chunkX},${chunkY}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomId, // This should be the documentId now
        chunkX,
        chunkY,
        chunkSize,
      }),
    });

    if (!response.ok) {
      console.error(`[ChunkLoader] Failed to load chunk: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load chunk: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      console.error('[ChunkLoader] Invalid chunk response:', result);
      throw new Error('Invalid chunk response from backend');
    }

    // Return the raw chunk data (validated by schema in a real app)
    // The frontend will now consume GridTile[] directly
    const { data } = result;
    console.log(`[ChunkLoader] Backend response for ${chunkX},${chunkY}:`, {
      hasTiles: !!data.tiles, // Legacy check
      hasBiomes: !!data.biomes,
      biomesLength: data.biomes?.length,
      worldOffset: { x: data.worldOffsetX, y: data.worldOffsetY },
    });

    // Ensure worldOffsetX/Y are present (backend might omit them)
    const chunk: TerrainChunk = {
      ...data,
      chunkX,
      chunkY,
      worldOffsetX: data.worldOffsetX ?? worldX,
      worldOffsetY: data.worldOffsetY ?? worldY,
    };

    return chunk;
  } catch (error) {
    console.error(`[ChunkLoader] Error loading chunk ${chunkX},${chunkY}:`, error);
    throw error;
  }
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
