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
