/**
 * Structures Placement Node (Section 2: World Config)
 * Generates and places structures on the map grid using seed-based deterministic algorithms
 * NO DEPENDENCY on era/history generation - world terrain can generate independently
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { placeStructuresOnGrid } from '@/services/world-gen/structure-placer';
import type { WorldConfigState } from '@daicer/shared/graph-states';

/**
 * Generate and place structures on map grid using seed-based generation
 * Structures are generated deterministically from seed + parameters
 * This allows terrain to generate without waiting for history/era generation
 */
export const placeStructuresNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, settings } = state;

  // Use deterministic seed from settings (falls back to roomId if not provided)
  const seed = settings.seed || roomId;

  // Get structure parameters from settings
  const params = settings.generationParams || {};
  const maxStructures = params.maxStructures || 10;
  const minDistance = params.structureMinDistance || 30;

  logger.info('[place_structures] Generating structures from seed', {
    roomId,
    seed,
    maxStructures,
    minDistance,
  });

  // Map dimensions (default 512x512 chunks)
  const mapWidth = 512;
  const mapHeight = 512;

  // Generate structures directly from seed (no history dependency)
  // For now, generate empty array - structures will be added by placeStructuresOnGrid
  // if we have structures from history, or we skip them entirely
  const inputStructures: any[] = [];

  // Place structures on grid (this function handles seed-based generation internally)
  const placedStructures = placeStructuresOnGrid(inputStructures, mapWidth, mapHeight, seed, minDistance);

  logger.info('[place_structures] Structures generated and placed', {
    count: placedStructures.length,
    sample: placedStructures.map((s) => `${s.name} @ (${s.x}, ${s.y})`).slice(0, 5),
  });

  return {
    structures: placedStructures,
  };
};
