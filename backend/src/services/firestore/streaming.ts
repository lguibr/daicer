/**
 * Firestore Streaming State Recovery
 * Stores streaming progress for recovery on socket disconnect/reconnect
 */

import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';

/**
 * Streaming state phases
 */
export type StreamPhase =
  | 'initializing'
  | 'world_gen'
  | 'history'
  | 'structures'
  | 'roads'
  | 'terrain'
  | 'chunks'
  | 'character_openings'
  | 'complete'
  | 'error';

/**
 * Stream state schema
 */
export interface StreamState {
  roomId: string;
  phase: StreamPhase;
  accumulatedText: string;
  historyPeriods: number;
  structuresPlaced: number;
  roadsGenerated: number;
  progress: number; // 0-100
  lastUpdate: number;
  error?: string;
}

/**
 * Save streaming state for recovery
 * Called after each major step in world generation
 */
export async function saveStreamState(roomId: string, state: Partial<StreamState>): Promise<void> {
  try {
    const streamDoc = db().collection('streaming_state').doc(roomId);

    const streamState: Partial<StreamState> = {
      ...state,
      roomId,
      lastUpdate: Date.now(),
    };

    await streamDoc.set(streamState, { merge: true });

    logger.debug(`[Streaming] State saved for room ${roomId}`, {
      phase: state.phase,
      progress: state.progress,
    });
  } catch (error) {
    logger.error(`[Streaming] Failed to save state for room ${roomId}:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Retrieve streaming state for recovery
 * Used when socket reconnects during generation
 */
export async function getStreamState(roomId: string): Promise<StreamState | null> {
  try {
    const doc = await db().collection('streaming_state').doc(roomId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as StreamState;

    // Check if state is stale (older than 10 minutes)
    const now = Date.now();
    const age = now - data.lastUpdate;
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (age > maxAge) {
      logger.warn(`[Streaming] State for room ${roomId} is stale (${Math.round(age / 1000)}s old), discarding`);
      await clearStreamState(roomId);
      return null;
    }

    logger.info(`[Streaming] Retrieved state for room ${roomId}`, {
      phase: data.phase,
      progress: data.progress,
      age: Math.round(age / 1000),
    });

    return data;
  } catch (error) {
    logger.error(`[Streaming] Failed to retrieve state for room ${roomId}:`, error);
    return null;
  }
}

/**
 * Clear streaming state after completion or error
 */
export async function clearStreamState(roomId: string): Promise<void> {
  try {
    await db().collection('streaming_state').doc(roomId).delete();
    logger.debug(`[Streaming] State cleared for room ${roomId}`);
  } catch (error) {
    logger.error(`[Streaming] Failed to clear state for room ${roomId}:`, error);
    // Non-critical - don't throw
  }
}

/**
 * Update streaming progress
 * Convenience wrapper for saveStreamState with progress calculation
 */
export async function updateStreamProgress(
  roomId: string,
  phase: StreamPhase,
  additionalData?: Partial<StreamState>
): Promise<void> {
  const progressMap: Record<StreamPhase, number> = {
    initializing: 5,
    world_gen: 20,
    history: 40,
    structures: 60,
    roads: 75,
    terrain: 80,
    chunks: 85,
    character_openings: 95,
    complete: 100,
    error: 0,
  };

  await saveStreamState(roomId, {
    phase,
    progress: progressMap[phase],
    ...additionalData,
  });
}
