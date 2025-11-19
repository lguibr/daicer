/**
 * World Config Graph Routing Logic
 * Conditional edge functions for terrain generation flow
 */

import type { WorldConfigState } from '@daicer/shared/graph-states';
import { logger } from '@/utils/logger';

/**
 * Determine if roads should be generated
 * Skips if roads disabled OR insufficient structures (< 2)
 *
 * @param state - Current WorldConfigState
 * @returns 'generate_roads' or 'collapse_terrain'
 */
export function shouldGenerateRoads(state: WorldConfigState): 'generate_roads' | 'collapse_terrain' {
  const { settings, structures } = state;

  if (!settings.enableRoads) {
    logger.debug('[routing] Skipping roads (disabled in settings)');
    return 'collapse_terrain';
  }

  if (structures.length < 2) {
    logger.debug('[routing] Skipping roads (< 2 structures)', { structureCount: structures.length });
    return 'collapse_terrain';
  }

  logger.debug('[routing] Generating roads', { structureCount: structures.length });
  return 'generate_roads';
}
