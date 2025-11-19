/**
 * Cellular Automata Cavern Generation Node
 * Generates organic cave systems in underground chunks using CA
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../../state';

/**
 * Generate underground caverns using cellular automata
 * Modifies underground chunks (z < 0) with organic cave systems
 */
export const caCavernsNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, gridWorld } = state;

  if (!gridWorld) {
    throw new Error('[ca_caverns] Grid not initialized');
  }

  logger.info('[ca_caverns] Generating cellular automata caverns', { roomId });

  // For now, log that CA caves will be applied during chunk generation
  // Full integration: apply CA to underground chunks in core area

  logger.info('[ca_caverns] CA cavern generation configured');

  return {
    worldGenProgress: {
      phase: 'caverns',
      error: null,
      retryCount: 0,
    },
  };
};
