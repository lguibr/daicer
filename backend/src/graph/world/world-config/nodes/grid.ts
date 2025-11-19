/**
 * Grid Generation Wrapper Node (Section 2: World Config)
 * Invokes the grid_generation subgraph for tactical grid
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { createGridGenerationGraph } from '@/graph/grid-generation-graph';
import type { WorldConfigState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Generate tactical grid
 * Wrapper for grid_generation subgraph (BSP + CA + WFC pipeline)
 */
export const gridGenerationNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId } = state;

  logger.info('[grid_generation] Starting tactical grid generation', { roomId });

  // Emit progress
  emitProgress('node_start', { node: 'grid_generation' }, config);

  // Create and invoke grid generation subgraph
  const gridGraph = createGridGenerationGraph();

  // Convert WorldConfigState to format expected by grid graph
  const gridInput = {
    roomId: state.roomId,
    settings: state.settings as any,
    structures: state.structures,
    roads: state.roads,
    terrainMap: state.terrainMap,
    // Initialize grid world
    gridWorld: {
      chunks: [],
      coreAreaGenerated: false,
      coreAreaSize: 32,
    },
    streamEvents: [],
  };

  const gridResult = await gridGraph.invoke(gridInput, config);

  logger.info('[grid_generation] Tactical grid generated', {
    chunksGenerated: gridResult.gridWorld?.chunks?.length || 0,
    coreAreaGenerated: gridResult.gridWorld?.coreAreaGenerated || false,
  });

  // Emit completion
  emitProgress('node_complete', { node: 'grid_generation' }, config);

  return {
    gridState: gridResult.gridWorld,
  };
};
