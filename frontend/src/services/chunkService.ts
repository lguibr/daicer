/**
 * Chunk Loading Service
 * Handles fetching and caching of terrain chunks
 */

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TerrainTile {
  x: number;
  y: number;
  z: number;
  elevation: number;
  biome: string;
  temperature?: number;
  moisture?: number;
  isCave?: boolean;
  isOre?: boolean;
}

export interface TerrainChunk {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  tiles: TerrainTile[];
}

// Client-side chunk cache
const chunkCache = new Map<string, TerrainChunk>();

/**
 * Get cache key for a chunk
 */
function getChunkKey(roomId: string, chunkX: number, chunkY: number, chunkZ: number): string {
  return `${roomId}:${chunkX}_${chunkY}_${chunkZ}`;
}

/**
 * Fetch chunk from Firestore cache
 */
async function fetchCachedChunk(
  roomId: string,
  chunkX: number,
  chunkY: number,
  chunkZ: number
): Promise<TerrainChunk | null> {
  try {
    const db = getFirestore();
    const chunkId = `${chunkX}_${chunkY}_${chunkZ}`;
    const chunkRef = doc(db, 'rooms', roomId, 'chunks', chunkId);
    const chunkDoc = await getDoc(chunkRef);

    if (!chunkDoc.exists()) {
      return null;
    }

    const data = chunkDoc.data();
    return {
      chunkX: data.chunkX,
      chunkY: data.chunkY,
      chunkZ: data.chunkZ,
      tiles: data.tiles,
    };
  } catch (error) {
    console.error(`Failed to fetch cached chunk (${chunkX}, ${chunkY}, ${chunkZ}):`, error);
    return null;
  }
}

/**
 * Generate chunk on-demand via API
 */
async function generateChunkViaAPI(
  roomId: string,
  chunkX: number,
  chunkY: number,
  chunkZ: number
): Promise<TerrainChunk> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}/api/assets-gen/worlds/${roomId}/chunks/${chunkX}/${chunkY}/${chunkZ}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate chunk: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch a terrain chunk (with caching)
 * @param roomId - Room ID (used as world ID)
 * @param chunkX - Chunk X coordinate
 * @param chunkY - Chunk Y coordinate
 * @param chunkZ - Chunk Z coordinate (layer: -16 to +16)
 * @returns Terrain chunk with tiles
 */
export async function fetchChunk(
  roomId: string,
  chunkX: number,
  chunkY: number,
  chunkZ: number
): Promise<TerrainChunk> {
  const key = getChunkKey(roomId, chunkX, chunkY, chunkZ);

  // 1. Check client cache
  if (chunkCache.has(key)) {
    return chunkCache.get(key)!;
  }

  // 2. Try Firestore cache
  const cached = await fetchCachedChunk(roomId, chunkX, chunkY, chunkZ);
  if (cached) {
    chunkCache.set(key, cached);
    return cached;
  }

  // 3. Generate on-demand via API
  console.log(`Cache miss for chunk (${chunkX}, ${chunkY}, ${chunkZ}), generating...`);
  const generated = await generateChunkViaAPI(roomId, chunkX, chunkY, chunkZ);
  chunkCache.set(key, generated);
  return generated;
}

/**
 * Clear chunk cache for a room
 */
export function clearChunkCache(roomId?: string): void {
  if (roomId) {
    // Clear only for specific room
    for (const key of chunkCache.keys()) {
      if (key.startsWith(`${roomId}:`)) {
        chunkCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    chunkCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getChunkCacheStats() {
  return {
    size: chunkCache.size,
    keys: Array.from(chunkCache.keys()),
  };
}
