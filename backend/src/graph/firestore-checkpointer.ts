/**
 * Firestore-based checkpointer for LangGraph
 * Persists graph state to Firestore for durable execution
 *
 * NOTE: Currently not compatible with latest LangGraph API
 * TODO: Update to new BaseCheckpointSaver interface
 */

import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { getFirestore } from '@/config/firebase';
import { logger } from '@/utils/logger';

/**
 * Firestore checkpointer implementation
 * Stores checkpoints in: rooms/{roomId}/checkpoints/{checkpoint_id}
 */
export class FirestoreCheckpointer extends BaseCheckpointSaver<number> {
  private db = getFirestore();

  /**
   * Save a checkpoint to Firestore
   */
  async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id as string;
    if (!threadId) {
      throw new Error('thread_id required in config.configurable');
    }

    const checkpointId = checkpoint.id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? '';

    try {
      // Store checkpoint in Firestore
      const checkpointRef = this.db.collection('rooms').doc(threadId).collection('checkpoints').doc(checkpointId);

      await checkpointRef.set({
        checkpoint,
        metadata,
        checkpoint_ns: checkpointNs,
        created_at: Date.now(),
      });

      logger.info(`Checkpoint saved: ${threadId}/${checkpointId}`);

      return {
        ...config,
        configurable: {
          ...config.configurable,
          checkpoint_id: checkpointId,
          checkpoint_ns: checkpointNs,
        },
      };
    } catch (error) {
      logger.error('Error saving checkpoint:', error);
      throw error;
    }
  }

  /**
   * Get a specific checkpoint tuple from Firestore (new API)
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id as string;
    if (!threadId) {
      return undefined;
    }

    const checkpointId = config.configurable?.checkpoint_id as string | undefined;
    const checkpointNs = config.configurable?.checkpoint_ns ?? '';

    try {
      if (checkpointId) {
        // Get specific checkpoint
        const checkpointRef = this.db.collection('rooms').doc(threadId).collection('checkpoints').doc(checkpointId);

        const doc = await checkpointRef.get();

        if (!doc.exists) {
          return undefined;
        }

        const data = doc.data();
        if (!data) return undefined;

        return {
          config: {
            ...config,
            configurable: {
              ...config.configurable,
              checkpoint_id: checkpointId,
              checkpoint_ns: data.checkpoint_ns,
            },
          },
          checkpoint: data.checkpoint,
          metadata: data.metadata,
          parentConfig: data.parent_config,
        };
      }
      // Get latest checkpoint
      const checkpointsRef = this.db
        .collection('rooms')
        .doc(threadId)
        .collection('checkpoints')
        .where('checkpoint_ns', '==', checkpointNs)
        .orderBy('created_at', 'desc')
        .limit(1);

      const snapshot = await checkpointsRef.get();

      if (snapshot.empty) {
        return undefined;
      }

      const doc = snapshot.docs[0];
      if (!doc) return undefined;
      const data = doc.data();

      return {
        config: {
          ...config,
          configurable: {
            ...config.configurable,
            checkpoint_id: doc.id,
            checkpoint_ns: data.checkpoint_ns,
          },
        },
        checkpoint: data.checkpoint as Checkpoint,
        metadata: data.metadata,
        parentConfig: data.parent_config,
      };
    } catch (error) {
      logger.error('Error retrieving checkpoint:', error);
      return undefined;
    }
  }

  /**
   * Delete a thread and all its checkpoints
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      const checkpointsRef = this.db.collection('rooms').doc(threadId).collection('checkpoints');
      const snapshot = await checkpointsRef.get();

      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);

      logger.info(`Deleted thread: ${threadId}`);
    } catch (error) {
      logger.error('Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Get checkpoint history for a thread
   */
  async *list(
    config: RunnableConfig,
    options?: { limit?: number; before?: RunnableConfig }
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id as string;
    if (!threadId) {
      return;
    }

    const checkpointNs = config.configurable?.checkpoint_ns ?? '';

    try {
      let query = this.db
        .collection('rooms')
        .doc(threadId)
        .collection('checkpoints')
        .where('checkpoint_ns', '==', checkpointNs)
        .orderBy('created_at', 'desc');

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.before) {
        const beforeCheckpointId = options.before.configurable?.checkpoint_id as string;
        if (beforeCheckpointId) {
          const beforeDoc = await this.db
            .collection('rooms')
            .doc(threadId)
            .collection('checkpoints')
            .doc(beforeCheckpointId)
            .get();

          if (beforeDoc.exists) {
            const beforeData = beforeDoc.data();
            if (beforeData) {
              query = query.where('created_at', '<', beforeData.created_at);
            }
          }
        }
      }

      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        yield {
          config: {
            ...config,
            configurable: {
              ...config.configurable,
              checkpoint_id: doc.id,
              checkpoint_ns: data.checkpoint_ns,
            },
          },
          checkpoint: data.checkpoint,
          metadata: data.metadata,
          parentConfig: data.parent_config,
        };
      }
    } catch (error) {
      logger.error('Error listing checkpoints:', error);
    }
  }

  /**
   * Put writes (not used in current implementation)
   */
  async putWrites(): Promise<void> {
    // Not implemented - writes are bundled with checkpoints
    logger.debug('putWrites called (not implemented)');
  }
}
