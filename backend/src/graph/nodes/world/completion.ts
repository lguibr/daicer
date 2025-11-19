/**
 * World Completion Node
 * Finalizes world generation and cleans up
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { clearStreamState } from '@/services/firestore/streaming';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Complete world generation
 * Final cleanup and status update
 */
export const worldCompletionNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId } = state;

  logger.info('[world_completion] Finalizing world generation', {
    roomId,
    hasHistory: !!state.worldHistory,
    structureCount: state.structures?.length || 0,
    roadCount: state.roads?.length || 0,
    worldDescriptionLength: state.worldDescription?.length || 0,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit completion event
  stream.emit({
    type: 'phase_complete',
    phase: 'complete',
  });

  // Clear stream state in Firestore
  await clearStreamState(roomId);

  logger.info('[world_completion] World generation complete', {
    roomId,
    totalPeriods: state.historyPeriods?.length || 0,
    totalStructures: state.structures?.length || 0,
    totalRoads: state.roads?.length || 0,
  });

  return {
    worldGenProgress: {
      phase: 'complete',
      currentPeriod: state.historyPeriods?.length || 0,
      totalPeriods: state.historyPeriods?.length || 0,
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_complete',
        phase: 'complete',
        timestamp: Date.now(),
      },
    ],
  };
};
