/**
 * Chunk Loader Service
 * Handles loading chunks from backend API or client-side generator
 * NO WebSocket - simple REST API only
 */

import type { GridTile, ChunkDTO } from '@daicer/shared';

import { gql } from '@apollo/client';
import { apolloClient } from '../../../lib/apollo';
import type { TerrainChunk, InfiniteChunksConfig } from '../types';
// import { TerrainAPI } from '../../../api/TerrainAPI'; // Deprecated in favor of GraphQL
import { useTerrainStore } from '../../../stores/useTerrainStore';

import { getChunkKey } from './gridExpander';

const CHUNK_BOUNDS = 8192; // ±8192 chunks = ~32k tiles radius with 4x4 chunks

/**
 * Loads a chunk from backend API or generator
 */
export async function loadChunk(
  chunkX: number,
  chunkY: number,
  config: InfiniteChunksConfig
  // chunkGenerator, // Removed
  // placementMap // Removed
): Promise<TerrainChunk> {
  const { chunkSize, mode, roomId } = config;
  const worldX = chunkX * chunkSize;
  const worldY = chunkY * chunkSize;

  try {
    console.log(`[ChunkLoader] Loading chunk ${chunkX},${chunkY} (mode: ${mode})`);

    // GRAPHQL API FETCH (game mode)
    // We use standard Strapi GraphQL mutation for chunk generation/fetching
    // "generator" mode is strictly forbidden now to force backend parity.
    if (mode === 'generator') {
      console.warn('[ChunkLoader] Generator mode is deprecated/removed. Falling back to backend.');
    }

    // GRAPHQL API FETCH (game mode)
    // We use standard Strapi GraphQL mutation for chunk generation/fetching
    const GENERATE_CHUNK_MUTATION = gql`
      mutation GenerateTerrainChunk($roomId: ID!, $chunkX: Int!, $chunkY: Int!) {
        generateTerrainChunk(roomId: $roomId, chunkX: $chunkX, chunkY: $chunkY)
      }
    `;

    const response = await apolloClient.mutate<{ generateTerrainChunk: ChunkDTO }>({
      mutation: GENERATE_CHUNK_MUTATION,
      variables: {
        roomId,
        chunkX,
        chunkY,
      },
      context: {
        headers: {
          Authorization: config.token ? `Bearer ${config.token}` : '',
        },
      },
      fetchPolicy: 'no-cache', // Ensure we always get fresh data if needed, or rely on apollo cache?
    });

    const chunkData = response.data?.generateTerrainChunk as ChunkDTO;
    if (!chunkData) throw new Error('No data returned from GraphQL');

    // SIDE EFFECT: Update the global Zustand store for new components
    useTerrainStore.getState().setChunk(chunkX, chunkY, chunkData);

    // Map ChunkDTO (grid: GridTile[][][]) to TerrainChunk (tiles: GridTile[][], biomes: string[][])
    // The TerrainExplorer (Legacy) primarily looks at layer 0 (surface?).
    // In our 3D grid, surface is floor 3 (z=0).
    // TerrainExplorer expects "tiles" to be 2D array of GridTile.

    // ChunkDTO: grid from shared is [floor][y][x]
    const grid3D = chunkData.grid;
    const surfaceLayer = grid3D[3] || []; // Floor 3 is Z=0

    // Safely map surface layer to GridTiles
    const tiles: GridTile[][] = Array(chunkSize)
      .fill(null)
      .map((_row, y) =>
        Array(chunkSize)
          .fill(null)
          .map((_col, x) => {
            const tileRaw = surfaceLayer[y]?.[x];
            return {
              x: worldX + x,
              y: worldY + y,
              z: 0,
              biome: tileRaw?.b || 'plains',
              blockType: tileRaw?.t || 'grass',
              // Default light
              lightLevel: 15,
            } as GridTile;
          })
      );

    // Create biomes 2D array (legacy)
    const biomes: string[][] = tiles.map((row) => row.map((t) => t.biome));

    const chunk: TerrainChunk = {
      chunkX,
      chunkY,
      worldOffsetX: worldX,
      worldOffsetY: worldY,
      tiles,
      biomes,
      structures: [], // TODO: Structure metadata if needed
      features: [],
      // Legacy flags
      hasCave: false,
      hasStructure: false,
      generated: false,
      isStartingArea: chunkX === 0 && chunkY === 0,
      seed: roomId,
      z: 0,
      grid: chunkData.grid, // Pass 3D grid
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
