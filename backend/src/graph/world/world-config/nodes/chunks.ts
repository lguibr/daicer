/**
 * Chunks Pregeneration Node (Section 2: World Config)
 * Pre-generates critical map chunks for faster runtime access
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { preGenerateChunks } from '@/services/world-gen/chunk-pre-generator';
import type { WorldConfigState } from '@daicer/shared/graph-states';

/**
 * Pre-generate map chunks
 * Caches chunks around structures for fast access
 */
export const chunksPregenerationNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, structures, roads, terrainMap, settings } = state;

  logger.info('[chunks_pregeneration] Pre-generating map chunks', {
    roomId,
    structureCount: structures.length,
    seed: settings.seed,
  });


  // Use deterministic seed from settings (falls back to roomId if not provided)
  const seed = settings.seed || roomId;

  // Chunk generation params - use values from generationParams if provided
  const worldParams = {
    seed,
    width: 2048,
    height: 2048,
    depth: 33,
    waterLevel: settings.generationParams?.elevationScale ? -0.1 : -0.1,
    mountainousness: settings.generationParams?.elevationPersistence || 1.0,
    jaggedness: settings.generationParams?.elevationScale ? settings.generationParams.elevationScale * 50 : 1.0,
    temperature: 0,
    moisture: settings.generationParams?.moistureScale ? settings.generationParams.moistureScale * 50 : 0,
  };

  // Pre-generate chunks
  const cachedChunks = await preGenerateChunks(
    roomId,
    structures as any,
    roads as any,
    terrainMap,
    worldParams,
    (event: any) => {
      // Forward chunk events
      if (config?.configurable?.writer) {
        config.configurable.writer(event);
      }
    }
  );

  logger.info('[chunks_pregeneration] Chunks pre-generated', {
    count: cachedChunks.length,
  });


  return {
    generatedChunks: cachedChunks,
  };
};
