/* eslint-disable no-use-before-define, prefer-destructuring, max-lines-per-function, complexity */
/**
 * Dungeon Generation using BSP + Delaunay Triangulation + MST (TinyKeep Algorithm)
 *
 * Algorithm:
 * 1. Binary Space Partitioning - Split space recursively
 * 2. Room Scattering - Place rooms in leaf nodes with size variation
 * 3. Delaunay Triangulation - Connect all room centers
 * 4. Minimum Spanning Tree - Keep only essential connections
 * 5. Add back some Delaunay edges for loops/shortcuts
 * 6. Generate corridors between connected rooms
 */

import { SimplexNoise } from './noise';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Room extends Rectangle {
  id: number;
  centerX: number;
  centerY: number;
  connections: number[]; // IDs of connected rooms
  roomType: 'normal' | 'boss' | 'treasure' | 'spawn';
}

export interface Corridor {
  from: { x: number; y: number };
  to: { x: number; y: number };
  width: number;
}

export interface Dungeon {
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  tiles: number[][]; // 0=solid, 1=floor, 2=wall, 3=door
}

/**
 * BSP Node for recursive space partitioning
 */
class BSPNode {
  x: number;

  y: number;

  width: number;

  height: number;

  left: BSPNode | null = null;

  right: BSPNode | null = null;

  room: Room | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Split this node into two children
   */
  split(minSize: number, noise: SimplexNoise): boolean {
    if (this.left !== null || this.right !== null) {
      return false; // Already split
    }

    // Decide split direction based on aspect ratio
    const splitHorizontally = noise.noise(this.x, this.y) > 0.5 ? this.height > this.width : this.width > this.height;

    const max = (splitHorizontally ? this.height : this.width) - minSize;
    if (max <= minSize) {
      return false; // Too small to split
    }

    // Random split position
    const splitPos = Math.floor(noise.noise(this.x + this.width, this.y + this.height) * (max - minSize) + minSize);

    if (splitHorizontally) {
      this.left = new BSPNode(this.x, this.y, this.width, splitPos);
      this.right = new BSPNode(this.x, this.y + splitPos, this.width, this.height - splitPos);
    } else {
      this.left = new BSPNode(this.x, this.y, splitPos, this.height);
      this.right = new BSPNode(this.x + splitPos, this.y, this.width - splitPos, this.height);
    }

    return true;
  }

  /**
   * Get all leaf nodes (nodes without children)
   */
  getLeaves(): BSPNode[] {
    if (this.left === null && this.right === null) {
      return [this];
    }

    const leaves: BSPNode[] = [];
    if (this.left) leaves.push(...this.left.getLeaves());
    if (this.right) leaves.push(...this.right.getLeaves());
    return leaves;
  }
}

/**
 * Generate dungeon using BSP + Delaunay + MST
 */
export function generateDungeon(
  width: number,
  height: number,
  seed: string,
  options: {
    minRoomSize?: number;
    maxRoomSize?: number;
    roomPadding?: number;
    splits?: number;
    corridorWidth?: number;
    loopChance?: number; // 0-1, chance to add extra connections for loops
  } = {}
): Dungeon {
  const {
    minRoomSize = 5,
    maxRoomSize = 15,
    roomPadding = 2,
    splits = 4,
    corridorWidth = 2,
    loopChance = 0.15,
  } = options;

  const noise = new SimplexNoise(seed);
  const roomNoise = new SimplexNoise(`${seed}-rooms`);

  // Step 1: BSP - Split space
  const root = new BSPNode(0, 0, width, height);
  const minSize = minRoomSize + roomPadding * 2;

  for (let i = 0; i < splits; i += 1) {
    const leaves = root.getLeaves();
    for (const leaf of leaves) {
      if (leaf.width > minSize * 2 || leaf.height > minSize * 2) {
        leaf.split(minSize, noise);
      }
    }
  }

  // Step 2: Create rooms in leaves
  const leaves = root.getLeaves();
  const rooms: Room[] = [];
  let roomId = 0;

  for (const leaf of leaves) {
    const roomW = Math.floor(
      roomNoise.noise(leaf.x, leaf.y) * (maxRoomSize - minRoomSize) * 0.5 +
        minRoomSize +
        (maxRoomSize - minRoomSize) * 0.5
    );
    const roomH = Math.floor(
      roomNoise.noise(leaf.y, leaf.x) * (maxRoomSize - minRoomSize) * 0.5 +
        minRoomSize +
        (maxRoomSize - minRoomSize) * 0.5
    );

    const maxX = leaf.width - roomW - roomPadding;
    const maxY = leaf.height - roomH - roomPadding;

    if (maxX < roomPadding || maxY < roomPadding) continue; // eslint-disable-line no-continue

    const roomX = Math.floor(roomNoise.noise(leaf.x + 100, leaf.y + 100) * (maxX - roomPadding) + roomPadding);
    const roomY = Math.floor(roomNoise.noise(leaf.x + 200, leaf.y + 200) * (maxY - roomPadding) + roomPadding);

    const room: Room = {
      id: roomId,
      x: leaf.x + roomX,
      y: leaf.y + roomY,
      width: Math.min(roomW, leaf.width - roomX - roomPadding),
      height: Math.min(roomH, leaf.height - roomY - roomPadding),
      centerX: 0,
      centerY: 0,
      connections: [],
      roomType: 'normal',
    };

    room.centerX = room.x + Math.floor(room.width / 2);
    room.centerY = room.y + Math.floor(room.height / 2);

    rooms.push(room);
    leaf.room = room;
    roomId += 1;
  }

  if (rooms.length < 2) {
    // Not enough rooms, return empty dungeon
    return {
      width,
      height,
      rooms: [],
      corridors: [],
      tiles: Array(height)
        .fill(0)
        .map(() => Array(width).fill(0)),
    };
  }

  // Assign special room types
  if (rooms.length > 0 && rooms[0]) {
    rooms[0].roomType = 'spawn'; // First room is spawn
  }
  if (rooms.length > 3 && rooms[rooms.length - 1]) {
    const lastRoom = rooms[rooms.length - 1];
    if (lastRoom) lastRoom.roomType = 'boss'; // Last room is boss
  }
  if (rooms.length > 5) {
    const treasureIdx = Math.floor(rooms.length * 0.6);
    if (rooms[treasureIdx]) {
      rooms[treasureIdx].roomType = 'treasure';
    }
  }

  // Step 3: Delaunay Triangulation (simplified - use all pairs for small dungeons)
  const delaunayEdges: Array<[number, number, number]> = []; // [roomId1, roomId2, distance]

  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const roomI = rooms[i];
      const roomJ = rooms[j];
      if (roomI && roomJ) {
        const dx = roomI.centerX - roomJ.centerX;
        const dy = roomI.centerY - roomJ.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        delaunayEdges.push([i, j, dist]);
      }
    }
  }

  // Sort by distance
  delaunayEdges.sort((a, b) => a[2] - b[2]);

  // Step 4: Minimum Spanning Tree (Kruskal's algorithm)
  const parent: number[] = rooms.map((_, idx) => idx);

  function find(x: number): number {
    const px = parent[x];
    if (px !== undefined && px !== x) {
      parent[x] = find(px);
    }
    return parent[x] ?? x;
  }

  function union(x: number, y: number): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) {
      parent[px] = py;
    }
  }

  const mstEdges: Array<[number, number]> = [];

  for (const [i, j] of delaunayEdges) {
    if (find(i) !== find(j)) {
      union(i, j);
      mstEdges.push([i, j]);
      const roomI = rooms[i];
      const roomJ = rooms[j];
      if (roomI && roomJ) {
        roomI.connections.push(j);
        roomJ.connections.push(i);
      }
    }
  }

  // Step 5: Add some extra edges for loops
  for (const [i, j] of delaunayEdges) {
    if (!mstEdges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
      if (noise.noise(i * 100, j * 100) < loopChance) {
        const roomI = rooms[i];
        const roomJ = rooms[j];
        if (roomI && roomJ) {
          roomI.connections.push(j);
          roomJ.connections.push(i);
        }
      }
    }
  }

  // Step 6: Generate corridors
  const corridors: Corridor[] = [];
  const connected = new Set<string>();

  for (const room of rooms) {
    for (const connectedId of room.connections) {
      const key = [Math.min(room.id, connectedId), Math.max(room.id, connectedId)].join('-');
      if (connected.has(key)) continue; // eslint-disable-line no-continue
      connected.add(key);

      const other = rooms[connectedId];
      if (other) {
        corridors.push({
          from: { x: room.centerX, y: room.centerY },
          to: { x: other.centerX, y: other.centerY },
          width: corridorWidth,
        });
      }
    }
  }

  // Step 7: Build tile map
  const tiles: number[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(0));

  // Draw rooms
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y += 1) {
      for (let x = room.x; x < room.x + room.width; x += 1) {
        if (x >= 0 && x < width && y >= 0 && y < height && tiles[y]) {
          const row = tiles[y];
          if (row) row[x] = 1; // Floor
        }
      }
    }
  }

  // Draw corridors (L-shaped corridors)
  for (const corridor of corridors) {
    const { from, to } = corridor;

    // Horizontal first, then vertical (or vice versa based on noise)
    const horizontalFirst = noise.noise(from.x, from.y) > 0.5;

    if (horizontalFirst) {
      // Horizontal segment
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      for (let x = minX; x <= maxX; x += 1) {
        for (let dy = -Math.floor(corridor.width / 2); dy <= Math.floor(corridor.width / 2); dy += 1) {
          const y = from.y + dy;
          if (x >= 0 && x < width && y >= 0 && y < height && tiles[y]) {
            const row = tiles[y];
            if (row) row[x] = 1;
          }
        }
      }

      // Vertical segment
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);
      for (let y = minY; y <= maxY; y += 1) {
        for (let dx = -Math.floor(corridor.width / 2); dx <= Math.floor(corridor.width / 2); dx += 1) {
          const x = to.x + dx;
          if (x >= 0 && x < width && y >= 0 && y < height && tiles[y]) {
            const row = tiles[y];
            if (row) row[x] = 1;
          }
        }
      }
    } else {
      // Vertical first
      const minY = Math.min(from.y, to.y);
      const maxY = Math.max(from.y, to.y);
      for (let y = minY; y <= maxY; y += 1) {
        for (let dx = -Math.floor(corridor.width / 2); dx <= Math.floor(corridor.width / 2); dx += 1) {
          const x = from.x + dx;
          if (x >= 0 && x < width && y >= 0 && y < height && tiles[y]) {
            const row = tiles[y];
            if (row) row[x] = 1;
          }
        }
      }

      // Horizontal segment
      const minX = Math.min(from.x, to.x);
      const maxX = Math.max(from.x, to.x);
      for (let x = minX; x <= maxX; x += 1) {
        for (let dy = -Math.floor(corridor.width / 2); dy <= Math.floor(corridor.width / 2); dy += 1) {
          const y = to.y + dy;
          if (x >= 0 && x < width && y >= 0 && y < height && tiles[y]) {
            const row = tiles[y];
            if (row) row[x] = 1;
          }
        }
      }
    }
  }

  // Add walls around floors
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const row = tiles[y];
      if (row && row[x] === 1) {
        // Check neighbors for walls
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            const neighborRow = tiles[ny];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && neighborRow && neighborRow[nx] === 0) {
              neighborRow[nx] = 2; // Wall
            }
          }
        }
      }
    }
  }

  return {
    width,
    height,
    rooms,
    corridors,
    tiles,
  };
}

/**
 * Place dungeon in a world at a specific depth level (underground)
 */
export function placeDungeonInWorld(
  dungeon: Dungeon,
  worldX: number,
  worldY: number,
  worldZ: number // Should be negative (underground)
): Array<{ x: number; y: number; z: number; blockType: string }> {
  const blocks: Array<{ x: number; y: number; z: number; blockType: string }> = [];

  for (let y = 0; y < dungeon.height; y += 1) {
    for (let x = 0; x < dungeon.width; x += 1) {
      const row = dungeon.tiles[y];
      if (!row) continue; // eslint-disable-line no-continue
      const tile = row[x];
      if (tile === undefined) continue; // eslint-disable-line no-continue
      const wx = worldX + x;
      const wy = worldY + y;
      const wz = worldZ;

      if (tile === 1) {
        // Floor
        blocks.push({ x: wx, y: wy, z: wz, blockType: 'stone_bricks' });
        blocks.push({ x: wx, y: wy, z: wz + 1, blockType: 'air' });
        blocks.push({ x: wx, y: wy, z: wz + 2, blockType: 'air' });
        blocks.push({ x: wx, y: wy, z: wz + 3, blockType: 'stone_bricks' });
      } else if (tile === 2) {
        // Wall
        blocks.push({ x: wx, y: wy, z: wz, blockType: 'stone_bricks' });
        blocks.push({ x: wx, y: wy, z: wz + 1, blockType: 'stone_bricks' });
        blocks.push({ x: wx, y: wy, z: wz + 2, blockType: 'stone_bricks' });
        blocks.push({ x: wx, y: wy, z: wz + 3, blockType: 'stone_bricks' });
      }
      // tile === 0 is solid rock (no change)
    }
  }

  return blocks;
}
