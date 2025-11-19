/**
 * Room Management Graph
 * Handles room-level state transitions (unlock, settings, etc)
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { RoomManagementStateSchema } from './state';
import { unlockCharacterCreationNode } from './nodes/unlock-characters';

/**
 * Create Room Management Graph
 * Single-node graph for now, will expand as needed
 */
export function createRoomManagementGraph() {
  logger.info('[Graph] Creating room_management_graph');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = (new StateGraph(RoomManagementStateSchema as any) as any)
    .addNode('unlock_character_creation', unlockCharacterCreationNode)
    .addEdge(START, 'unlock_character_creation')
    .addEdge('unlock_character_creation', END)
    .compile();

  logger.info('[Graph] room_management_graph compiled (1 node)');

  return graph;
}
