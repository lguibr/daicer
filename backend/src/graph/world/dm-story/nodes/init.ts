/**
 * World Init Node (Section 1: DM Story)
 * Initializes history generation state
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { DMStoryState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Initialize world generation
 * Sets up history periods array and calculates total periods
 */
export const initWorldNode = async (
  state: DMStoryState,
  config?: LangGraphRunnableConfig
): Promise<Partial<DMStoryState>> => {
  const { roomId, settings } = state;
  logger.info('[init_world] Starting world generation initialization', {
    roomId,
    theme: settings.theme,
    historyDepth: settings.historyDepth,
  });

  // Emit progress
  emitProgress('node_start', { node: 'init_world' }, config);

  // Calculate target periods for history (each era = 500 years)
  const historyDepth = settings.historyDepth || 0;
  const totalPeriods = historyDepth === 0 ? 0 : Math.ceil(historyDepth / 500);

  logger.info('[init_world] Initialization complete', {
    historyDepth,
    totalPeriods,
    hasHistory: historyDepth > 0,
  });

  // Emit completion
  emitProgress('node_complete', { node: 'init_world', totalPeriods }, config);

  return {
    historyPeriods: [],
    currentPeriod: 0,
    totalPeriods,
  };
};
