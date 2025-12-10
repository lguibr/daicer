/**
 * History Period Node (Section 1: DM Story)
 * Generates ONE historical period and appends to historyPeriods array
 * This node loops via conditional edge routing
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateSinglePeriodTask } from '@/services/world-gen/historical-generator';
import type { DMStoryState } from '@daicer/shared/graph-states/dm-story-state';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';
import type { WorldCondition } from '@/services/entropy/types';

/**
 * Generate a single historical period
 * Incremental update - appends to historyPeriods array
 * CRITICAL: Transforms relativePosition from object to string
 */
export const historyPeriodNode = async (
  state: DMStoryState,
  config?: LangGraphRunnableConfig
): Promise<Partial<DMStoryState>> => {
  const { roomId, settings, historyPeriods, currentPeriod, totalPeriods } = state;

  logger.info(`[history_period] Generating period ${currentPeriod + 1}/${totalPeriods}`, {
    roomId,
    currentPeriod,
    totalPeriods,
  });

  // Emit progress
  emitProgress(
    'period_start',
    {
      periodNumber: currentPeriod + 1,
      totalPeriods,
    },
    config
  );

  // Get previous narrative and conditions
  const previousPeriod = historyPeriods[currentPeriod - 1];
  const previousNarrative = previousPeriod?.narrative;
  const previousConditions = (previousPeriod?.conditions || null) as WorldCondition[] | null;

  // Collect all structures from previous periods
  const allStructures = historyPeriods.flatMap((p) => p.structures);

  // Build generation context
  const context = {
    settings: settings as any, // Type compatibility
    roomSeed: roomId,
    periods: historyPeriods as any[],
    allStructures: allStructures as any[],
    previousNarrative,
    previousConditions,
    periodCount: totalPeriods,
  };

  // Generate the period using task
  const period = await generateSinglePeriodTask({ periodNumber: currentPeriod, context }, config);

  // CRITICAL FIX: Transform relativePosition from object to string
  // LLM returns: { direction: "northeast", distance: "far" }
  // Schema expects: "northeast-far"
  const transformedStructures = period.structures.map((s: any) => {
    if (s.relativePosition && typeof s.relativePosition === 'object') {
      return {
        ...s,
        relativePosition: `${s.relativePosition.direction}-${s.relativePosition.distance}`,
      };
    }
    return s;
  });

  const transformedPeriod = {
    ...period,
    structures: transformedStructures,
  };

  logger.info(`[history_period] Period ${currentPeriod + 1} complete`, {
    narrativeLength: period.narrative.length,
    structureCount: transformedStructures.length,
    structures: transformedStructures.map((s: any) => s.name),
  });

  // Emit completion
  emitProgress(
    'period_complete',
    {
      periodNumber: currentPeriod + 1,
      totalPeriods,
      structuresAdded: transformedStructures.length,
    },
    config
  );

  // INCREMENTAL UPDATE: Append new period to array
  return {
    historyPeriods: [...historyPeriods, transformedPeriod],
    currentPeriod: currentPeriod + 1,
  };
};
