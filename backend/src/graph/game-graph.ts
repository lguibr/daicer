/**
 * Main Game Graph using LangGraph StateGraph
 * Orchestrates all game phases with persistence and time-travel
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { GameStateSchema, type GameState } from './state';
import { worldGenerationNode } from './nodes/world-generation';
import { characterOpeningsNode } from './nodes/character-openings';
import { turnProcessingNode } from './nodes/turn-processing';
import { combatCoordinatorNode } from './nodes/combat-coordinator';

/**
 * Create the main game StateGraph
 */
export function createGameGraph() {
  const builder = new StateGraph(GameStateSchema)
    // World generation node
    .addNode('world_generation', worldGenerationNode)
    
    // Character creation node (openings generation)
    .addNode('character_openings', characterOpeningsNode)
    
    // Main gameplay loop node
    .addNode('turn_processing', turnProcessingNode)
    
    // Combat coordination node
    .addNode('combat_check', combatCoordinatorNode)
    
    // Entry point routing
    .addConditionalEdges(START, (state: GameState) => {
      switch (state.phase) {
        case 'SETUP':
          return 'world_generation';
        case 'CHARACTER_CREATION':
          return 'character_openings';
        case 'GAMEPLAY':
        case 'COMBAT':
          return 'combat_check';
        default:
          return 'combat_check';
      }
    })
    
    // World generation -> character creation
    .addEdge('world_generation', 'character_openings')
    
    // Character openings -> gameplay check
    .addEdge('character_openings', 'combat_check')
    
    // Combat check routes to either turn processing or END
    .addConditionalEdges('combat_check', (state: GameState) => {
      if (state.phase === 'COMBAT') {
        // In combat - stay in combat mode (action handled by combat tools)
        return END;
      }
      return 'turn_processing';
    })
    
    // Turn processing back to combat check
    .addEdge('turn_processing', 'combat_check');

  // Compile without checkpointer for now (add later when Firestore checkpointer is ready)
  const graph = builder.compile();

  logger.info('Game graph compiled');

  return graph;
}

/**
 * Game graph singleton instance
 */
let gameGraphInstance: ReturnType<typeof createGameGraph> | null = null;

/**
 * Get or create game graph instance
 */
export function getGameGraph(): ReturnType<typeof createGameGraph> {
  if (!gameGraphInstance) {
    gameGraphInstance = createGameGraph();
  }
  return gameGraphInstance;
}

/**
 * Invoke game graph for a room
 */
export async function invokeGameGraph(
  roomId: string,
  input: Partial<GameState> | null
): Promise<GameState> {
  const graph = getGameGraph();

  logger.info(`Invoking game graph for room ${roomId}`);
  
  try {
    const result = await graph.invoke(input);
    return result as GameState;
  } catch (error) {
    logger.error('Error invoking game graph:', error);
    throw error;
  }
}

/**
 * Stream game graph updates for a room
 */
export async function* streamGameGraph(
  roomId: string,
  input: Partial<GameState> | null
): AsyncGenerator<Partial<GameState>> {
  const graph = getGameGraph();

  logger.info(`Streaming game graph for room ${roomId}`);
  
  try {
    for await (const chunk of await graph.stream(input)) {
      yield chunk;
    }
  } catch (error) {
    logger.error('Error streaming game graph:', error);
    throw error;
  }
}

/**
 * Get current game state from graph
 * TODO: Implement with checkpointer
 */
export async function getGameState(): Promise<GameState | null> {
  return null;
}

/**
 * Get state history for time-travel
 * TODO: Implement with checkpointer
 */
export async function getGameStateHistory(): Promise<Array<{
  values: GameState;
  next: string[];
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
}>> {
  return [];
}

/**
 * Update graph state (for time-travel/manual edits)
 * TODO: Implement with checkpointer
 */
export async function updateGameState(): Promise<{ configurable: Record<string, unknown> }> {
  return { configurable: {} };
}

