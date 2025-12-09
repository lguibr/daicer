/**
 * Firestore World Storage Service
 * Manages permanent caching of generated worlds with history, structures, and terrain
 */

import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';

/**
 * World history schema
 */
export interface WorldHistory {
  overallSummary: string;
  periods: Array<{
    name: string;
    yearStart: number;
    yearEnd: number;
    description: string;
    keyEvents: string[];
    structures: Structure[];
  }>;
}

/**
 * Structure schema
 */
export interface Structure {
  id: string;
  name: string;
  type: string;
  size: string;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  significance: number;
  era?: string;
  description?: string;
}

/**
 * Road schema
 */
export interface Road {
  id: string;
  startStructureId: string;
  endStructureId: string;
  quality: string;
  waypoints: Array<{ x: number; y: number }>;
}

/**
 * Complete world data schema
 */
export interface WorldData {
  id: string;
  name: string;
  roomId?: string; // Optional link to game room
  worldDescription: string;
  worldHistory: WorldHistory | null;
  structures: Structure[];
  roads: Road[];
  terrain: {
    width: number;
    height: number;
    heightmap?: number[][];
    biomes?: string[][];
  };
  settings?: {
    theme: string;
    setting: string;
    tone: string;
    historyDepth?: number;
    eraCount?: number;
  };
  createdAt: number;
  updatedAt?: number;
  createdBy: string;
}

/**
 * Save world data to Firestore
 * Caches the complete generated world for later retrieval
 */
export async function saveWorldData(roomId: string, data: Partial<WorldData>): Promise<void> {
  try {
    const worldDoc = db().collection('worlds').doc(roomId);

    const worldData: Partial<WorldData> = {
      ...data,
      id: roomId,
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await worldDoc.set(worldData, { merge: true });

    logger.info(`World data saved for room ${roomId}`, {
      hasHistory: !!data.worldHistory,
      structureCount: data.structures?.length || 0,
      roadCount: data.roads?.length || 0,
    });
  } catch (error) {
    logger.error(`Failed to save world data for room ${roomId}:`, error);
    throw new Error('Failed to save world data');
  }
}

/**
 * Retrieve world data from Firestore
 */
export async function getWorldData(roomId: string): Promise<WorldData | null> {
  try {
    const worldDoc = await db().collection('worlds').doc(roomId).get();

    if (!worldDoc.exists) {
      logger.warn(`No world data found for room ${roomId}`);
      return null;
    }

    return worldDoc.data() as WorldData;
  } catch (error) {
    logger.error(`Failed to retrieve world data for room ${roomId}:`, error);
    throw new Error('Failed to retrieve world data');
  }
}

/**
 * List all worlds created by a user
 */
export async function listUserWorlds(userId: string, limit = 50): Promise<WorldData[]> {
  try {
    const snapshot = await db()
      .collection('worlds')
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const worlds: WorldData[] = [];
    snapshot.forEach((doc) => {
      worlds.push(doc.data() as WorldData);
    });

    logger.info(`Retrieved ${worlds.length} worlds for user ${userId}`);
    return worlds;
  } catch (error) {
    logger.error(`Failed to list worlds for user ${userId}:`, error);
    throw new Error('Failed to list user worlds');
  }
}

/**
 * Delete world data
 */
export async function deleteWorldData(roomId: string): Promise<void> {
  try {
    await db().collection('worlds').doc(roomId).delete();
    logger.info(`World data deleted for room ${roomId}`);
  } catch (error) {
    logger.error(`Failed to delete world data for room ${roomId}:`, error);
    throw new Error('Failed to delete world data');
  }
}

/**
 * Update world data (partial update)
 */
export async function updateWorldData(roomId: string, updates: Partial<WorldData>): Promise<void> {
  try {
    await db().collection('worlds').doc(roomId).update(updates);

    logger.info(`World data updated for room ${roomId}`);
  } catch (error) {
    logger.error(`Failed to update world data for room ${roomId}:`, error);
    throw new Error('Failed to update world data');
  }
}
/**
 * Helper: Fetch structures directly from room subcollection
 * avoiding circular dependency with structures.ts
 */
async function fetchStructuresDirectly(roomId: string): Promise<Structure[]> {
  try {
    const snapshot = await db().collection('rooms').doc(roomId).collection('structures').get();

    if (snapshot.empty) return [];

    const structures: Structure[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      structures.push({
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        significance: data.significance,
        era: data.era,
        description: data.description,
        position: {
          x: data.x,
          y: data.y,
        },
      } as Structure);
    });
    return structures;
  } catch (err) {
    logger.error('Error fetching structures directly in worlds.ts:', err);
    return [];
  }
}

/**
 * Get a text description of the map context for LLM consumption
 * @param roomId - Room ID
 * @param center - Optional center point for local context
 * @param radius - Radius to search (default 50)
 */
export async function getMapContext(
  roomId: string,
  center?: { x: number; y: number },
  radius: number = 50
): Promise<string> {
  const worldData = await getWorldData(roomId);
  if (!worldData) return 'No map data available.';

  // repair/active-fetch: if structures are empty, try to fetch from room
  let structures = worldData.structures || [];
  if (structures.length === 0) {
    const missingStructures = await fetchStructuresDirectly(roomId);
    if (missingStructures.length > 0) {
      structures = missingStructures;
      // Self-heal: update the world data asynchronously
      saveWorldData(roomId, { structures }).catch((e) => logger.warn('Failed to self-heal world structures:', e));
    }
  }

  let context = `WORLD MAP CONTEXT:\n`;

  // 1. Structures
  const relevantStructures = structures.filter((s) => {
    if (!center) return true; // Global context
    const dx = s.position.x - center.x;
    const dy = s.position.y - center.y;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  });

  if (relevantStructures.length > 0) {
    context += `\nSTRUCTURES (within ${center ? radius : 'all'} units):\n`;
    relevantStructures.forEach((s) => {
      const dist = center
        ? Math.round(Math.sqrt(Math.pow(s.position.x - center.x, 2) + Math.pow(s.position.y - center.y, 2)))
        : 0;
      context += `- ${s.name} (${s.type}): ${s.description || 'No description'} [${dist} units away]\n`;
    });
  } else {
    context += `\nNo major structures nearby.\n`;
  }

  // 2. Terrain / Biomes (Simplified)
  // If we have a center, describe the biome at that location
  if (center && worldData.terrain.biomes) {
    const x = Math.round(center.x);
    const y = Math.round(center.y);
    if (
      x >= 0 &&
      x < worldData.terrain.width &&
      y >= 0 &&
      y < worldData.terrain.height &&
      worldData.terrain.biomes[y] &&
      worldData.terrain.biomes[y][x]
    ) {
      context += `\nCURRENT BIOME: ${worldData.terrain.biomes[y][x]}\n`;
    }
  }

  return context;
}
