/**
 * Grid Generation Graph
 * LangGraph workflow for deterministic, traceable grid world generation
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from './state';
import { CharacterCreationStateSchema } from './state';

// Import grid generation nodes
import { initGridNode } from './nodes/grid/init-grid';
import { biomeMapNode } from './nodes/grid/biome-map';
import { coreChunksNode } from './nodes/grid/core-chunks';
import { wfcStructuresNode } from './nodes/grid/wfc-structures';
import { caCavernsNode } from './nodes/grid/ca-caverns';
import { bspRoomsNode } from './nodes/grid/bsp-rooms';
import { featuresNode } from './nodes/grid/features';
import { persistChunksNode } from './nodes/grid/persist-chunks';

/**
 * Create grid generation graph
 * Workflow: init → biome → chunks → wfc → ca → bsp → features → persist
 */
export function createGridGenerationGraph() {
  logger.info('[GridGenerationGraph] Creating grid generation workflow');

  // Define state graph
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphBuilder = new StateGraph<CharacterCreationState>(CharacterCreationStateSchema as any) as any;

  graphBuilder.addNode('init_grid', initGridNode as any);
  graphBuilder.addNode('biome_map', biomeMapNode as any);
  graphBuilder.addNode('core_chunks', coreChunksNode as any);
  graphBuilder.addNode('wfc_structures', wfcStructuresNode as any);
  graphBuilder.addNode('ca_caverns', caCavernsNode as any);
  graphBuilder.addNode('bsp_rooms', bspRoomsNode as any);
  graphBuilder.addNode('features', featuresNode as any);
  graphBuilder.addNode('persist_chunks', persistChunksNode as any);

  // Define workflow edges
  graphBuilder.addEdge(START, 'init_grid');
  graphBuilder.addEdge('init_grid', 'biome_map');
  graphBuilder.addEdge('biome_map', 'core_chunks');
  graphBuilder.addEdge('core_chunks', 'wfc_structures');
  graphBuilder.addEdge('wfc_structures', 'ca_caverns');
  graphBuilder.addEdge('ca_caverns', 'bsp_rooms');
  graphBuilder.addEdge('bsp_rooms', 'features');
  graphBuilder.addEdge('features', 'persist_chunks');
  graphBuilder.addEdge('persist_chunks', END);

  // Compile graph
  const checkpointer = new MemorySaver();
  const graph = graphBuilder.compile({ checkpointer });

  logger.info('[GridGenerationGraph] Graph compiled with 8 nodes');

  return graph;
}

/**
 * Invoke grid generation graph
 */
export async function invokeGridGenerationGraph(input: CharacterCreationState): Promise<CharacterCreationState> {
  const graph = createGridGenerationGraph();

  const config = {
    configurable: {
      thread_id: `grid_${input.roomId}`,
    },
  };

  logger.info('[GridGenerationGraph] Invoking grid generation', {
    roomId: input.roomId,
  });

  const result = (await graph.invoke(input, config)) as CharacterCreationState;

  logger.info('[GridGenerationGraph] Grid generation complete', {
    roomId: input.roomId,
    chunksGenerated: result.gridWorld?.chunks?.length ?? 0,
  });

  return result;
}

/**
 * Stream grid generation graph (for real-time progress updates)
 */
export async function* streamGridGenerationGraph(
  input: CharacterCreationState
): AsyncGenerator<CharacterCreationState> {
  const graph = createGridGenerationGraph();

  const config = {
    configurable: {
      thread_id: `grid_${input.roomId}`,
    },
  };

  logger.info('[GridGenerationGraph] Streaming grid generation', {
    roomId: input.roomId,
  });

  const stream = await graph.stream(input, config);

  for await (const event of stream) {
    // Yield state updates as they happen
    const nodeResults = Object.values(event as Record<string, unknown>)[0] as CharacterCreationState;
    yield nodeResults;
  }
}
