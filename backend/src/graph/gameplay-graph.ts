/**
 * Gameplay Graph using LangGraph StateGraph
 *
 * OVERVIEW:
 * This graph manages the GAMEPLAY phase of the game - the non-combat narrative
 * portion where players explore, interact with NPCs, and make decisions.
 *
 * GRAPH STRUCTURE:
 * START → combat_check → turn_processing → combat_check → END
 *                   ↓
 *                  END (if no pending actions)
 *
 * NODES:
 * - combat_check: Verifies game state and decides if turn processing should occur
 * - turn_processing: Processes player actions and generates DM responses
 *
 * STATE:
 * The graph uses GameplayState which includes:
 * - roomId: Unique room identifier
 * - players: Array of player objects with their characters and pending actions
 * - messages: Chat message history
 * - creatures: Active NPCs/monsters
 * - settings: World configuration (theme, difficulty, language, etc.)
 * - worldDescription: Generated world narrative
 * - waitingForAction: Flag to pause graph execution until players submit actions
 *
 * FLOW:
 * 1. Graph starts at combat_check
 * 2. If players have pending actions, proceed to turn_processing
 * 3. turn_processing generates DM response using LLM with tool calling
 * 4. Loop back to combat_check to see if more actions need processing
 * 5. End when no more actions or waiting for player input
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { GameplayStateSchema, type GameplayState } from './state';
import { turnProcessingNode } from './nodes/turn-processing';
import { combatCoordinatorNode } from './nodes/combat-coordinator';

/**
 * Create the gameplay StateGraph
 *
 * This function builds and compiles the gameplay graph that orchestrates
 * turn-based narrative gameplay. The graph is stateful and persists between
 * invocations using Firestore checkpointing (when configured).
 *
 * @returns Compiled StateGraph ready for execution
 */
export function createGameplayGraph() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = (new StateGraph<GameplayState>(GameplayStateSchema as any) as any)
    // === NODES ===
    // Main gameplay loop node - processes player actions and generates DM responses
    .addNode('turn_processing', turnProcessingNode)

    // Combat coordination node - manages game state and checks for combat triggers
    .addNode('combat_check', combatCoordinatorNode)

    // === EDGES ===
    // Entry point: Always start at combat_check to verify state
    .addEdge(START, 'combat_check')

    // Combat check decision: Route to turn processing or end
    .addConditionalEdges('combat_check', ((state: GameplayState) => {
      // If waiting for player action, pause execution (return to END)
      // The graph will resume when reinvoked with new player actions
      if (state.waitingForAction) {
        return END;
      }

      // Check if any players have pending actions to process
      const hasPendingActions = state.players.some((p) => p.action !== null);
      if (!hasPendingActions) {
        // No actions to process - end execution
        return END;
      }

      // Actions available - proceed to turn processing
      return 'turn_processing';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any)

    // After turn processing, loop back to combat_check to see if more work needed
    .addEdge('turn_processing', 'combat_check');

  // Compile the graph (no checkpointer here - added at invocation time if needed)
  const graph = builder.compile();

  logger.info('Gameplay graph compiled');

  return graph;
}

/**
 * Gameplay graph singleton instance
 */
let gameplayGraphInstance: ReturnType<typeof createGameplayGraph> | null = null;

/**
 * Get or create gameplay graph instance
 */
export function getGameplayGraph(): ReturnType<typeof createGameplayGraph> {
  if (!gameplayGraphInstance) {
    gameplayGraphInstance = createGameplayGraph();
  }
  return gameplayGraphInstance;
}

/**
 * Invoke gameplay graph
 */
const invokeGameplayGraphInternal = async (input: GameplayState): Promise<GameplayState> => {
  const graph = getGameplayGraph();

  logger.info(`Invoking gameplay graph for room ${input.roomId}`);

  try {
    const result = await graph.invoke(input);
    return result as GameplayState;
  } catch (error) {
    logger.error('Error invoking gameplay graph:', error);
    throw error;
  }
};

/**
 * Invoke gameplay graph
 */
export async function invokeGameplayGraph(input: GameplayState, _turnNumber?: number): Promise<GameplayState> {
  return invokeGameplayGraphInternal(input);
}
