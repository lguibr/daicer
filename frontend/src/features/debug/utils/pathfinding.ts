import { Coordinates, ZLevel } from './types';

interface TileNode {
  x: number;
  y: number;
  z: ZLevel;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: TileNode | null;
}

export interface PathStep extends Coordinates {
  cost: number;
}

/**
 * A* Pathfinding Algorithm
 */
export const findPath = (
  start: Coordinates,
  end: Coordinates,
  getTile: (x: number, y: number, z: number) => { isWalkable: boolean; cost?: number } | null,
  maxIterations = 1000
): PathStep[] | null => {
  // If start and end are the same, return empty path
  if (start.x === end.x && start.y === end.y && start.z === end.z) {
    return [];
  }

  const openList: TileNode[] = [];
  const closedList: Set<string> = new Set();

  const heuristic = (a: Coordinates, b: Coordinates) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  const startNode: TileNode = {
    ...start,
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  openList.push(startNode);

  let iterations = 0;

  while (openList.length > 0) {
    iterations++;
    if (iterations > maxIterations) return null;

    openList.sort((a, b) => a.f - b.f);
    const storedCurrent = openList.shift();
    if (!storedCurrent) break;
    const current = storedCurrent;

    const key = `${current.x},${current.y},${current.z}`;
    closedList.add(key);

    if (current.x === end.x && current.y === end.y && current.z === end.z) {
      const path: PathStep[] = [];
      let curr: TileNode | null = current;
      while (curr) {
        path.unshift({
          x: curr.x,
          y: curr.y,
          z: curr.z,
          cost: curr.g,
        });
        curr = curr.parent;
      }
      return path;
    }

    const neighbors = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
    ];

    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const nz = current.z; // Flat movement

      if (closedList.has(`${nx},${ny},${nz}`)) continue;

      const tile = getTile(nx, ny, nz);

      if (!tile || !tile.isWalkable) continue;

      const stepCost = dx !== 0 && dy !== 0 ? 1.414 : 1;
      const terrainCost = tile.cost || 0;
      const gScore = current.g + stepCost + terrainCost;

      const existing = openList.find((n) => n.x === nx && n.y === ny && n.z === nz);
      if (existing && existing.g <= gScore) continue;

      const neighbor: TileNode = {
        x: nx,
        y: ny,
        z: nz,
        g: gScore,
        h: heuristic({ x: nx, y: ny, z: nz } as Coordinates, end),
        f: 0,
        parent: current,
      };
      neighbor.f = neighbor.g + neighbor.h;

      if (!existing) {
        openList.push(neighbor);
      } else {
        existing.g = neighbor.g;
        existing.f = neighbor.f;
        existing.parent = neighbor.parent;
      }
    }
  }

  return null;
};

export const calculatePathLength = (path: PathStep[]): number => {
  if (path.length <= 1) return 0;
  const lastStep = path[path.length - 1];
  return lastStep ? lastStep.cost : 0;
};
