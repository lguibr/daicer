/**
 * World Config Graph (Section 2: World Configuration)
 *
 * Purpose: Generate physical world (structures, roads, terrain, chunks)
 * Nodes: 5 (structures, materialize, roads, terrain, chunks)
 * State: WorldConfigState (isolated)
 * Dependencies: NONE - terrain generates independently from seed + parameters
 * Features: NO SSE streaming, NO history/lore generation - instant creation
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { WorldConfigStateSchema } from '@daicer/shared/graph-states';

// Nodes
import { placeStructuresNode } from './nodes/structures';
import { materializeStructuresNode } from './nodes/materialize';
import { roadsGenerationNode } from './nodes/roads';
import { terrainCollapseNode } from './nodes/terrain';
import { chunksPregenerationNode } from './nodes/chunks';

// Routing
import { shouldGenerateRoads } from './routing';

/**
 * Create World Config Graph (Section 2)
 * Factory pattern - returns new instance per invocation
 *
 * Simplified flow (NO history/lore):
 * START → place_structures → materialize_structures →
 *   [if enableRoads & structures >= 2] → generate_roads → collapse_terrain
 *   [else] → collapse_terrain
 * → pregenerate_chunks → END
 *
 * Note: Lore generation removed - instant room creation
 * Note: Grid generation on-demand when entering combat
 *
 * @returns Compiled graph instance
 */
export function createWorldConfigGraph() {
  logger.info('[Graph] Creating world_config_graph (simplified - no lore)');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = (new StateGraph(WorldConfigStateSchema as any) as any)
    .addNode('place_structures', placeStructuresNode)
    .addNode('materialize_structures', materializeStructuresNode)
    .addNode('generate_roads', roadsGenerationNode)
    .addNode('collapse_terrain', terrainCollapseNode)
    .addNode('pregenerate_chunks', chunksPregenerationNode)

    // Flow
    .addEdge(START, 'place_structures')
    .addEdge('place_structures', 'materialize_structures')

    // Conditional: generate roads only if enabled AND >= 2 structures
    .addConditionalEdges('materialize_structures', shouldGenerateRoads)

    // Roads flow
    .addEdge('generate_roads', 'collapse_terrain')

    // Continue flow - skip lore, go directly to END
    .addEdge('collapse_terrain', 'pregenerate_chunks')
    .addEdge('pregenerate_chunks', END)
    .compile();

  logger.info('[Graph] world_config_graph compiled (5 nodes, no lore/history)');

  return graph;
}
