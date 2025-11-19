/**
 * WFC Structure Generation Node
 * Uses Wave Function Collapse to generate building layouts
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { collapseGrid, getPresetTiles } from '@daicer/shared/world-gen/wfc';
import type { CharacterCreationState } from '../../state';

/**
 * WFC generation task (wrapped for deterministic checkpointing)
 */
const wfcGenerationTask = task(
  'wfc_structure_generation',
  async (params: { width: number; height: number; preset: string; seed: string }) => {
    const tiles = getPresetTiles(params.preset as any);
    return collapseGrid(params.width, params.height, tiles, params.seed, undefined, {
      onDebug: (msg) => logger.debug(`[WFC] ${msg}`),
    });
  }
);

/**
 * Generate structures using WFC
 * Currently generates a sample structure, will be integrated with structure placement
 */
export const wfcStructuresNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [] } = state;

  logger.info('[wfc_structures] Generating WFC-based structures', {
    roomId,
    structureCount: structures.length,
  });

  // For now, generate sample structures for significant landmarks
  // TODO: Integrate with structure placement system
  const wfcResults = [];

  for (const structure of structures) {
    if (structure.significance >= 7 && structure.type === 'settlement') {
      // Generate castle/fortress layout
      const result = await wfcGenerationTask({
        width: 20,
        height: 20,
        preset: 'castle',
        seed: `${roomId}-wfc-${structure.id}`,
      });

      if (result.success) {
        wfcResults.push({
          structureId: structure.id,
          layout: result.grid,
        });
        logger.debug(`[wfc_structures] Generated layout for ${structure.name}`, {
          iterations: result.iterations,
        });
      }
    }
  }

  logger.info('[wfc_structures] WFC generation complete', {
    generatedLayouts: wfcResults.length,
  });

  return {
    worldGenProgress: {
      phase: 'wfc',
      error: null,
      retryCount: 0,
    },
  };
};
