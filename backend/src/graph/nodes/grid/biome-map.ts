/**
 * Biome Map Generation Node
 * Generates global biome distribution using noise + Voronoi
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateBiomeMap } from '@/services/world-gen/biome-generator';
import type { CharacterCreationState } from '../../state';

/**
 * Generate biome map (task-wrapped for checkpointing)
 */
const generateBiomeMapTask = task(
  'generate_biome_map',
  async (params: { seed: string; width: number; height: number }) => {
    return generateBiomeMap({
      seed: params.seed,
      width: params.width,
      height: params.height,
      temperatureBias: 0,
      moistureBias: 0,
      continentalnessBias: 0,
      biomeRegionSize: 100,
    });
  }
);

/**
 * Generate biome distribution map
 */
export const biomeMapNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, gridWorld } = state;

  if (!gridWorld) {
    throw new Error('[biome_map] Grid not initialized');
  }

  logger.info('[biome_map] Generating biome distribution', { roomId });

  // Generate biome map for starting area (256x256 tiles)
  const tileWidth = gridWorld.coreAreaSize * 8; // chunks * tiles_per_chunk
  const tileHeight = gridWorld.coreAreaSize * 8;

  const biomeMap = await generateBiomeMapTask({
    seed: roomId,
    width: tileWidth,
    height: tileHeight,
  });

  logger.info('[biome_map] Biome map generated', {
    uniqueBiomes: new Set(biomeMap.grid.flat()).size,
  });

  return {
    worldGenProgress: {
      phase: 'biomes',
      error: null,
      retryCount: 0,
    },
  };
};
