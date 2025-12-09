/**
 * Core Chunks Generation Node
 * Pre-generates the 32x32 chunk starting area (256x256 tiles = 2048x2048 pixels)
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateStartingArea } from '@/services/world-gen/grid-chunk-generator';
import type { CharacterCreationState } from '../../state';

/**
 * Generate starting area chunks (task-wrapped)
 */
const generateStartingAreaTask = task('generate_starting_area', async (params: { seed: string }) => {
  return generateStartingArea({
    seed: params.seed,
    waterLevel: -0.1,
    mountainousness: 1.0,
    caveFrequency: 0.5,
    oreDistribution: {
      coal: 0.3,
      iron: 0.2,
      gold: 0.1,
      diamond: 0.05,
    },
  });
});

/**
 * Generate core starting area chunks
 * Creates 32x32 chunks (1024 total) for walkable spawn area
 */
export const coreChunksNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, gridWorld } = state;

  if (!gridWorld) {
    throw new Error('[core_chunks] Grid not initialized');
  }

  logger.info('[core_chunks] Generating starting area (32x32 chunks = 256x256 tiles)', { roomId });

  // Generate chunks for surface layer (z=0)
  const chunks = await generateStartingAreaTask({ seed: roomId });

  logger.info('[core_chunks] Starting area generated', {
    chunkCount: chunks.length,
    tileCount: chunks.reduce((sum, c) => sum + c.tiles.length, 0),
  });

  return {
    gridWorld: {
      ...gridWorld,
      chunks,
      coreAreaGenerated: true,
    },
    worldGenProgress: {
      phase: 'chunks',
      error: null,
      retryCount: 0,
    },
  };
};
