/**
 * Structure Placer Service
 * Converts LLM's relative positions to absolute coordinates on the map
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import { logger } from '@/utils/logger';

interface RelativePosition {
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' | 'central';
  distance: 'near' | 'moderate' | 'far';
}

interface StructureWithRelative extends Structure {
  relativePosition?: RelativePosition | string; // Can be object or string like "northeast-far"
}

interface PlacementConstraints {
  mapWidth: number;
  mapHeight: number;
  minDistance: number; // Minimum distance between structures
}

/**
 * Place structures on grid using Poisson disc sampling for distribution
 * @param structures - Structures with relative positions from LLM
 * @param mapWidth - Map width in chunks
 * @param mapHeight - Map height in chunks
 * @param seed - Optional seed for deterministic placement (unused for now, reserved for future use)
 * @param customMinDistance - Optional custom minimum distance override
 * @returns Structures with absolute x, y coordinates
 */
export function placeStructuresOnGrid(
  structures: StructureWithRelative[],
  mapWidth: number,
  mapHeight: number,
  seed?: string,
  customMinDistance?: number
): Structure[] {
  logger.info(`[StructurePlacer] Placing ${structures.length} structures on ${mapWidth}x${mapHeight} map`, {
    seed: seed || 'default',
    customMinDistance,
  });

  const minDistance = customMinDistance || calculateMinDistance(structures.length, mapWidth, mapHeight);

  const constraints: PlacementConstraints = {
    mapWidth,
    mapHeight,
    minDistance,
  };

  const placedStructures: Structure[] = [];
  const occupiedPositions: Array<{ x: number; y: number; radius: number }> = [];

  // Calculate center point
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Place structures sequentially, respecting relative positions
  for (const structure of structures) {
    const position = calculatePosition(structure, centerX, centerY, constraints, occupiedPositions);

    // Calculate tile dimensions based on significance (1-10)
    const { width, height } = calculateStructureDimensions(structure.significance, structure.type);

    const placed: Structure = {
      ...structure,
      x: position.x,
      y: position.y,
      width,
      height,
    };

    // Store as occupied
    const radius = getStructureRadius(structure.size);
    occupiedPositions.push({ x: position.x, y: position.y, radius });

    placedStructures.push(placed);
    logger.debug(`[StructurePlacer] Placed ${structure.name} at (${position.x}, ${position.y}) [${width}x${height}]`);
  }

  return placedStructures;
}

/**
 * Calculate structure dimensions based on significance
 * Significance 1-10 maps to sizes from 16x16 to 128x128+
 */
function calculateStructureDimensions(significance: number, type: string): { width: number; height: number } {
  // Base size calculation: exponential growth
  // significance 1-3 → 16-24
  // significance 4-6 → 32-48
  // significance 7-9 → 64-96
  // significance 10 → 128+
  const baseSizeMap: Record<number, number> = {
    1: 16,
    2: 20,
    3: 24,
    4: 32,
    5: 40,
    6: 48,
    7: 64,
    8: 80,
    9: 96,
    10: 128,
  };

  const baseSize = baseSizeMap[significance] || 32;

  // Type modifiers for aspect ratio
  if (type === 'settlement') {
    // Settlements tend to be square or slightly wider
    return { width: baseSize, height: Math.floor(baseSize * 0.9) };
  } else if (type === 'dungeon') {
    // Dungeons are irregular but generally square
    return { width: baseSize, height: baseSize };
  } else if (type === 'landmark') {
    // Landmarks are smaller, more vertical
    return { width: Math.floor(baseSize * 0.7), height: Math.floor(baseSize * 0.8) };
  } else if (type === 'ruin') {
    // Ruins vary widely
    return { width: baseSize, height: Math.floor(baseSize * 0.85) };
  } else {
    // Natural features (forests, etc) can be large and irregular
    return { width: Math.floor(baseSize * 1.2), height: Math.floor(baseSize * 1.1) };
  }
}

/**
 * Parse relativePosition string into object
 * Supports formats: "northeast-far", "central-near", etc.
 */
function parseRelativePosition(relativePosition: RelativePosition | string | undefined): RelativePosition | null {
  if (!relativePosition) {
    return null;
  }

  // Already an object
  if (typeof relativePosition === 'object') {
    return relativePosition;
  }

  // Parse string format: "direction-distance"
  const parts = relativePosition.split('-');
  if (parts.length !== 2) {
    logger.warn(`[StructurePlacer] Invalid relativePosition format: ${relativePosition}`);
    return null;
  }

  const [direction, distance] = parts;

  // Validate direction
  const validDirections = [
    'north',
    'south',
    'east',
    'west',
    'northeast',
    'northwest',
    'southeast',
    'southwest',
    'central',
  ];
  if (!validDirections.includes(direction)) {
    logger.warn(`[StructurePlacer] Invalid direction: ${direction}`);
    return null;
  }

  // Validate distance
  const validDistances = ['near', 'moderate', 'far'];
  if (!validDistances.includes(distance)) {
    logger.warn(`[StructurePlacer] Invalid distance: ${distance}`);
    return null;
  }

  return {
    direction: direction as RelativePosition['direction'],
    distance: distance as RelativePosition['distance'],
  };
}

/**
 * Calculate absolute position from relative description
 */
function calculatePosition(
  structure: StructureWithRelative,
  centerX: number,
  centerY: number,
  constraints: PlacementConstraints,
  occupied: Array<{ x: number; y: number; radius: number }>
): { x: number; y: number } {
  // Parse relative position (handles both string and object formats)
  const relativePosition = parseRelativePosition(structure.relativePosition);

  // Default to center if no relative position
  if (!relativePosition) {
    return findNearestFreePosition(centerX, centerY, constraints, occupied);
  }

  // Calculate target position based on direction and distance
  const targetPosition = getTargetFromRelative(relativePosition, centerX, centerY, constraints);

  // Find nearest free position to target
  return findNearestFreePosition(targetPosition.x, targetPosition.y, constraints, occupied);
}

/**
 * Convert relative position to target coordinates
 */
function getTargetFromRelative(
  relative: RelativePosition,
  centerX: number,
  centerY: number,
  constraints: PlacementConstraints
): { x: number; y: number } {
  // Distance multipliers
  const distanceMap = {
    near: 0.2,
    moderate: 0.4,
    far: 0.7,
  };

  const distanceFactor = distanceMap[relative.distance];
  const maxDistance = Math.min(constraints.mapWidth, constraints.mapHeight) / 2;
  const distance = maxDistance * distanceFactor;

  // Direction angles (in radians)
  const directionMap: Record<string, number> = {
    north: -Math.PI / 2,
    south: Math.PI / 2,
    east: 0,
    west: Math.PI,
    northeast: -Math.PI / 4,
    northwest: (-3 * Math.PI) / 4,
    southeast: Math.PI / 4,
    southwest: (3 * Math.PI) / 4,
    central: 0,
  };

  const angle = directionMap[relative.direction];

  // Calculate target position
  let x = centerX;
  let y = centerY;

  if (relative.direction !== 'central') {
    x += Math.cos(angle) * distance;
    y += Math.sin(angle) * distance;
  }

  // Clamp to map bounds with margin
  const margin = 10;
  x = Math.max(margin, Math.min(constraints.mapWidth - margin, x));
  y = Math.max(margin, Math.min(constraints.mapHeight - margin, y));

  return { x, y };
}

/**
 * Find nearest position that doesn't overlap with existing structures
 */
function findNearestFreePosition(
  targetX: number,
  targetY: number,
  constraints: PlacementConstraints,
  occupied: Array<{ x: number; y: number; radius: number }>
): { x: number; y: number } {
  // If no occupied positions, return target
  if (occupied.length === 0) {
    return { x: targetX, y: targetY };
  }

  // Spiral search from target position
  const maxAttempts = 100;
  const spiralStep = constraints.minDistance / 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = (attempt / maxAttempts) * Math.PI * 4; // 2 full rotations
    const distance = attempt * spiralStep;

    const x = targetX + Math.cos(angle) * distance;
    const y = targetY + Math.sin(angle) * distance;

    // Check if within bounds
    if (x < 0 || x >= constraints.mapWidth || y < 0 || y >= constraints.mapHeight) {
      continue;
    }

    // Check if position is free
    if (isPositionFree(x, y, occupied, constraints.minDistance)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }

  // Fallback: return target (may overlap)
  logger.warn('[StructurePlacer] Could not find free position, placing at target (may overlap)');
  return { x: Math.round(targetX), y: Math.round(targetY) };
}

/**
 * Check if position is free from overlaps
 */
function isPositionFree(
  x: number,
  y: number,
  occupied: Array<{ x: number; y: number; radius: number }>,
  minDistance: number
): boolean {
  for (const occ of occupied) {
    const distance = Math.sqrt(Math.pow(x - occ.x, 2) + Math.pow(y - occ.y, 2));
    if (distance < minDistance + occ.radius) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate minimum distance based on structure density
 */
function calculateMinDistance(structureCount: number, mapWidth: number, mapHeight: number): number {
  const mapArea = mapWidth * mapHeight;
  const areaPerStructure = mapArea / Math.max(structureCount, 1);
  const baseDist = Math.sqrt(areaPerStructure) * 0.5;
  return Math.max(20, Math.min(100, baseDist)); // Clamp between 20-100 chunks
}

/**
 * Get radius based on structure size
 */
function getStructureRadius(size: 'tiny' | 'small' | 'medium' | 'large' | 'huge'): number {
  const radiusMap = {
    tiny: 5,
    small: 10,
    medium: 15,
    large: 25,
    huge: 40,
  };
  return radiusMap[size];
}
