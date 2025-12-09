/**
 * Biome Collapse Node
 * Uses existing biome generation system with structures/roads as influence
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
// import { generateBiomeMap } from '@/services/world-gen/biome-generator';
import type { TerrainGenerationState } from '../state';

/**
 * Generate biome map using existing biome generation system
 * Structures and roads influence biome distribution
 */
/**
 * Generate biome map using existing biome generation system
 * Structures and roads influence biome distribution
 */
export const biomeCollapseNode = async (
  state: TerrainGenerationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<TerrainGenerationState>> => {
  const { roomId, structures, roads, settings } = state;

  // Use Shared Simple Generator for Parity
  const { createSimpleChunkGenerator, DEFAULT_GENERATION_PARAMS } = await import('@daicer/shared/world-gen');

  const seed = settings.seed || roomId;

  // Merge defaults with custom params
  const finalParams = {
    ...DEFAULT_GENERATION_PARAMS,
    ...(settings.generationParams || {}),
  };

  logger.info('[biome_collapse] Genering with params:', {
    seed,
    gridWidth: settings.gridWidth,
    elevationScale: finalParams.elevationScale,
  });

  // Create generator
  const generator = createSimpleChunkGenerator(seed, finalParams);

  // Generate entire grid (as one big chunk)
  // Simple generator returns [floor][y][x]
  const chunk3D = generator(0, 0, settings.gridWidth, settings.gridHeight);

  // Extract surface layer (floor 0 is index 3)
  const biomeGrid = chunk3D[3] || [];

  logger.info('[biome_collapse] Biome map generated (Simple Mode)', {
    gridSize: `${settings.gridWidth}x${settings.gridHeight}`,
  });

  return {
    biomeMap: {
      width: settings.gridWidth,
      height: settings.gridHeight,
      seed,
      grid: biomeGrid,
    },
  };
};
