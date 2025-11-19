/**
 * Character Setup Graph (Section 3: Character Setup)
 *
 * Purpose: Generate character opening narratives and apply equipment bonuses
 * Nodes: 2 (openings, equipment)
 * State: CharacterState (isolated, per-player)
 * Dependencies: Requires Section 1 (worldHistory) and Section 2 (worldDescription)
 * Pattern: Invoked once per player (not per room)
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { CharacterStateSchema } from '@daicer/shared/graph-states';

// Nodes
import { characterOpeningsNode } from './nodes/openings';
import { equipmentManagementNode } from './nodes/equipment';

/**
 * Create Character Setup Graph (Section 3)
 * Factory pattern - returns new instance per invocation
 *
 * Graph flow:
 * START → character_openings → equipment_management → END
 *
 * Note: This graph is invoked ONCE PER PLAYER, not once per room
 *
 * @returns Compiled graph instance
 */
export function createCharacterSetupGraph() {
  logger.info('[Graph] Creating character_setup_graph');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = (new StateGraph(CharacterStateSchema as any) as any)
    .addNode('character_openings', characterOpeningsNode)
    .addNode('equipment_management', equipmentManagementNode)

    // Simple linear flow
    .addEdge(START, 'character_openings')
    .addEdge('character_openings', 'equipment_management')
    .addEdge('equipment_management', END)
    .compile();

  logger.info('[Graph] character_setup_graph compiled (2 nodes)');

  return graph;
}
