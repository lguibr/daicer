/**
 * Initialize Grid Node
 * Sets up grid generation parameters
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../../state';

/**
 * Initialize grid world generation parameters
 */
export const initGridNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId } = state;

  logger.info('[init_grid] Initializing grid generation', { roomId });

  // Grid parameters (32x32 chunks = 256x256 tiles = 2048x2048 pixels with 8px tiles)
  const coreAreaSize = 32; // 32x32 chunks starting area

  return {
    gridWorld: {
      chunks: [],
      coreAreaGenerated: false,
      coreAreaSize,
    },
    worldGenProgress: {
      phase: 'init',
      error: null,
      retryCount: 0,
    },
  };
};
