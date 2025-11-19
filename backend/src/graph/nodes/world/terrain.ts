/**
 * Terrain Collapse Node
 * Modifies terrain around structures for natural integration
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { collapseWorldAroundStructures } from '@/services/world-gen/world-collapse';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Collapse terrain around structures
 * Creates natural terrain modifications for structures and roads
 */
export const terrainCollapseNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [], roads = [] } = state;

  logger.info('[terrain_collapse] Collapsing terrain', {
    roomId,
    structureCount: structures.length,
    roadCount: roads.length,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'terrain',
  });

  // Map dimensions
  const mapWidth = 512;
  const mapHeight = 512;
  const mapDepth = 21;

  // Collapse terrain
  const collapseData = collapseWorldAroundStructures(structures, roads, {
    seed: roomId,
    width: mapWidth,
    height: mapHeight,
    depth: mapDepth,
  });

  logger.info('[terrain_collapse] Terrain collapsed', {
    influences: collapseData.influences.length,
  });

  // Emit terrain collapse event
  stream.emit({
    type: 'terrain_collapse',
    influences: collapseData.influences.length,
  } as any);

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'terrain',
  });

  // Note: collapseData is used by chunk pre-generation
  // We could store it in state, but it's large - better to regenerate in chunks node
  return {
    worldGenProgress: {
      phase: 'terrain',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'terrain_collapse',
        influences: collapseData.influences.length,
        timestamp: Date.now(),
      } as any,
    ],
  };
};
