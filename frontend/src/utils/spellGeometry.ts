import type { GridPosition } from '../types/spells';

const FEET_PER_SQUARE = 5;

function feetToSquares(feet: number): number {
  return Math.floor(feet / FEET_PER_SQUARE);
}

export function calculateConeArea(
  origin: GridPosition,
  direction: { x: number; y: number },
  length: number
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);

  const magnitude = Math.hypot(direction.x, direction.y) || 1;
  const dirX = direction.x / magnitude;
  const dirY = direction.y / magnitude;

  for (let distance = 1; distance <= squares; distance += 1) {
    const spread = Math.floor(distance / 2);

    for (let perpendicular = -spread; perpendicular <= spread; perpendicular += 1) {
      const offsetX = -dirY * perpendicular;
      const offsetY = dirX * perpendicular;

      const x = Math.round(origin.x + dirX * distance + offsetX);
      const y = Math.round(origin.y + dirY * distance + offsetY);

      affected.push({ x, y });
    }
  }

  return affected;
}

export function calculateLineArea(
  start: GridPosition,
  end: GridPosition,
  length: number,
  width: number = FEET_PER_SQUARE
): GridPosition[] {
  const affected: GridPosition[] = [];
  const squares = feetToSquares(length);
  const widthSquares = Math.max(1, feetToSquares(width));

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const magnitude = Math.hypot(deltaX, deltaY) || 1;
  const dirX = deltaX / magnitude;
  const dirY = deltaY / magnitude;

  for (let distance = 0; distance <= squares; distance += 1) {
    for (let w = -Math.floor(widthSquares / 2); w <= Math.floor(widthSquares / 2); w += 1) {
      const offsetX = -dirY * w;
      const offsetY = dirX * w;

      const x = Math.round(start.x + dirX * distance + offsetX);
      const y = Math.round(start.y + dirY * distance + offsetY);

      affected.push({ x, y });
    }
  }

  return affected;
}

function euclideanDistance(a: GridPosition, b: GridPosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function calculateSphereArea(
  center: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] {
  const affected: GridPosition[] = [];
  const radiusSquares = feetToSquares(radius);

  for (let x = 0; x < gridWidth; x += 1) {
    for (let y = 0; y < gridHeight; y += 1) {
      if (euclideanDistance(center, { x, y }) <= radiusSquares) {
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

  for (let x = startX; x < startX + squares; x += 1) {
    for (let y = startY; y < startY + squares; y += 1) {
      affected.push({ x, y });
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

export function calculateMeleeTouchArea(casterPosition: GridPosition): GridPosition[] {
  const adjacentOffsets: GridPosition[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  return adjacentOffsets.map((offset) => ({
    x: casterPosition.x + offset.x,
    y: casterPosition.y + offset.y,
  }));
}
