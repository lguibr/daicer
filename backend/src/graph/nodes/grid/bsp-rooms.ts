/**
 * BSP Room Generation Node
 * Generates building interiors using Binary Space Partitioning
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateBSPLayout } from '@/services/world-gen/bsp-rooms';
import type { CharacterCreationState } from '../../state';

/**
 * BSP room generation task (wrapped for checkpointing)
 */
const bspGenerationTask = task(
  'bsp_room_generation',
  async (params: { width: number; height: number; seed: string }) => {
    return generateBSPLayout(params.width, params.height, params.seed, { minRoomSize: 4 });
  }
);

/**
 * Generate building interiors using BSP
 * Creates room layouts for structures marked as buildings
 */
export const bspRoomsNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [] } = state;

  logger.info('[bsp_rooms] Generating BSP room layouts', {
    roomId,
    structureCount: structures.length,
  });

  // Generate BSP layouts for settlements and significant structures
  const bspResults = [];

  for (const structure of structures) {
    if (structure.type === 'settlement' || structure.type === 'dungeon') {
      const width = structure.width || 32;
      const height = structure.height || 32;

      const rooms = await bspGenerationTask({
        width,
        height,
        seed: `${roomId}-bsp-${structure.id}`,
      });

      bspResults.push({
        structureId: structure.id,
        rooms: rooms.length,
      });

      logger.debug(`[bsp_rooms] Generated ${rooms.length} rooms for ${structure.name}`);
    }
  }

  logger.info('[bsp_rooms] BSP generation complete', {
    layoutsGenerated: bspResults.length,
  });

  return {
    worldGenProgress: {
      phase: 'bsp',
      error: null,
      retryCount: 0,
    },
  };
};
