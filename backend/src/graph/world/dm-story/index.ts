/**
 * DM Story Graph (Section 1: DM Personality, Scope & Story)
 *
 * Purpose: Generate world history, conditions, and narrative seed
 * Nodes: 4 (init, conditions, history_period loop, summary)
 * State: DMStoryState (isolated)
 * Dependencies: None (first section)
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { DMStoryStateSchema } from '@daicer/shared/graph-states';
import type { DMStoryState } from '@daicer/shared/graph-states';

// Nodes
import { initWorldNode } from './nodes/init';
import { generateConditionsNode } from './nodes/conditions';
import { historyPeriodNode } from './nodes/history-period';
import { synthesizeHistoryNode } from './nodes/history-summary';

// Routing
import { shouldGenerateAnotherPeriod } from './routing';

/**
 * Create DM Story Graph (Section 1)
 * Factory pattern - returns new instance per invocation
 *
 * Graph flow:
 * START → init_world → generate_conditions →
 *   [if historyDepth = 0] → END
 *   [if historyDepth > 0] → generate_history_period (loop) → synthesize_history → END
 *
 * @returns Compiled graph instance
 */
export function createDMStoryGraph() {
  logger.info('[Graph] Creating dm_story_graph');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = (new StateGraph<DMStoryState>(DMStoryStateSchema as any) as any)
    .addNode('init_world', initWorldNode)
    .addNode('generate_conditions', generateConditionsNode)
    .addNode('generate_history_period', historyPeriodNode)
    .addNode('synthesize_history', synthesizeHistoryNode)

    // Flow
    .addEdge(START, 'init_world')
    .addEdge('init_world', 'generate_conditions')

    // Conditional: skip history if depth = 0
    .addConditionalEdges('generate_conditions', (state: DMStoryState) => {
      if (state.settings.historyDepth === 0) {
        logger.info('[dm_story_graph] Skipping history generation (historyDepth = 0)');
        return END;
      }
      logger.info('[dm_story_graph] Starting history period generation');
      return 'generate_history_period';
    })

    // Loop: generate periods until complete
    .addConditionalEdges('generate_history_period', shouldGenerateAnotherPeriod)

    // Summary and end
    .addEdge('synthesize_history', END)
    .compile();

  logger.info('[Graph] dm_story_graph compiled (4 nodes)');

  return graph;
}
