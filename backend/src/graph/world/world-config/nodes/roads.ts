/**
 * Roads Generation Node (Section 2: World Config)
 * Generates roads connecting structures
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateRoads } from '@/services/world-gen/road-generator';
import type { WorldConfigState } from '@daicer/shared/graph-states';

/**
 * Generate roads between structures
 * Creates organic pathways based on structure significance
 */
export const roadsGenerationNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, structures } = state;

  logger.info('[roads_generation] Generating roads', {
    roomId,
    structureCount: structures.length,
  });


  // Generate roads
  const roads = generateRoads(structures as any, null, roomId);

  logger.info('[roads_generation] Roads generated', {
    count: roads.length,
    sample: roads
      .map((r) => {
        const from = structures.find((s) => s.id === r.from);
        const to = structures.find((s) => s.id === r.to);
        return `${from?.name || r.from} → ${to?.name || r.to}`;
      })
      .slice(0, 5),
  });


  return {
    roads,
  };
};
