/**
 * @file backend/src/shared/spell-geometry.ts
 * @description Shared spell geometry utilities used by both backend and frontend.
 */

export type SpellEffectShape =
  | 'melee_touch'
  | 'ranged_single'
  | 'projectile_straight'
  | 'cone'
  | 'line'
  | 'sphere'
  | 'cylinder'
  | 'cube'
  | 'hemisphere'
  | 'self_only'
  | 'self_aura'
  | 'wall'
  | 'chain'
  | 'custom';

export interface GridPosition {
  x: number;
  y: number;
}

export interface EffectDimensions {
  radius?: number;
  height?: number;
  length?: number;
  lineLength?: number;
  lineWidth?: number;
  size?: number;
  maxLength?: number;
  wallHeight?: number;
  thickness?: number;
}

export function feetToSquares(feet: number): number {
  return Math.floor(feet / 5);
}

export function getManhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getEuclideanDistance(a: GridPosition, b: GridPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getChebyshevDistance(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function calculateConeArea(
  origin: GridPosition,
  direction: { x: number; y: number },
  length: number
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);

  const mag = Math.sqrt(direction.x ** 2 + direction.y ** 2);
  const dx = direction.x / (mag || 1);
  const dy = direction.y / (mag || 1);

  for (let distance = 1; distance <= squares; distance++) {
    const spread = Math.floor(distance / 2);

    for (let perpendicular = -spread; perpendicular <= spread; perpendicular++) {
      const px = -dy * perpendicular;
      const py = dx * perpendicular;

      const x = Math.round(origin.x + dx * distance + px);
      const y = Math.round(origin.y + dy * distance + py);

      affected.push({ x, y });
    }
  }

  return affected;
}

export function calculateLineArea(
  start: GridPosition,
  end: GridPosition,
  length: number,
  width: number = 5
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);
  const widthSquares = Math.max(1, feetToSquares(width));

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const mag = Math.sqrt(dx ** 2 + dy ** 2);
  const dirX = dx / (mag || 1);
  const dirY = dy / (mag || 1);

  for (let dist = 0; dist <= squares; dist++) {
    for (let w = -Math.floor(widthSquares / 2); w <= Math.floor(widthSquares / 2); w++) {
      const px = -dirY * w;
      const py = dirX * w;

      const x = Math.round(start.x + dirX * dist + px);
      const y = Math.round(start.y + dirY * dist + py);

      affected.push({ x, y });
    }
  }

  return affected;
}

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

export function calculateCylinderArea(
  center: GridPosition,
  radius: number,
  _height: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  return calculateSphereArea(center, radius, gridWidth, gridHeight);
}

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

export function calculateWallArea(points: GridPosition[], thickness: number = 5): GridPosition[] {
  const affected: GridPosition[] = [];
  const thickSquares = Math.max(1, feetToSquares(thickness));

  if (points.length < 2) return affected;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (!start || !end) continue; // eslint-disable-line no-continue

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let step = 0; step <= steps; step++) {
      const t = steps === 0 ? 0 : step / steps;
      const x = Math.round(start.x + dx * t);
      const y = Math.round(start.y + dy * t);

      for (let tx = -Math.floor(thickSquares / 2); tx <= Math.floor(thickSquares / 2); tx++) {
        for (let ty = -Math.floor(thickSquares / 2); ty <= Math.floor(thickSquares / 2); ty++) {
          affected.push({ x: x + tx, y: y + ty });
        }
      }
    }
  }

  return affected;
}

export function calculateSelfAuraArea(
  casterPosition: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  return calculateSphereArea(casterPosition, radius, gridWidth, gridHeight);
}

export function calculateMeleeTouchArea(casterPosition: GridPosition, reach: number = 5): GridPosition[] {
  const affected: GridPosition[] = [];
  const reachSquares = feetToSquares(reach);

  for (let x = casterPosition.x - reachSquares; x <= casterPosition.x + reachSquares; x++) {
    for (let y = casterPosition.y - reachSquares; y <= casterPosition.y + reachSquares; y++) {
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

export function calculateProjectilePath(start: GridPosition, end: GridPosition, maxRange: number): GridPosition[] {
  const affected: GridPosition[] = [];
  const maxSquares = feetToSquares(maxRange);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);

  if (distance > maxSquares) return affected;

  const steps = Math.ceil(distance);
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const x = Math.round(start.x + dx * t);
    const y = Math.round(start.y + dy * t);
    affected.push({ x, y });
  }

  return affected;
}

export function hasLineOfSight(from: GridPosition, to: GridPosition, blockedSquares: GridPosition[]): boolean {
  const path = calculateProjectilePath(from, to, 1000);

  for (const square of path) {
    if (square.x === to.x && square.y === to.y) {
      return true;
    }

    if (blockedSquares.some((blocked) => blocked.x === square.x && blocked.y === square.y)) {
      return false;
    }
  }

  return true;
}

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
    case 'self_only':
    case 'self_aura':
      return [];

    case 'melee_touch':
      return calculateMeleeTouchArea(casterPosition);

    case 'cone':
    case 'line':
    case 'projectile_straight':
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          const dist = getChebyshevDistance(casterPosition, { x, y });
          if (dist > 0 && dist <= rangeSquares) {
            valid.push({ x, y });
          }
        }
      }
      return valid;

    case 'ranged_single':
    case 'sphere':
    case 'cylinder':
    case 'cube':
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

export function calculateAffectedSquares(
  effectShape: SpellEffectShape,
  dimensions: EffectDimensions,
  casterPosition: GridPosition,
  targetPosition: GridPosition,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  switch (effectShape) {
    case 'self_only':
      return [casterPosition];

    case 'melee_touch':
    case 'ranged_single':
      return [targetPosition];

    case 'cone':
      if (!dimensions.length) return [];
      return calculateConeArea(
        casterPosition,
        { x: targetPosition.x - casterPosition.x, y: targetPosition.y - casterPosition.y },
        dimensions.length
      );

    case 'line':
      if (!dimensions.lineLength) return [];
      return calculateLineArea(casterPosition, targetPosition, dimensions.lineLength, dimensions.lineWidth || 5);

    case 'sphere':
      if (!dimensions.radius) return [];
      return calculateSphereArea(targetPosition, dimensions.radius, gridWidth, gridHeight);

    case 'cylinder':
      if (!dimensions.radius) return [];
      return calculateCylinderArea(targetPosition, dimensions.radius, dimensions.height || 0, gridWidth, gridHeight);

    case 'cube':
      if (!dimensions.size) return [];
      return calculateCubeArea(targetPosition, dimensions.size, true);

    case 'self_aura':
      if (!dimensions.radius) return [];
      return calculateSelfAuraArea(casterPosition, dimensions.radius, gridWidth, gridHeight);

    case 'projectile_straight':
      if (!dimensions.lineLength) return [];
      return calculateProjectilePath(casterPosition, targetPosition, dimensions.lineLength);

    case 'wall':
      return [];

    case 'chain':
    case 'hemisphere':
    case 'custom':
    default:
      return [];
  }
}

export function canCauseFriendlyFire(effectShape: SpellEffectShape): boolean {
  switch (effectShape) {
    case 'melee_touch':
    case 'ranged_single':
    case 'projectile_straight':
    case 'self_only':
      return false;

    case 'cone':
    case 'line':
    case 'sphere':
    case 'cylinder':
    case 'cube':
    case 'self_aura':
    case 'wall':
      return true;

    default:
      return true;
  }
}

export function requiresLineOfSight(effectShape: SpellEffectShape): boolean {
  switch (effectShape) {
    case 'self_only':
    case 'self_aura':
      return false;

    case 'projectile_straight':
    case 'cone':
    case 'line':
      return true;

    case 'ranged_single':
    case 'melee_touch':
      return true;

    case 'sphere':
    case 'cylinder':
    case 'cube':
      return true;

    default:
      return true;
  }
}
