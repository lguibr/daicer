/**
 * History Period Node
 * Generates ONE historical period and appends to historyPeriods array
 * This node is called repeatedly via conditional edge routing
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateSinglePeriodTask } from '@/services/world-gen/historical-generator';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';
import type { WorldCondition } from '@/services/entropy/types';

/**
 * Generate a single historical period
 * Incremental update - appends to historyPeriods array
 */
export const historyPeriodNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, settings, historyPeriods = [] } = state;
  const periodNumber = historyPeriods.length;
  const totalPeriods = Math.floor((settings?.historyDepth || 0) / 50);

  logger.info(`[history_period] Generating period ${periodNumber + 1}/${totalPeriods}`, {
    roomId,
    periodNumber,
    totalPeriods,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit period start
  stream.emit({
    type: 'period_progress',
    periodNumber: periodNumber + 1,
    totalPeriods,
  } as any);

  // Get previous narrative and conditions
  const previousPeriod = historyPeriods[periodNumber - 1];
  const previousNarrative = previousPeriod?.narrative;
  const previousConditions = (previousPeriod?.conditions || null) as WorldCondition[] | null;

  // Collect all structures from previous periods
  const allStructures = historyPeriods.flatMap((p) => p.structures);

  // Build generation context
  const context = {
    settings: settings! as any, // Type mismatch - WorldSettings vs simplified settings
    roomSeed: roomId,
    periods: historyPeriods,
    allStructures,
    previousNarrative,
    previousConditions,
    periodCount: totalPeriods,
  };

  // Generate the period using task
  const period = await generateSinglePeriodTask({ periodNumber, context }, config);

  logger.info(`[history_period] Period ${periodNumber + 1} complete`, {
    narrativeLength: period.narrative.length,
    structureCount: period.structures.length,
    structures: period.structures.map((s) => s.name),
  });

  // Emit period complete
  stream.emit({
    type: 'period_progress',
    periodNumber: periodNumber + 1,
    totalPeriods,
    periodName: period.narrative.substring(0, 50) + '...',
    structuresAdded: period.structures.length,
  } as any);

  // INCREMENTAL UPDATE: Append new period to array
  return {
    historyPeriods: [...historyPeriods, period],
    worldGenProgress: {
      phase: 'history',
      currentPeriod: periodNumber + 1,
      totalPeriods,
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'period_progress',
        periodNumber: periodNumber + 1,
        totalPeriods,
        timestamp: Date.now(),
      } as any,
    ],
  };
};
