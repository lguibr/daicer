import { Point3D, calculateDistance } from '../utils/geometry';

export type CollisionCheck = (point: Point3D) => boolean;

/**
 * Checks Line of Sight using Bresenham's Algorithm (3D Step).
 * Returns true if NO obstacles are found between start and end.
 * @param start
 * @param end
 * @param isBlocked Function returning true if a voxel/point is blocked
 */
export function hasLineOfSight(start: Point3D, end: Point3D, isBlocked: CollisionCheck): boolean {
  let { x: x0, y: y0, z: z0 } = start;
  const { x: x1, y: y1, z: z1 } = end;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const dz = Math.abs(z1 - z0);

  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  const sz = z0 < z1 ? 1 : -1;

  // Driving axis is the one with max difference
  if (dx >= dy && dx >= dz) {
    let p1 = 2 * dy - dx;
    let p2 = 2 * dz - dx;
    while (x0 !== x1) {
      x0 += sx;
      if (p1 >= 0) {
        y0 += sy;
        p1 -= 2 * dx;
      }
      if (p2 >= 0) {
        z0 += sz;
        p2 -= 2 * dx;
      }
      p1 += 2 * dy;
      p2 += 2 * dz;
      if (isBlocked({ x: x0, y: y0, z: z0 })) return false;
    }
  } else if (dy >= dx && dy >= dz) {
    let p1 = 2 * dx - dy;
    let p2 = 2 * dz - dy;
    while (y0 !== y1) {
      y0 += sy;
      if (p1 >= 0) {
        x0 += sx;
        p1 -= 2 * dy;
      }
      if (p2 >= 0) {
        z0 += sz;
        p2 -= 2 * dy;
      }
      p1 += 2 * dx;
      p2 += 2 * dz;
      if (isBlocked({ x: x0, y: y0, z: z0 })) return false;
    }
  } else {
    let p1 = 2 * dy - dz;
    let p2 = 2 * dx - dz;
    while (z0 !== z1) {
      z0 += sz;
      if (p1 >= 0) {
        y0 += sy;
        p1 -= 2 * dz;
      }
      if (p2 >= 0) {
        x0 += sx;
        p2 -= 2 * dz;
      }
      p1 += 2 * dy;
      p2 += 2 * dx;
      if (isBlocked({ x: x0, y: y0, z: z0 })) return false;
    }
  }

  return true;
}

/**
 * A* Pathfinding (Simplified for Grid).
 * Assumes integer coordinates.
 * @param maxIterations Safety break
 */
export function findPath(start: Point3D, end: Point3D, isBlocked: CollisionCheck, maxIterations = 1000): Point3D[] {
  // 1. Setup
  const openSet: Node[] = [];
  const closedSet = new Set<string>();
  const startNode = new Node(start, null, 0, calculateDistance(start, end));
  openSet.push(startNode);

  let iterations = 0;

  while (openSet.length > 0) {
    iterations++;
    if (iterations > maxIterations) break; // Fail safe

    // Sort by fCost (lowest first)
    openSet.sort((a, b) => a.fCost - b.fCost);
    const current = openSet.shift()!;

    const key = `${current.pos.x},${current.pos.y},${current.pos.z}`;
    closedSet.add(key);

    // Found Goal?
    // Use loose equality for floats if needed, but grid assumes Int.
    if (
      Math.round(current.pos.x) === Math.round(end.x) &&
      Math.round(current.pos.y) === Math.round(end.y) &&
      Math.round(current.pos.z) === Math.round(end.z)
    ) {
      return reconstructPath(current);
    }

    // Neighbors (6 directions + diagonals? 5e usually 8 neighbors in 2D, 26 in 3D?)
    // Standard D&D 5ft diagonals = 1 square (or 1.5).
    // Let's assume 2D movement logic (+Z via gravity/jump later) or full 3D?
    // User asked for "walkable". Usually 2D neighbors (8).
    const neighbors = getNeighbors(current.pos);

    for (const neighborPos of neighbors) {
      const nKey = `${neighborPos.x},${neighborPos.y},${neighborPos.z}`;
      if (closedSet.has(nKey)) continue;
      if (isBlocked(neighborPos)) continue;

      const gCost = current.gCost + calculateDistance(current.pos, neighborPos); // Diagonals support
      const hCost = calculateDistance(neighborPos, end);
      const newNode = new Node(neighborPos, current, gCost, hCost);

      const existingOpen = openSet.find((n) => n.key === nKey);
      if (existingOpen) {
        if (gCost < existingOpen.gCost) {
          existingOpen.gCost = gCost;
          existingOpen.parent = current;
        }
      } else {
        openSet.push(newNode);
      }
    }
  }

  return []; // No path found
}

class Node {
  constructor(
    public pos: Point3D,
    public parent: Node | null,
    public gCost: number, // Distance from start
    public hCost: number // Heuristic to end
  ) {}

  get fCost() {
    return this.gCost + this.hCost;
  }
  get key() {
    return `${this.pos.x},${this.pos.y},${this.pos.z}`;
  }
}

function getNeighbors(p: Point3D): Point3D[] {
  const res: Point3D[] = [];
  // 8-Way 2D movement (Z assumed constant for "Walking", step logic omitted for MVP)
  // Could add Z neighbors if climbing.
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      res.push({ x: p.x + dx, y: p.y + dy, z: p.z });
    }
  }
  return res;
}

function reconstructPath(node: Node): Point3D[] {
  const path: Point3D[] = [];
  let curr: Node | null = node;
  while (curr) {
    path.push(curr.pos);
    curr = curr.parent;
  }
  return path.reverse();
}
