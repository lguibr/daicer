/**
 * A* Pathfinding for Road Generation
 * Finds optimal paths between structures for road placement
 */

interface Point {
  x: number;
  y: number;
}

interface PathNode extends Point {
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * Manhattan distance heuristic
 */
function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Get terrain cost multiplier for a biome type
 * Higher cost = less desirable for roads
 */
function getTerrainCost(biome: string): number {
  // Structure biomes: avoid completely
  if (biome.startsWith('structure_')) {
    return 1000;
  }

  // Terrain costs
  const costs: Record<string, number> = {
    plains: 1,
    grassland: 1,
    desert: 1.5,
    savanna: 1.2,
    forest: 2,
    jungle: 3,
    swamp: 4,
    hills: 3,
    mountains: 10,
    ocean: 100,
    water: 100,
    lake: 100,
    river: 50,
    frozen_ocean: 100,
    frozen_river: 50,
    beach: 1.5,
    tundra: 2,
    taiga: 2.5,
  };

  return costs[biome] || 5;
}

/**
 * A* pathfinding algorithm
 * Returns array of points from start to goal, or null if no path found
 */
export function findPath(
  start: Point,
  goal: Point,
  biomeGrid: string[][],
  maxIterations: number = 10000
): Point[] | null {
  const width = biomeGrid[0]?.length || 0;
  const height = biomeGrid.length || 0;

  if (
    start.x < 0 ||
    start.y < 0 ||
    start.x >= width ||
    start.y >= height ||
    goal.x < 0 ||
    goal.y < 0 ||
    goal.x >= width ||
    goal.y >= height
  ) {
    return null;
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    ...start,
    g: 0,
    h: manhattan(start, goal),
    f: manhattan(start, goal),
    parent: null,
  };

  openSet.push(startNode);

  let iterations = 0;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    const key = `${current.x},${current.y}`;
    closedSet.add(key);

    // Check neighbors (4-directional)
    const neighbors: Point[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      // Out of bounds
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) {
        continue;
      }

      const neighborKey = `${neighbor.x},${neighbor.y}`;

      // Already evaluated
      if (closedSet.has(neighborKey)) {
        continue;
      }

      const row = biomeGrid[neighbor.y];
      const biome = (row && row[neighbor.x]) || 'plains';
      const terrainCost = getTerrainCost(biome);

      const tentativeG = current.g + terrainCost;

      // Check if already in open set
      const existingNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);

      if (existingNode) {
        // Found a better path to this node
        if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      } else {
        // Add new node to open set
        const neighborNode: PathNode = {
          ...neighbor,
          g: tentativeG,
          h: manhattan(neighbor, goal),
          f: tentativeG + manhattan(neighbor, goal),
          parent: current,
        };
        openSet.push(neighborNode);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Generate road paths between all structures
 * Returns array of road tile coordinates
 */
export function generateRoadPaths(
  structures: Array<{ worldX: number; worldY: number; width: number; height: number }>,
  biomeGrid: string[][],
  _seed: string
): Point[] {
  if (structures.length < 2) {
    return [];
  }

  const roadTiles = new Set<string>();

  // Connect each structure to its nearest neighbor(s)
  for (let i = 0; i < structures.length; i++) {
    const structA = structures[i];
    if (!structA) continue;

    const centerA = {
      x: Math.floor(structA.worldX + structA.width / 2),
      y: Math.floor(structA.worldY + structA.height / 2),
    };

    // Find nearest structure
    let nearestDist = Infinity;
    let nearestIndex = -1;

    for (let j = 0; j < structures.length; j++) {
      if (i === j) continue;

      const structB = structures[j];
      if (!structB) continue;

      const centerB = {
        x: Math.floor(structB.worldX + structB.width / 2),
        y: Math.floor(structB.worldY + structB.height / 2),
      };

      const dist = manhattan(centerA, centerB);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = j;
      }
    }

    if (nearestIndex === -1) continue;

    const structB = structures[nearestIndex];
    if (!structB) continue;

    const centerB = {
      x: Math.floor(structB.worldX + structB.width / 2),
      y: Math.floor(structB.worldY + structB.height / 2),
    };

    // Find path
    const path = findPath(centerA, centerB, biomeGrid);
    if (path) {
      for (const point of path) {
        roadTiles.add(`${point.x},${point.y}`);
      }
    }
  }

  return Array.from(roadTiles).map((key) => {
    const parts = key.split(',').map(Number);
    return { x: parts[0]!, y: parts[1]! };
  });
}
