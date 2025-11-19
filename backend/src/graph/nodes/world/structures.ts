/**
 * Structures Placement Node
 * Places all structures from history onto the map grid
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { placeStructuresOnGrid } from '@/services/world-gen/structure-placer';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Place structures on map grid
 * Converts relative positions to absolute coordinates
 */
export const structuresPlacementNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, historyPeriods = [] } = state;

  // Collect all structures from history
  const allStructures = historyPeriods.flatMap((p) => p.structures);

  logger.info('[structures_placement] Placing structures on grid', {
    roomId,
    totalStructures: allStructures.length,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'structures',
  });

  // Map dimensions (default 512x512 chunks)
  const mapWidth = 512;
  const mapHeight = 512;

  // Place structures using placer service
  const placedStructures = placeStructuresOnGrid(allStructures as any, mapWidth, mapHeight);

  logger.info('[structures_placement] Structures placed', {
    count: placedStructures.length,
    structures: placedStructures.map((s) => `${s.name} @ (${s.x}, ${s.y})`).slice(0, 5),
  });

  // Emit structure placement event
  stream.emit({
    type: 'structure_placement',
    totalStructures: placedStructures.length,
  } as any);

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'structures',
  });

  return {
    structures: placedStructures,
    worldGenProgress: {
      phase: 'structures',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'structure_placement',
        totalStructures: placedStructures.length,
        timestamp: Date.now(),
      } as any,
    ],
  };
};
