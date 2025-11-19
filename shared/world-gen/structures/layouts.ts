/**
 * Structure Layout Generation
 * Provides algorithms for generating rich, detailed structure interiors
 */

import type { StructureTile, StructureMaterial, StructureFloor } from './types';
import { Alea } from '../noise/alea';
import { generateBSPLayout } from '../bsp';
import { generateCaveCA } from '../cellular-automata';

/**
 * Room definition for BSP-based layouts
 */
interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generate a multi-room layout using Binary Space Partitioning
 * Perfect for houses, castles, temples with rectangular rooms
 */
export function generateRoomLayout(
  width: number,
  height: number,
  floor: StructureFloor,
  material: StructureMaterial,
  seed: string,
  minRoomSize = 3
): StructureTile[][] {
  const rng = Alea(seed);
  const grid: StructureTile[][] = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ material, tileType: 'empty' as const, floor }))
    );

  // Generate rooms using BSP
  const rooms = generateBSPLayout(width, height, seed, {
    minRoomSize,
    maxRoomSize: Math.max(minRoomSize + 4, width / 2),
  });

  if (!rooms || rooms.length === 0) {
    // Fallback: create a simple room
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        grid[y][x] = { material, tileType: 'floor', floor };
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          grid[y][x] = { material, tileType: 'wall', floor };
        }
      }
    }
    // Add a door
    grid[0][Math.floor(width / 2)] = { material, tileType: 'door', floor };
    return grid;
  }

  // Place floors in rooms
  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + room.height && ry < height; ry++) {
      for (let rx = room.x; rx < room.x + room.width && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          grid[ry][rx] = { material, tileType: 'floor', floor };
        }
      }
    }
  }

  // Place walls around rooms
  for (const room of rooms) {
    for (let ry = room.y - 1; ry <= room.y + room.height && ry < height; ry++) {
      for (let rx = room.x - 1; rx <= room.x + room.width && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          if (ry === room.y - 1 || ry === room.y + room.height || rx === room.x - 1 || rx === room.x + room.width) {
            if (grid[ry][rx].tileType === 'empty') {
              grid[ry][rx] = { material, tileType: 'wall', floor };
            }
          }
        }
      }
    }
  }

  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const roomA = rooms[i];
    const roomB = rooms[i + 1];
    const centerA = {
      x: Math.floor(roomA.x + roomA.width / 2),
      y: Math.floor(roomA.y + roomA.height / 2),
    };
    const centerB = {
      x: Math.floor(roomB.x + roomB.width / 2),
      y: Math.floor(roomB.y + roomB.height / 2),
    };

    // Simple L-shaped corridor
    let currentX = centerA.x;
    let currentY = centerA.y;

    // Horizontal then vertical
    while (currentX !== centerB.x) {
      if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
        if (grid[currentY][currentX].tileType === 'empty') {
          grid[currentY][currentX] = { material, tileType: 'floor', floor };
        }
        // Add walls beside corridor
        if (currentY > 0 && grid[currentY - 1][currentX].tileType === 'empty') {
          grid[currentY - 1][currentX] = { material, tileType: 'wall', floor };
        }
        if (currentY < height - 1 && grid[currentY + 1][currentX].tileType === 'empty') {
          grid[currentY + 1][currentX] = { material, tileType: 'wall', floor };
        }
      }
      currentX += currentX < centerB.x ? 1 : -1;
    }

    while (currentY !== centerB.y) {
      if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
        if (grid[currentY][currentX].tileType === 'empty') {
          grid[currentY][currentX] = { material, tileType: 'floor', floor };
        }
        // Add walls beside corridor
        if (currentX > 0 && grid[currentY][currentX - 1].tileType === 'empty') {
          grid[currentY][currentX - 1] = { material, tileType: 'wall', floor };
        }
        if (currentX < width - 1 && grid[currentY][currentX + 1].tileType === 'empty') {
          grid[currentY][currentX + 1] = { material, tileType: 'wall', floor };
        }
      }
      currentY += currentY < centerB.y ? 1 : -1;
    }
  }

  // Place doors at room entrances (random wall tiles)
  for (const room of rooms) {
    // Try to place 1-2 doors per room
    const numDoors = Math.floor(rng() * 2) + 1;
    for (let d = 0; d < numDoors; d++) {
      const side = Math.floor(rng() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let doorX = room.x;
      let doorY = room.y;

      if (side === 0) {
        doorX = room.x + Math.floor(rng() * room.width);
        doorY = room.y;
      } else if (side === 1) {
        doorX = room.x + room.width - 1;
        doorY = room.y + Math.floor(rng() * room.height);
      } else if (side === 2) {
        doorX = room.x + Math.floor(rng() * room.width);
        doorY = room.y + room.height - 1;
      } else {
        doorX = room.x;
        doorY = room.y + Math.floor(rng() * room.height);
      }

      if (doorX >= 0 && doorX < width && doorY >= 0 && doorY < height) {
        if (grid[doorY][doorX].tileType === 'wall') {
          // Check if there's floor on both sides
          const hasFloorNearby =
            (doorY > 0 && grid[doorY - 1][doorX].tileType === 'floor') ||
            (doorY < height - 1 && grid[doorY + 1][doorX].tileType === 'floor') ||
            (doorX > 0 && grid[doorY][doorX - 1].tileType === 'floor') ||
            (doorX < width - 1 && grid[doorY][doorX + 1].tileType === 'floor');

          if (hasFloorNearby) {
            grid[doorY][doorX] = { material, tileType: 'door', floor };
          }
        }
      }
    }
  }

  return grid;
}

/**
 * Generate an organic layout using simple pattern-based generation
 * Perfect for temples with symmetrical patterns
 * Note: WFC is complex for this use case, using simpler approach
 */
export function generateWFCLayout(
  width: number,
  height: number,
  floor: StructureFloor,
  material: StructureMaterial,
  seed: string
): StructureTile[][] {
  const rng = Alea(seed);

  // Create a simple symmetrical temple layout instead of full WFC
  const grid: StructureTile[][] = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ material, tileType: 'empty' as const, floor }))
    );

  // Create a symmetrical cross pattern (typical temple layout)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const corridorWidth = Math.max(2, Math.floor(width / 8));

  // Horizontal corridor
  for (let y = centerY - corridorWidth; y <= centerY + corridorWidth; y++) {
    for (let x = 0; x < width; x++) {
      if (y >= 0 && y < height) {
        grid[y][x] = { material, tileType: 'floor', floor };
      }
    }
  }

  // Vertical corridor
  for (let x = centerX - corridorWidth; x <= centerX + corridorWidth; x++) {
    for (let y = 0; y < height; y++) {
      if (x >= 0 && x < width) {
        grid[y][x] = { material, tileType: 'floor', floor };
      }
    }
  }

  // Add rooms at the four corners
  const roomSize = Math.min(Math.floor(width / 3), Math.floor(height / 3));
  const rooms = [
    { x: 1, y: 1 }, // Top-left
    { x: width - roomSize - 1, y: 1 }, // Top-right
    { x: 1, y: height - roomSize - 1 }, // Bottom-left
    { x: width - roomSize - 1, y: height - roomSize - 1 }, // Bottom-right
  ];

  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + roomSize && ry < height; ry++) {
      for (let rx = room.x; rx < room.x + roomSize && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          grid[ry][rx] = { material, tileType: 'floor', floor };
        }
      }
    }
  }

  // Place walls around the perimeter and around floor areas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].tileType === 'floor') {
        // Check neighbors for walls
        const neighbors = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
        ];

        for (const { dx, dy } of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (grid[ny][nx].tileType === 'empty') {
              grid[ny][nx] = { material, tileType: 'wall', floor };
            }
          }
        }
      }
    }
  }

  // Add doors at cardinal directions
  const doors = [
    { x: centerX, y: 0 }, // North
    { x: width - 1, y: centerY }, // East
    { x: centerX, y: height - 1 }, // South
    { x: 0, y: centerY }, // West
  ];

  for (const door of doors) {
    if (door.x >= 0 && door.x < width && door.y >= 0 && door.y < height) {
      if (grid[door.y][door.x].tileType === 'wall') {
        grid[door.y][door.x] = { material, tileType: 'door', floor };
      }
    }
  }

  return grid;
}

/**
 * Generate an organic cave-like layout using Cellular Automata
 * Perfect for dungeons, natural caves
 */
export function generateCALayout(
  width: number,
  height: number,
  floor: StructureFloor,
  material: StructureMaterial,
  seed: string,
  fillProbability = 0.45,
  smoothingIterations = 4
): StructureTile[][] {
  // Generate cave using CA - returns boolean[][] (true = solid/wall, false = empty/floor)
  const caGrid = generateCaveCA(width, height, seed, {
    fillPercentage: fillProbability,
    iterations: smoothingIterations,
    birthLimit: 4,
    deathLimit: 3,
  });

  // Convert to structure tiles
  const grid: StructureTile[][] = Array(height)
    .fill(null)
    .map(() =>
      Array(width)
        .fill(null)
        .map(() => ({ material, tileType: 'empty' as const, floor }))
    );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!caGrid[y][x]) {
        // false = Open space = floor
        grid[y][x] = { material, tileType: 'floor', floor };
      } else {
        // true = Walls
        grid[y][x] = { material, tileType: 'wall', floor };
      }
    }
  }

  // Add some doors at random wall positions adjacent to floors
  const rng = Alea(seed + '_doors');
  const numDoors = Math.floor(rng() * 3) + 1;

  for (let d = 0; d < numDoors; d++) {
    const attempts = 100;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const x = Math.floor(rng() * width);
      const y = Math.floor(rng() * height);

      if (grid[y][x].tileType === 'wall') {
        // Check if adjacent to floor
        const hasFloor =
          (y > 0 && grid[y - 1][x].tileType === 'floor') ||
          (y < height - 1 && grid[y + 1][x].tileType === 'floor') ||
          (x > 0 && grid[y][x - 1].tileType === 'floor') ||
          (x < width - 1 && grid[y][x + 1].tileType === 'floor');

        if (hasFloor) {
          grid[y][x] = { material, tileType: 'door', floor };
          break;
        }
      }
    }
  }

  return grid;
}

/**
 * Helper: Add stairs connecting two floors
 */
export function addStairs(
  lowerFloorGrid: StructureTile[][],
  upperFloorGrid: StructureTile[][],
  lowerFloor: StructureFloor,
  upperFloor: StructureFloor,
  material: StructureMaterial,
  seed: string
): void {
  const rng = Alea(seed + '_stairs');
  const height = lowerFloorGrid.length;
  const width = lowerFloorGrid[0]?.length ?? 0;

  // Find a suitable location for stairs (must have floor on both levels)
  const attempts = 100;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = Math.floor(rng() * (width - 2)) + 1;
    const y = Math.floor(rng() * (height - 2)) + 1;

    if (lowerFloorGrid[y][x].tileType === 'floor' && upperFloorGrid[y][x].tileType === 'floor') {
      // Place stairs
      lowerFloorGrid[y][x] = { material, tileType: 'stairs', floor: lowerFloor };
      upperFloorGrid[y][x] = { material, tileType: 'stairs', floor: upperFloor };
      return;
    }
  }
}
