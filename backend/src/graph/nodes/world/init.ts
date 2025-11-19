/**
 * World Init Node
 * Initializes world generation process and sets up initial state
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Initialize world generation
 * Sets up progress tracking and emits initial events
 */
export const worldInitNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, settings } = state;
  logger.info('[world_init] Starting world generation initialization', {
    roomId,
    theme: settings?.theme,
    historyDepth: settings?.historyDepth,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start event
  stream.emit({
    type: 'phase_start',
    phase: 'init',
  });

  // Calculate target periods for history
  const historyDepth = settings?.historyDepth || 0;
  const totalPeriods = Math.floor(historyDepth / 50);

  logger.info('[world_init] Initialization complete', {
    historyDepth,
    totalPeriods,
    hasHistory: historyDepth > 0,
  });

  // Emit phase complete event
  stream.emit({
    type: 'phase_complete',
    phase: 'init',
  });

  return {
    worldGenProgress: {
      phase: 'init',
      currentPeriod: 0,
      totalPeriods,
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_start',
        phase: 'init',
        timestamp: Date.now(),
      },
    ],
  };
};
