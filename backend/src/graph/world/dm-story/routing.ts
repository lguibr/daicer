/**
 * DM Story Graph Routing Logic
 * Conditional edge functions for history generation flow
 */

import type { DMStoryState } from '@daicer/shared/graph-states';
import { logger } from '@/utils/logger';

/**
 * Determine if another history period should be generated
 * Returns next node name based on state
 *
 * @param state - Current DMStoryState
 * @returns 'generate_history_period' to loop, or 'synthesize_history' to finish
 */
export function shouldGenerateAnotherPeriod(state: DMStoryState): 'generate_history_period' | 'synthesize_history' {
  const { currentPeriod, totalPeriods } = state;

  if (currentPeriod < totalPeriods) {
    logger.debug(`[routing] Continue history generation (${currentPeriod}/${totalPeriods})`);
    return 'generate_history_period';
  }

  logger.debug(`[routing] History generation complete (${currentPeriod}/${totalPeriods})`);
  return 'synthesize_history';
}
