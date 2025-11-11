/**
 * Character Creation Graph using LangGraph StateGraph
 * Handles SETUP and CHARACTER_CREATION phases with simplified state
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { CharacterCreationStateSchema, type CharacterCreationState } from './state';
import { worldGenerationNode } from './nodes/world-generation';
import { characterOpeningsNode } from './nodes/character-openings';

/**
 * Create the character creation StateGraph
 * Simplified state reduces type complexity significantly
 */
export function createCharacterCreationGraph() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = (new StateGraph<CharacterCreationState>(CharacterCreationStateSchema as any) as any)
    // World generation node
    .addNode('world_generation', worldGenerationNode)

    // Character creation node (openings generation)
    .addNode('character_openings', characterOpeningsNode)

    // Entry point: always start with world generation
    .addEdge(START, 'world_generation')

    // World generation -> character openings
    .addEdge('world_generation', 'character_openings')

    // Character openings -> end
    .addEdge('character_openings', END);

  const graph = builder.compile();

  logger.info('Character creation graph compiled');

  return graph;
}

/**
 * Character creation graph singleton instance
 */
let characterCreationGraphInstance: ReturnType<typeof createCharacterCreationGraph> | null = null;

/**
 * Get or create character creation graph instance
 */
export function getCharacterCreationGraph(): ReturnType<typeof createCharacterCreationGraph> {
  if (!characterCreationGraphInstance) {
    characterCreationGraphInstance = createCharacterCreationGraph();
  }
  return characterCreationGraphInstance;
}

/**
 * Invoke character creation graph
 */
export async function invokeCharacterCreationGraph(input: CharacterCreationState): Promise<CharacterCreationState> {
  const graph = getCharacterCreationGraph();

  logger.info(`Invoking character creation graph for room ${input.roomId}`);

  try {
    const result = await graph.invoke(input);
    return result as CharacterCreationState;
  } catch (error) {
    logger.error('Error invoking character creation graph:', error);
    throw error;
  }
}
