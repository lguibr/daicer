/**
 * Routing Helpers for LangGraph Conditional Edges
 * Provides conditional logic for graph navigation
 */

import type { CharacterCreationState } from '../state';
import { logger } from '@/utils/logger';

/**
 * Node names for routing
 */
export const NODE_NAMES = {
  INIT: 'world_init',
  CONDITIONS: 'world_conditions',
  HISTORY_PERIOD: 'history_period',
  HISTORY_SUMMARY: 'history_summary',
  STRUCTURES: 'structures_placement',
  ROADS: 'roads_generation',
  TERRAIN: 'terrain_collapse',
  CHUNKS: 'chunks_pregeneration',
  LORE: 'world_lore',
  COMPLETION: 'world_completion',
  CHARACTER_OPENINGS: 'character_openings',
} as const;

/**
 * Determine if another historical period should be generated
 * Routes to either history_period_node (continue) or history_summary_node (done)
 */
export function shouldGenerateAnotherPeriod(state: CharacterCreationState): string {
  const { historyPeriods, settings } = state;
  const historyDepth = settings?.historyDepth || 0;

  // If no history depth configured, skip to structures
  if (historyDepth === 0) {
    logger.info('[Router] No history depth configured, skipping to structures');
    return NODE_NAMES.STRUCTURES;
  }

  const targetPeriods = Math.floor(historyDepth / 50);
  const currentPeriods = historyPeriods?.length || 0;

  if (currentPeriods < targetPeriods) {
    logger.info('[Router] More periods needed', {
      current: currentPeriods,
      target: targetPeriods,
      remaining: targetPeriods - currentPeriods,
    });
    return NODE_NAMES.HISTORY_PERIOD;
  }

  logger.info('[Router] All periods complete, generating summary', {
    totalPeriods: currentPeriods,
  });
  return NODE_NAMES.HISTORY_SUMMARY;
}

/**
 * Determine if history generation should be skipped entirely
 * Routes to either history_period_node (start history) or structures_placement_node (skip)
 */
export function shouldSkipHistory(state: CharacterCreationState): string {
  const historyDepth = state.settings?.historyDepth || 0;

  if (historyDepth === 0) {
    logger.info('[Router] Skipping history generation (historyDepth = 0)');
    return NODE_NAMES.STRUCTURES;
  }

  logger.info('[Router] Starting history generation', {
    historyDepth,
    targetPeriods: Math.floor(historyDepth / 50),
  });
  return NODE_NAMES.HISTORY_PERIOD;
}

/**
 * Determine if roads should be generated
 * Routes to either roads_generation_node or terrain_collapse_node (skip)
 */
export function shouldGenerateRoads(state: CharacterCreationState): string {
  const enableRoads = state.settings?.enableRoads !== false; // Default true
  const hasStructures = (state.structures?.length || 0) > 1;

  if (!enableRoads || !hasStructures) {
    logger.info('[Router] Skipping road generation', {
      enableRoads,
      hasStructures,
      structureCount: state.structures?.length || 0,
    });
    return NODE_NAMES.TERRAIN;
  }

  logger.info('[Router] Generating roads', {
    structureCount: state.structures?.length || 0,
  });
  return NODE_NAMES.ROADS;
}

/**
 * Determine if terrain collapse should be applied
 * Routes to either terrain_collapse_node or chunks_pregeneration_node (skip)
 */
export function shouldCollapsTerrain(state: CharacterCreationState): string {
  const hasStructures = (state.structures?.length || 0) > 0;

  if (!hasStructures) {
    logger.info('[Router] Skipping terrain collapse (no structures)');
    return NODE_NAMES.CHUNKS;
  }

  logger.info('[Router] Applying terrain collapse', {
    structureCount: state.structures?.length || 0,
  });
  return NODE_NAMES.TERRAIN;
}

/**
 * Check if node should retry based on error state
 * Returns the current node name if retry needed, otherwise 'continue'
 */
export function checkRetry(state: CharacterCreationState, nodeName: string, maxRetries: number = 3): string {
  const progress = state.worldGenProgress;

  if (!progress || !progress.error) {
    return 'continue';
  }

  if (progress.retryCount < maxRetries) {
    logger.warn(`[Router] Retry required for ${nodeName}`, {
      attempt: progress.retryCount + 1,
      maxRetries,
      error: progress.error,
    });
    return nodeName;
  }

  // Max retries exceeded - restart from beginning
  logger.error(`[Router] Max retries exceeded for ${nodeName}, restarting from init`, {
    retryCount: progress.retryCount,
    maxRetries,
    error: progress.error,
  });
  return NODE_NAMES.INIT;
}

/**
 * Route after history summary completes
 * Goes to structures or skips if no structures expected
 */
export function routeAfterHistorySummary(state: CharacterCreationState): string {
  const hasStructures = (state.historyPeriods || []).some(
    (period) => period.structures && period.structures.length > 0
  );

  if (!hasStructures) {
    logger.info('[Router] No structures in history, skipping to lore');
    return NODE_NAMES.LORE;
  }

  logger.info('[Router] Proceeding to structure placement');
  return NODE_NAMES.STRUCTURES;
}
