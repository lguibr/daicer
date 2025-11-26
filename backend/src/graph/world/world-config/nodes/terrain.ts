/**
 * Terrain Collapse Node (Section 2: World Config)
 * Modifies terrain around structures for natural integration
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { collapseWorldAroundStructures } from '@/services/world-gen/world-collapse';
import type { WorldConfigState } from '@daicer/shared/graph-states';

/**
 * Collapse terrain around structures
 * Creates natural terrain modifications for structures and roads
 */
export const terrainCollapseNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, structures, roads, settings } = state;

  logger.info('[terrain_collapse] Collapsing terrain', {
    roomId,
    structureCount: structures.length,
    roadCount: roads.length,
    seed: settings.seed,
  });

  // Map dimensions
  const mapWidth = 512;
  const mapHeight = 512;
  const mapDepth = 21;

  // Use deterministic seed from settings (falls back to roomId if not provided)
  const seed = settings.seed || roomId;

  // Collapse terrain
  const collapseData = collapseWorldAroundStructures(structures as any, roads as any, {
    seed,
    width: mapWidth,
    height: mapHeight,
    depth: mapDepth,
  });

  logger.info('[terrain_collapse] Terrain collapsed', {
    influences: collapseData.influences.length,
  });

  // Store collapse data for use by chunk generation
  return {
    terrainMap: collapseData,
  };
};
