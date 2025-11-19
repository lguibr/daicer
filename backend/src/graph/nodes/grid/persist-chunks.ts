/**
 * Persist Chunks Node
 * Saves generated chunks to Firestore
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { getFirestore } from 'firebase-admin/firestore';
import type { CharacterCreationState } from '../../state';

/**
 * Persist chunks to Firestore
 * Saves in batches for efficiency
 */
export const persistChunksNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, gridWorld } = state;

  if (!gridWorld || !gridWorld.chunks) {
    throw new Error('[persist_chunks] No chunks to persist');
  }

  logger.info('[persist_chunks] Persisting chunks to Firestore', {
    roomId,
    chunkCount: gridWorld.chunks.length,
  });

  const db = getFirestore();
  const chunkCollection = db.collection('rooms').doc(roomId).collection('grid_chunks');

  // Batch write (Firestore limit: 500 per batch)
  const batchSize = 500;
  const chunks = gridWorld.chunks;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = db.batch();
    const batchChunks = chunks.slice(i, i + batchSize);

    for (const chunk of batchChunks) {
      const chunkId = `${chunk.chunkX}_${chunk.chunkY}_${chunk.z}`;
      const docRef = chunkCollection.doc(chunkId);
      batch.set(docRef, chunk);
    }

    await batch.commit();
    logger.debug(`[persist_chunks] Persisted batch ${i / batchSize + 1}`, {
      count: batchChunks.length,
    });
  }

  logger.info('[persist_chunks] All chunks persisted', {
    totalChunks: chunks.length,
  });

  return {
    worldGenProgress: {
      phase: 'complete',
      error: null,
      retryCount: 0,
    },
  };
};
