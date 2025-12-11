import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';
import { DocumentReference } from 'firebase-admin/firestore';

export interface BatchAction {
  type: 'set' | 'update' | 'delete';
  ref: DocumentReference;
  data?: any;
}

export class ActionBatcher {
  private static instance: ActionBatcher;
  private batches: Map<string, BatchAction[]> = new Map();

  private constructor() {}

  public static getInstance(): ActionBatcher {
    if (!ActionBatcher.instance) {
      ActionBatcher.instance = new ActionBatcher();
    }
    return ActionBatcher.instance;
  }

  /**
   * Add an action to the batch for a specific room
   */
  public add(roomId: string, action: BatchAction) {
    if (!this.batches.has(roomId)) {
      this.batches.set(roomId, []);
    }
    this.batches.get(roomId)!.push(action);
  }

  /**
   * Commit all pending actions for a room
   */
  public async commit(roomId: string): Promise<void> {
    const actions = this.batches.get(roomId);
    if (!actions || actions.length === 0) return;

    const MAX_BATCH_SIZE = 500;

    // Split into chunks of 500 if necessary
    const chunks = [];
    for (let i = 0; i < actions.length; i += MAX_BATCH_SIZE) {
      chunks.push(actions.slice(i, i + MAX_BATCH_SIZE));
    }

    logger.info(`[ActionBatcher] Committing ${actions.length} actions for room ${roomId} in ${chunks.length} batches.`);

    for (const chunk of chunks) {
      const currentBatch = db().batch();
      for (const action of chunk) {
        if (action.type === 'set' && action.data) {
          currentBatch.set(action.ref, action.data);
        } else if (action.type === 'update' && action.data) {
          currentBatch.update(action.ref, action.data);
        } else if (action.type === 'delete') {
          currentBatch.delete(action.ref);
        }
      }
      await currentBatch.commit();
    }

    // Clear queue
    this.batches.delete(roomId);
  }

  /**
   * Clear batch without committing (rollback/cleanup)
   */
  public clear(roomId: string) {
    this.batches.delete(roomId);
  }
}

export const actionBatcher = ActionBatcher.getInstance();
