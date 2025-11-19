/**
 * World Conditions Node
 * Generates initial entropy conditions for the world
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateInitialConditions } from '@/services/entropy/engine';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Generate world conditions
 * Uses entropy engine to create initial world state
 */
export const worldConditionsNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId } = state;
  logger.info('[world_conditions] Generating initial world conditions', { roomId });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'conditions',
  });

  // Generate entropy conditions using room ID as seed
  const seed = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const worldConditions = generateInitialConditions(seed);

  logger.info('[world_conditions] Generated conditions', {
    count: worldConditions.length,
    conditions: worldConditions.map((c) => c.key),
  });

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'conditions',
  });

  return {
    worldConditions,
    worldGenProgress: {
      phase: 'conditions',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_complete',
        phase: 'conditions',
        timestamp: Date.now(),
      },
    ],
  };
};
