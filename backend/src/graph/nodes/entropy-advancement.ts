/**
 * Entropy Advancement Node
 * Automatically advances world conditions based on turn progression
 */

import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { entropyEngine } from '@/services/entropy/engine';
import type { GameplayState } from '../state';

/**
 * Task: Advance entropy with deterministic randomness
 * Wrapped in task() for checkpointing and replay
 */
const advanceEntropyTask = task(
  'advanceEntropy',
  async (params: {
    roomId: string;
    intensity: number;
    currentTurn: number;
  }): Promise<{
    mutations: boolean; // Just a flag, engine updates DB directly now
    stateSummary: any;
  }> => {
    logger.info(`[Entropy] Advancing entropy for turn ${params.currentTurn}`);
    const newState = await entropyEngine.advanceTurn(params.roomId, params.intensity);
    return { mutations: true, stateSummary: newState };
  }
);

/**
 * Entropy advancement node (wrapped with tracing)
 * Processes entropy changes based on turn progression
 */
export const entropyAdvancementNode = async (state: GameplayState): Promise<Partial<GameplayState>> => {
  const currentTurn = (state.currentTurn || 0) + 1;

  // Use new engine logic
  // Intensity could be derived from last action, defaulting to 1 for now
  // Advance entropy
  await advanceEntropyTask({
    roomId: state.roomId,
    intensity: 1, // Default intensity
    currentTurn,
  });

  // The engine updates DB independently.
  // We can fetch the latest state or just assume it's done.
  // Ideally, we'd read back the logs to put into eventLog, but for Phase 2 MVP
  // we just return the updated turn count.
  // The 'eventsLog' in GameplayState might be legacy or redundant with Engine history.
  // Let's keep it minimal.

  return {
    currentTurn,
    // worldConditions: ... // We might need to map Engine 'currentCondition' back to this if frontend needs it
  };
};
