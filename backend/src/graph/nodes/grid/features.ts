/**
 * Feature Population Node
 * Spawns entities (trees, creatures, resources) on grid tiles
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../../state';
import type { GridFeature } from '@daicer/shared';
import { Alea } from '@/services/world-gen/noise';

/**
 * Populate chunks with features (trees, resources, etc.)
 * Uses biome data and tile types to determine feature spawning
 */
export const featuresNode = async (
  state: CharacterCreationState,
  _config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, gridWorld } = state;

  if (!gridWorld || !gridWorld.chunks) {
    throw new Error('[features] Grid chunks not generated');
  }

  logger.info('[features] Populating features', {
    roomId,
    chunkCount: gridWorld.chunks.length,
  });

  const rng = Alea(`${roomId}-features`);
  let totalFeatures = 0;

  // Add additional features to each chunk based on biome
  for (const chunk of gridWorld.chunks) {
    // Features already generated in chunk generator, but we can add more here
    // For example, spawn creatures or special items

    for (const tile of chunk.tiles) {
      // Skip non-surface tiles
      if (tile.z !== 0) continue;
      if (tile.blockType === 'water' || tile.blockType === 'air') continue;

      // Spawn creatures in certain biomes (low probability)
      if (['forest', 'jungle', 'mountains'].includes(tile.biome)) {
        if (rng() < 0.02) {
          // 2% chance
          const creature: GridFeature = {
            id: `creature_${tile.x}_${tile.y}`,
            position: { x: tile.x, y: tile.y, z: tile.z },
            type: 'creature',
            subtype: tile.biome === 'mountains' ? 'mountain_goat' : 'deer',
            metadata: { hp: 10, hostile: false },
            isVisible: true,
            isWalkable: false,
            blocksLineOfSight: false,
            interactable: true,
          };
          chunk.features.push(creature);
          totalFeatures++;
        }
      }
    }
  }

  logger.info('[features] Features populated', {
    totalFeatures,
    chunksWithFeatures: gridWorld.chunks.filter((c) => c.features.length > 0).length,
  });

  return {
    gridWorld: {
      ...gridWorld,
      chunks: gridWorld.chunks,
    },
    worldGenProgress: {
      phase: 'features',
      error: null,
      retryCount: 0,
    },
  };
};
