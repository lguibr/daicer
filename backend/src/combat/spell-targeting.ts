/**
 * @file backend/src/combat/spell-targeting.ts
 * @description CORE combat grid targeting calculations for spell effect shapes
 * @note These functions determine which squares are affected - critical for combat resolution
 */

import { SpellEffectShape } from '../types/spells';
import type { EffectDimensions, GridPosition } from '../types/spells';

/**
 * Convert feet to grid squares (5ft = 1 square)
 */
export function feetToSquares(feet: number): number {
  return Math.floor(feet / 5);
}

/**
 * Calculate Manhattan distance between two positions
 */
export function getManhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calculate Euclidean distance between two positions
 */
export function getEuclideanDistance(a: GridPosition, b: GridPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calculate Chebyshev distance (diagonal movement allowed)
 */
export function getChebyshevDistance(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * CONE: Calculate squares in cone emanating from caster
 * @param origin - Caster position
 * @param direction - Direction vector (normalized)
 * @param length - Cone length in feet
 * @returns Array of affected grid positions
 */
export function calculateConeArea(
  origin: GridPosition,
  direction: { x: number; y: number },
  length: number
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);

  // Normalize direction
  const mag = Math.sqrt(direction.x ** 2 + direction.y ** 2);
  const dx = direction.x / mag;
  const dy = direction.y / mag;

  // Cone spreads as it extends
  for (let distance = 1; distance <= squares; distance++) {
    const spread = Math.floor(distance / 2); // Cone width increases with distance

    for (let perpendicular = -spread; perpendicular <= spread; perpendicular++) {
      // Calculate perpendicular offset
      const px = -dy * perpendicular;
      const py = dx * perpendicular;

      // Calculate point along cone
      const x = Math.round(origin.x + dx * distance + px);
      const y = Math.round(origin.y + dy * distance + py);

      affected.push({ x, y });
    }
  }

  return affected;
}

/**
 * LINE: Calculate squares in straight line
 * @param start - Starting position (usually caster)
 * @param end - End position or direction
 * @param length - Line length in feet
 * @param width - Line width in feet (default 5)
 * @returns Array of affected grid positions
 */
export function calculateLineArea(
  start: GridPosition,
  end: GridPosition,
  length: number,
  width: number = 5
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);
  const widthSquares = Math.max(1, feetToSquares(width));

  // Direction vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const mag = Math.sqrt(dx ** 2 + dy ** 2);
  const dirX = dx / mag;
  const dirY = dy / mag;

  // Calculate line squares
  for (let dist = 0; dist <= squares; dist++) {
    for (let w = -Math.floor(widthSquares / 2); w <= Math.floor(widthSquares / 2); w++) {
      // Perpendicular offset for width
      const px = -dirY * w;
      const py = dirX * w;

      const x = Math.round(start.x + dirX * dist + px);
      const y = Math.round(start.y + dirY * dist + py);

      affected.push({ x, y });
    }
  }

  return affected;
}

/**
 * SPHERE: Calculate squares in radius around center point
 * @param center - Center of sphere
 * @param radius - Radius in feet
 * @param gridWidth - Grid boundary
 * @param gridHeight - Grid boundary
 * @returns Array of affected grid positions
 */
export function calculateSphereArea(
  center: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  const affected: GridPosition[] = [];
  const radiusSquares = feetToSquares(radius);

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const distance = getEuclideanDistance(center, { x, y });
      if (distance <= radiusSquares) {
        affected.push({ x, y });
      }
    }
  }

  return affected;
}

/**
 * CYLINDER: Calculate squares in vertical cylinder
 * @param center - Center of cylinder base
 * @param radius - Radius in feet
 * @param height - Height in feet (for multi-level grids)
 * @param gridWidth - Grid boundary
 * @param gridHeight - Grid boundary
 * @returns Array of affected grid positions
 */
export function calculateCylinderArea(
  center: GridPosition,
  radius: number,
  _height: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  // For 2D grid, cylinder is same as sphere
  // Height would matter for 3D/multi-level combat
  return calculateSphereArea(center, radius, gridWidth, gridHeight);
}

/**
 * CUBE: Calculate squares in cubic area
 * @param corner - Corner or center of cube
 * @param size - Cube side length in feet
 * @param centered - Whether position is center (true) or corner (false)
 * @returns Array of affected grid positions
 */
export function calculateCubeArea(corner: GridPosition, size: number, centered: boolean = false): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(size);

  const startX = centered ? corner.x - Math.floor(squares / 2) : corner.x;
  const startY = centered ? corner.y - Math.floor(squares / 2) : corner.y;

  for (let x = startX; x < startX + squares; x++) {
    for (let y = startY; y < startY + squares; y++) {
      affected.push({ x, y });
    }
  }

  return affected;
}

/**
 * WALL: Calculate squares for wall placement
 * @param points - Array of points defining the wall path
 * @param thickness - Wall thickness in feet
 * @returns Array of affected grid positions
 */
export function calculateWallArea(points: GridPosition[], thickness: number = 5): GridPosition[] {
  const affected: GridPosition[] = [];
  const thickSquares = Math.max(1, feetToSquares(thickness));

  if (points.length < 2) return affected;

  // For each segment of the wall
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    // eslint-disable-next-line no-continue
    if (!start || !end) continue;

    // Calculate squares along this segment
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let step = 0; step <= steps; step++) {
      const t = steps === 0 ? 0 : step / steps;
      const x = Math.round(start.x + dx * t);
      const y = Math.round(start.y + dy * t);

      // Add thickness
      for (let tx = -Math.floor(thickSquares / 2); tx <= Math.floor(thickSquares / 2); tx++) {
        for (let ty = -Math.floor(thickSquares / 2); ty <= Math.floor(thickSquares / 2); ty++) {
          affected.push({ x: x + tx, y: y + ty });
        }
      }
    }
  }

  return affected;
}

/**
 * SELF_AURA: Calculate moving aura around caster
 * @param casterPosition - Current caster position
 * @param radius - Aura radius in feet
 * @param gridWidth - Grid boundary
 * @param gridHeight - Grid boundary
 * @returns Array of affected grid positions
 */
export function calculateSelfAuraArea(
  casterPosition: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  return calculateSphereArea(casterPosition, radius, gridWidth, gridHeight);
}

/**
 * MELEE_TOUCH: Calculate adjacent squares (5ft reach)
 * @param casterPosition - Caster position
 * @param reach - Reach in feet (default 5)
 * @returns Array of reachable grid positions
 */
export function calculateMeleeTouchArea(casterPosition: GridPosition, reach: number = 5): GridPosition[] {
  const affected: GridPosition[] = [];
  const reachSquares = feetToSquares(reach);

  // All squares within reach (including diagonals)
  for (let x = casterPosition.x - reachSquares; x <= casterPosition.x + reachSquares; x++) {
    for (let y = casterPosition.y - reachSquares; y <= casterPosition.y + reachSquares; y++) {
      // Skip caster square
      if (x !== casterPosition.x || y !== casterPosition.y) {
        const distance = getChebyshevDistance(casterPosition, { x, y });
        if (distance <= reachSquares) {
          affected.push({ x, y });
        }
      }
    }
  }

  return affected;
}

/**
 * PROJECTILE_STRAIGHT: Calculate straight ray path (stops at first target)
 * @param start - Starting position
 * @param end - Target position
 * @param maxRange - Maximum range in feet
 * @returns Array of squares in projectile path
 */
export function calculateProjectilePath(start: GridPosition, end: GridPosition, maxRange: number): GridPosition[] {
  const affected: GridPosition[] = [];
  const maxSquares = feetToSquares(maxRange);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);

  if (distance > maxSquares) return affected; // Out of range

  const steps = Math.ceil(distance);
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = Math.round(start.x + dx * t);
    const y = Math.round(start.y + dy * t);
    affected.push({ x, y });

    // Could add logic to stop at first obstacle
  }

  return affected;
}

/**
 * Check line of sight between two positions
 * @param from - Starting position
 * @param to - Target position
 * @param blockedSquares - Squares that block LOS (walls, obstacles)
 * @returns Whether LOS exists
 */
export function hasLineOfSight(from: GridPosition, to: GridPosition, blockedSquares: GridPosition[]): boolean {
  const path = calculateProjectilePath(from, to, 1000); // Arbitrary large range

  // Check if any square in path is blocked
  for (const square of path) {
    if (square.x === to.x && square.y === to.y) {
      return true; // Reached target
    }

    if (blockedSquares.some((blocked) => blocked.x === square.x && blocked.y === square.y)) {
      return false; // Blocked
    }
  }

  return true;
}

/**
 * Get valid target squares for a spell
 * @param spell - Spell data
 * @param casterPosition - Caster's current position
 * @param range - Spell range in feet
 * @param gridWidth - Grid boundary
 * @param gridHeight - Grid boundary
 * @returns Squares that can be targeted
 */
export function getValidTargetSquares(
  effectShape: SpellEffectShape,
  casterPosition: GridPosition,
  range: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  const rangeSquares = feetToSquares(range);
  const valid: GridPosition[] = [];

  switch (effectShape) {
    case SpellEffectShape.SELF_ONLY:
    case SpellEffectShape.SELF_AURA:
      // No targeting needed
      return [];

    case SpellEffectShape.MELEE_TOUCH:
      // Adjacent squares only
      return calculateMeleeTouchArea(casterPosition);

    case SpellEffectShape.CONE:
    case SpellEffectShape.LINE:
    case SpellEffectShape.PROJECTILE_STRAIGHT:
      // Need direction, return all squares in range for direction selection
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          const dist = getChebyshevDistance(casterPosition, { x, y });
          if (dist > 0 && dist <= rangeSquares) {
            valid.push({ x, y });
          }
        }
      }
      return valid;

    case SpellEffectShape.RANGED_SINGLE:
    case SpellEffectShape.SPHERE:
    case SpellEffectShape.CYLINDER:
    case SpellEffectShape.CUBE:
      // Point/creature targeting within range
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          const dist = getEuclideanDistance(casterPosition, { x, y });
          if (dist <= rangeSquares) {
            valid.push({ x, y });
          }
        }
      }
      return valid;

    default:
      return [];
  }
}

/**
 * Calculate affected squares based on spell shape and target
 * THIS IS THE CORE FUNCTION USED BY COMBAT SYSTEM
 *
 * @param effectShape - Spell effect shape
 * @param dimensions - Effect dimensions
 * @param casterPosition - Caster's position
 * @param targetPosition - Target point/creature position
 * @param gridWidth - Grid width
 * @param gridHeight - Grid height
 * @returns All affected grid squares
 */
export function calculateAffectedSquares(
  effectShape: SpellEffectShape,
  dimensions: EffectDimensions,
  casterPosition: GridPosition,
  targetPosition: GridPosition,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  switch (effectShape) {
    case SpellEffectShape.SELF_ONLY:
      return [casterPosition];

    case SpellEffectShape.MELEE_TOUCH:
    case SpellEffectShape.RANGED_SINGLE:
      return [targetPosition];

    case SpellEffectShape.CONE:
      if (!dimensions.length) return [];
      return calculateConeArea(
        casterPosition,
        { x: targetPosition.x - casterPosition.x, y: targetPosition.y - casterPosition.y },
        dimensions.length
      );

    case SpellEffectShape.LINE:
      if (!dimensions.lineLength) return [];
      return calculateLineArea(casterPosition, targetPosition, dimensions.lineLength, dimensions.lineWidth || 5);

    case SpellEffectShape.SPHERE:
      if (!dimensions.radius) return [];
      return calculateSphereArea(targetPosition, dimensions.radius, gridWidth, gridHeight);

    case SpellEffectShape.CYLINDER:
      if (!dimensions.radius) return [];
      return calculateCylinderArea(targetPosition, dimensions.radius, dimensions.height || 0, gridWidth, gridHeight);

    case SpellEffectShape.CUBE:
      if (!dimensions.size) return [];
      return calculateCubeArea(targetPosition, dimensions.size, true);

    case SpellEffectShape.SELF_AURA:
      if (!dimensions.radius) return [];
      return calculateSelfAuraArea(casterPosition, dimensions.radius, gridWidth, gridHeight);

    case SpellEffectShape.PROJECTILE_STRAIGHT:
      if (!dimensions.lineLength) return [];
      return calculateProjectilePath(casterPosition, targetPosition, dimensions.lineLength);

    case SpellEffectShape.WALL:
      // Walls need custom point array - return empty for now
      return [];

    case SpellEffectShape.CHAIN:
    case SpellEffectShape.HEMISPHERE:
    case SpellEffectShape.CUSTOM:
      // Complex shapes need custom logic
      return [];

    default:
      return [];
  }
}

/**
 * Check if friendly fire is possible for this spell shape
 * @param effectShape - Spell effect shape
 * @returns Whether allies can be hit
 */
export function canCauseFriendlyFire(effectShape: SpellEffectShape): boolean {
  switch (effectShape) {
    case SpellEffectShape.MELEE_TOUCH:
    case SpellEffectShape.RANGED_SINGLE:
    case SpellEffectShape.PROJECTILE_STRAIGHT:
    case SpellEffectShape.SELF_ONLY:
      return false; // Single target or self - no friendly fire

    case SpellEffectShape.CONE:
    case SpellEffectShape.LINE:
    case SpellEffectShape.SPHERE:
    case SpellEffectShape.CYLINDER:
    case SpellEffectShape.CUBE:
    case SpellEffectShape.SELF_AURA:
    case SpellEffectShape.WALL:
      return true; // Area effects can hit allies

    default:
      return true; // Default to caution
  }
}

/**
 * Check if line of sight is required for this spell shape
 * @param effectShape - Spell effect shape
 * @returns Whether LOS is needed
 */
export function requiresLineOfSight(effectShape: SpellEffectShape): boolean {
  switch (effectShape) {
    case SpellEffectShape.SELF_ONLY:
    case SpellEffectShape.SELF_AURA:
      return false; // Self-cast

    case SpellEffectShape.PROJECTILE_STRAIGHT:
    case SpellEffectShape.CONE:
    case SpellEffectShape.LINE:
      return true; // Require clear path

    case SpellEffectShape.RANGED_SINGLE:
    case SpellEffectShape.MELEE_TOUCH:
      return true; // Must see target

    case SpellEffectShape.SPHERE:
    case SpellEffectShape.CYLINDER:
    case SpellEffectShape.CUBE:
      return true; // Usually require LOS to target point

    default:
      return true; // Default to requiring LOS
  }
}
