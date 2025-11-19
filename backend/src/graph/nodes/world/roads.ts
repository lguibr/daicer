/**
 * Roads Generation Node
 * Generates roads connecting structures
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateRoads } from '@/services/world-gen/road-generator';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Generate roads between structures
 * Creates organic pathways based on structure significance
 */
export const roadsGenerationNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, structures = [] } = state;

  logger.info('[roads_generation] Generating roads', {
    roomId,
    structureCount: structures.length,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'roads',
  });

  // Generate roads
  const roads = generateRoads(structures, null, roomId);

  logger.info('[roads_generation] Roads generated', {
    count: roads.length,
    roads: roads
      .map((r) => {
        const from = structures.find((s) => s.id === r.from);
        const to = structures.find((s) => s.id === r.to);
        return `${from?.name || r.from} → ${to?.name || r.to}`;
      })
      .slice(0, 5),
  });

  // Emit road generation event
  stream.emit({
    type: 'road_generation',
    totalRoads: roads.length,
  } as any);

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'roads',
  });

  return {
    roads,
    worldGenProgress: {
      phase: 'roads',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'road_generation',
        totalRoads: roads.length,
        timestamp: Date.now(),
      } as any,
    ],
  };
};
