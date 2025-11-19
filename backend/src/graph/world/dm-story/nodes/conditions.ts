/**
 * Generate Conditions Node (Section 1: DM Story)
 * Creates 5 initial world conditions
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateInitialConditions } from '@/services/entropy/engine';
import type { DMStoryState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Generate world conditions
 * Uses deterministic entropy engine based on roomId seed
 */
export const generateConditionsNode = async (
  state: DMStoryState,
  config?: LangGraphRunnableConfig
): Promise<Partial<DMStoryState>> => {
  const { roomId } = state;
  logger.info('[generate_conditions] Generating initial world conditions', { roomId });

  // Emit progress
  emitProgress('node_start', { node: 'generate_conditions' }, config);

  // Generate entropy conditions using room ID as seed
  const seed = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const conditions = generateInitialConditions(seed);

  logger.info('[generate_conditions] Generated conditions', {
    count: conditions.length,
    conditions: conditions.map((c) => c.key),
  });

  // Emit completion
  emitProgress('node_complete', { node: 'generate_conditions', conditionCount: conditions.length }, config);

  return {
    conditions,
  };
};
