/**
 * History Summary Node (Section 1: DM Story)
 * Synthesizes all historical periods into cohesive overall narrative
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateOverallSummaryTask } from '@/services/world-gen/historical-generator';
import type { DMStoryState } from '@daicer/shared/graph-states/dm-story-state';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Generate history summary
 * Synthesizes all periods into a cohesive overall narrative
 */
export const synthesizeHistoryNode = async (
  state: DMStoryState,
  config?: LangGraphRunnableConfig
): Promise<Partial<DMStoryState>> => {
  const { roomId, settings, historyPeriods } = state;

  logger.info('[synthesize_history] Generating overall history summary', {
    roomId,
    totalPeriods: historyPeriods.length,
  });

  // Emit progress
  emitProgress('node_start', { node: 'synthesize_history' }, config);

  // Build context
  const context = {
    settings: settings as any,
    roomSeed: roomId,
    periods: historyPeriods as any[],
    allStructures: historyPeriods.flatMap((p) => p.structures) as any[],
    previousNarrative: undefined,
    previousConditions: null,
  };

  // Generate summary using existing task
  const overallSummary = await generateOverallSummaryTask({ context }, config);

  logger.info('[synthesize_history] Summary generated', {
    summaryLength: overallSummary.length,
    totalPeriods: historyPeriods.length,
    totalStructures: context.allStructures.length,
  });

  // Emit completion
  emitProgress('node_complete', { node: 'synthesize_history' }, config);

  // Return just the string summary (not full WorldHistory object)
  return {
    worldHistory: overallSummary,
  };
};
