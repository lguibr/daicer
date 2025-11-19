/**
 * Terrain Generation Graph
 * Generates 3D voxel terrain with biome collapse
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { TerrainGenerationStateSchema } from './state';
import { biomeCollapseNode } from './nodes/biome-collapse';
import { voxelLayersNode } from './nodes/voxel-layers';

/**
 * Create Terrain Generation Graph
 *
 * Flow:
 * START → biome_collapse → voxel_layers → END
 */
export function createTerrainGenerationGraph() {
  logger.info('[Graph] Creating terrain_generation_graph');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = (new StateGraph(TerrainGenerationStateSchema as any) as any)
    .addNode('biome_collapse', biomeCollapseNode)
    .addNode('voxel_layers', voxelLayersNode)
    .addEdge(START, 'biome_collapse')
    .addEdge('biome_collapse', 'voxel_layers')
    .addEdge('voxel_layers', END)
    .compile();

  logger.info('[Graph] terrain_generation_graph compiled (2 nodes)');

  return graph;
}
