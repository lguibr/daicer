import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';

export interface ContextState {
  roomId: string;
  narrativeSummary: string;
  lastProcessedTurn: number;
}

export class ContextManager {
  private static instance: ContextManager;

  private constructor() {}

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Get the current narrative summary for a room
   */
  async getSummary(roomId: string): Promise<string> {
    const doc = await db().collection('rooms').doc(roomId).collection('system_states').doc('context').get();
    if (!doc.exists) return '';
    return (doc.data() as ContextState).narrativeSummary || '';
  }

  /**
   * Update the narrative summary
   */
  async updateSummary(roomId: string, summary: string, turnCount: number) {
    logger.info(`[ContextManager] Updating summary for room ${roomId} at turn ${turnCount}`);
    await db()
      .collection('rooms')
      .doc(roomId)
      .collection('system_states')
      .doc('context')
      .set({ roomId, narrativeSummary: summary, lastProcessedTurn: turnCount }, { merge: true });
  }

  /**
   * Helper: Construct the LLM Context Prompt
   * Combines static world desc + dynamic summary
   */
  buildContextPrompt(worldDescription: string, summary: string): string {
    if (!summary) return worldDescription;
    return `${worldDescription}\n\n=== PREVIOUSLY ===\n${summary}`;
  }
}

export const contextManager = ContextManager.getInstance();
