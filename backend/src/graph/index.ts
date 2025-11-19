/**
 * Graph Registry - Auto-Discovery for LangGraph Studio
 * Exports all graphs and subgraphs for Studio visualization
 */

// Root graphs
export { createGameplayGraph, getGameplayGraph, invokeGameplayGraph } from './gameplay-graph';
export {
  createSessionInitializationGraph,
  invokeSessionInitializationGraph,
  invokeSessionInitializationGraphWithStreaming,
} from './session-initialization-graph';

// Subgraphs
export {
  createHistoryGenerationSubgraph,
  createTerrainGenerationSubgraph,
  createWorldGenerationSubgraph,
  createCharacterSetupSubgraph,
} from './subgraphs';

// State schemas (from main state.ts only to avoid duplicates)
export * from './state';

// Deprecated (backwards compatibility)
export {
  createCharacterCreationGraph,
  getCharacterCreationGraph,
  invokeCharacterCreationGraph,
  invokeCharacterCreationGraphWithStreaming,
} from './character-creation-graph';
