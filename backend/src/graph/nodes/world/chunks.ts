/**
 * Chunks Pregeneration Node
 * Pre-generates critical map chunks for faster runtime access
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { preGenerateChunks } from '@/services/world-gen/chunk-pre-generator';
import { collapseWorldAroundStructures } from '@/services/world-gen/world-collapse';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Pre-generate map chunks
 * Caches chunks around structures for fast access
 */
export const chunksPregenerationNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [], roads = [] } = state;

  logger.info('[chunks_pregeneration] Pre-generating map chunks', {
    roomId,
    structureCount: structures.length,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'chunks',
  });

  // Regenerate collapse data (needed for chunk generation)
  const collapseData = collapseWorldAroundStructures(structures, roads, {
    seed: roomId,
    width: 512,
    height: 512,
    depth: 21,
  });

  // Chunk generation params
  const worldParams = {
    seed: roomId,
    width: 2048,
    height: 2048,
    depth: 33,
    waterLevel: -0.1,
    mountainousness: 1.0,
    jaggedness: 1.0,
    temperature: 0,
    moisture: 0,
  };

  // Pre-generate chunks
  const cachedChunks = await preGenerateChunks(roomId, structures, roads, collapseData, worldParams, (event: any) => {
    // Forward chunk events to stream
    stream.emit(event);
  });

  logger.info('[chunks_pregeneration] Chunks pre-generated', {
    count: cachedChunks.length,
  });

  // Emit chunk generation event
  stream.emit({
    type: 'chunk_generation',
    totalChunks: cachedChunks.length,
    cachedChunks: cachedChunks.length,
  } as any);

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'chunks',
  });

  return {
    worldGenProgress: {
      phase: 'chunks',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'chunk_generation',
        totalChunks: cachedChunks.length,
        timestamp: Date.now(),
      } as any,
    ],
  };
};
