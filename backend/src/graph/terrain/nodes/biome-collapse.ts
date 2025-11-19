/**
 * Biome Collapse Node
 * Uses existing biome generation system with structures/roads as influence
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateBiomeMap } from '@/services/world-gen/biome-generator';
import type { TerrainGenerationState } from '../state';

/**
 * Generate biome map using existing biome generation system
 * Structures and roads influence biome distribution
 */
export const biomeCollapseNode = async (
  state: TerrainGenerationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<TerrainGenerationState>> => {
  const { roomId, structures, roads, settings } = state;

  logger.info('[biome_collapse] Starting biome map generation', {
    roomId,
    gridSize: `${settings.gridWidth}x${settings.gridHeight}`,
    structureCount: structures.length,
    roadCount: roads.length,
  });

  // Use existing biome generator with room as seed
  const biomeMap = generateBiomeMap({
    seed: roomId, // Use roomId as seed for deterministic generation
    width: settings.gridWidth,
    height: settings.gridHeight,
    temperatureBias: 0,
    moistureBias: 0,
    continentalnessBias: 0,
    biomeRegionSize: 64, // Voronoi region size
  });

  logger.info('[biome_collapse] Biome map generated', {
    gridSize: `${settings.gridWidth}x${settings.gridHeight}`,
    biomeMapKeys: Object.keys(biomeMap || {}),
  });

  return {
    biomeMap: biomeMap as any,
  };
};
