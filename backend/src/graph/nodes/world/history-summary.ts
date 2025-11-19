/**
 * History Summary Node
 * Generates overall summary of all historical periods
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateOverallSummaryTask } from '@/services/world-gen/historical-generator';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Generate history summary
 * Synthesizes all periods into a cohesive overall narrative
 */
export const historySummaryNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, settings, historyPeriods = [] } = state;

  logger.info('[history_summary] Generating overall history summary', {
    roomId,
    totalPeriods: historyPeriods.length,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit summary start
  stream.emit({
    type: 'phase_start',
    phase: 'history',
  });

  // Build context
  const context = {
    settings: settings! as any, // Type mismatch - WorldSettings vs simplified settings
    roomSeed: roomId,
    periods: historyPeriods,
    allStructures: historyPeriods.flatMap((p) => p.structures),
    previousNarrative: undefined,
    previousConditions: null,
  };

  // Generate summary
  const overallSummary = await generateOverallSummaryTask({ context }, config);

  logger.info('[history_summary] Summary generated', {
    summaryLength: overallSummary.length,
    totalPeriods: historyPeriods.length,
    totalStructures: context.allStructures.length,
  });

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'history',
  });

  // Create full world history object
  const worldHistory = {
    totalYears: settings?.historyDepth || 0,
    periods: historyPeriods,
    overallSummary,
  };

  return {
    worldHistory,
    worldGenProgress: {
      phase: 'history',
      currentPeriod: historyPeriods.length,
      totalPeriods: historyPeriods.length,
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_complete',
        phase: 'history',
        timestamp: Date.now(),
      },
    ],
  };
};
