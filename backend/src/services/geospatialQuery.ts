/**
 * Geospatial Query Service
 * Rule 2: Player Vision is Geospatial and Layered
 * Queries entities and features by position and radius
 */

import type { GameState } from '@/graph/state';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface MapFeature {
  id: string;
  position: Position3D;
  type: string;
  name: string;
  description: string;
  isVisible: boolean;
}

export interface BiomeInfo {
  x: number;
  y: number;
  biome: string;
  elevation: number;
}

export interface GeospatialQueryResult {
  terrain: BiomeInfo[];
  features: MapFeature[];
  entities: Array<{ id: string; name: string; position: Position3D; type: 'player' | 'creature' | 'npc' }>;
}

/**
 * Calculate 2D distance between two positions
 */
function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get all entities and features within radius of a position
 * Respects z-layer filtering and visibility rules
 */
export function getEntitiesInRadius(
  gameState: GameState | null,
  center: Position3D,
  radius: number,
  viewMode: 'player' | 'dm' = 'player'
): GeospatialQueryResult {
  const result: GeospatialQueryResult = {
    terrain: [],
    features: [],
    entities: [],
  };

  if (!gameState) {
    return result;
  }

  // Query player entities (if in gameplay phase)
  if (gameState.players) {
    for (const player of gameState.players) {
      // Players don't have explicit position in gameplay state yet
      // This will be enhanced when position tracking is added
      if (player.character) {
        result.entities.push({
          id: player.id,
          name: player.character.name,
          position: { x: 0, y: 0, z: 0 }, // TODO: Add position tracking
          type: 'player',
        });
      }
    }
  }

  // Query creatures
  if (gameState.creatures) {
    for (const creature of gameState.creatures) {
      // Creatures also need position tracking
      result.entities.push({
        id: creature.name,
        name: creature.name,
        position: { x: 0, y: 0, z: 0 }, // TODO: Add position tracking
        type: 'creature',
      });
    }
  }

  // Query map features (if any exist in state)
  if (gameState.mapFeatures) {
    for (const feature of gameState.mapFeatures) {
      const distance = calculateDistance(center, feature.position);

      // Check if within radius
      if (distance <= radius) {
        // Check z-layer (same layer or within 1 layer)
        const zDiff = Math.abs(center.z - feature.position.z);
        if (zDiff <= 1) {
          // In player mode, only show visible features
          if (viewMode === 'dm' || feature.isVisible) {
            result.features.push(feature);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Query features for a specific tile
 */
export function getFeatureAtTile(gameState: GameState | null, position: Position3D): GeospatialQueryResult {
  return getEntitiesInRadius(gameState, position, 0.5, 'dm'); // 0.5 radius = same tile
}
