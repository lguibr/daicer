/**
 * Entropy Advancement Node
 * Automatically advances world conditions based on turn progression
 */

import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { advanceTurn } from '@/services/entropy/engine';
import type { WorldCondition, RandomEvent } from '@/services/entropy/types';
import type { GameplayState } from '../state';

/**
 * Task: Advance entropy with deterministic randomness
 * Wrapped in task() for checkpointing and replay
 */
const advanceEntropyTask = task(
  'advanceEntropy',
  async (params: {
    currentConditions: WorldCondition[];
    currentTurn: number;
    seed: number;
    duration?: string;
  }): Promise<{
    mutation?: { key: string; newValue: string; reason: string };
    newEvent?: { name: string; description: string; impact: string };
  }> => {
    logger.info(`[Entropy] Advancing entropy for turn ${params.currentTurn}`);
    return advanceTurn(params.currentConditions, params.currentTurn, params.seed, params.duration);
  }
);

/**
 * Entropy advancement node (wrapped with tracing)
 * Processes entropy changes based on turn progression
 */
export const entropyAdvancementNode = async (state: GameplayState): Promise<Partial<GameplayState>> => {
  const currentConditions = state.worldConditions || [];
  const currentTurn = (state.currentTurn || 0) + 1;
  const eventsLog = state.eventsLog || [];

  // If no conditions exist yet, skip entropy advancement
  if (currentConditions.length === 0) {
    logger.info('[Entropy] No conditions to advance, skipping');
    return { currentTurn };
  }

  // Use room ID as seed for deterministic randomness
  const seed = state.roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Advance entropy
  const update = await advanceEntropyTask({
    currentConditions,
    currentTurn,
    seed,
  });

  // Apply updates
  let updatedConditions = currentConditions;
  let updatedEventsLog = eventsLog;

  if (update.mutation) {
    const { key, newValue, reason } = update.mutation;
    updatedConditions = currentConditions.map((cond) =>
      cond.key === key ? { ...cond, currentValue: newValue, lastUpdatedTurn: currentTurn } : cond
    );

    logger.info(`[Entropy] Mutation: ${key} -> ${newValue} (${reason})`);
  } else if (update.newEvent) {
    const newEvent: RandomEvent = {
      ...update.newEvent,
      type: 'Random Event',
      turnTriggered: currentTurn,
    };
    updatedEventsLog = [newEvent, ...eventsLog];

    logger.info(`[Entropy] New event: ${newEvent.name}`);
  } else {
    logger.info('[Entropy] No changes this turn');
  }

  return {
    worldConditions: updatedConditions,
    eventsLog: updatedEventsLog,
    currentTurn,
  };
};
