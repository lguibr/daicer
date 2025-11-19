/**
 * Binary Space Partitioning (BSP) Room Generator
 * Generates non-overlapping room layouts for building interiors
 */

import { Alea } from './noise';
import { logger } from '@/utils/logger';

export interface BSPRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  isLeaf: boolean;
  children?: [BSPRoom, BSPRoom];
  doorPositions?: Array<{ x: number; y: number; direction: 'north' | 'south' | 'east' | 'west' }>;
}

export interface BSPParams {
  minRoomSize?: number; // Minimum room dimension (default 4)
  maxRoomSize?: number; // Maximum room dimension (default 12)
  splitRatio?: number; // How even splits are (0.5 = exactly half, default 0.4-0.6)
}

/**
 * Generate BSP room layout
 * Returns tree of rooms and leaf rooms suitable for interior generation
 */
export function generateBSPLayout(width: number, height: number, seed: string, params: BSPParams = {}): BSPRoom[] {
  const { minRoomSize = 4, maxRoomSize = 12, splitRatio = 0.5 } = params;

  logger.debug(`[BSP] Generating layout for ${width}x${height} area with seed: ${seed}`);

  const rng = Alea(seed);

  // Create root container
  const root: BSPRoom = {
    x: 0,
    y: 0,
    width,
    height,
    isLeaf: true,
  };

  // Recursively split
  splitRoom(root, minRoomSize, maxRoomSize, splitRatio, rng);

  // Extract leaf rooms (actual rooms, not containers)
  const leafRooms = extractLeafRooms(root);

  // Add doors between adjacent rooms
  addDoorsBetweenRooms(leafRooms, rng);

  logger.debug(`[BSP] Generated ${leafRooms.length} rooms`);
  return leafRooms;
}

/**
 * Recursively split a room using BSP
 */
function splitRoom(room: BSPRoom, minSize: number, maxSize: number, splitRatio: number, rng: () => number): void {
  // Stop if room is small enough
  if (room.width <= maxSize && room.height <= maxSize) {
    room.isLeaf = true;
    return;
  }

  // Determine split direction
  const canSplitHorizontally = room.height >= minSize * 2;
  const canSplitVertically = room.width >= minSize * 2;

  if (!canSplitHorizontally && !canSplitVertically) {
    room.isLeaf = true;
    return;
  }

  let splitHorizontally: boolean;
  if (canSplitHorizontally && !canSplitVertically) {
    splitHorizontally = true;
  } else if (!canSplitHorizontally && canSplitVertically) {
    splitHorizontally = false;
  } else {
    // Both possible, choose based on aspect ratio
    splitHorizontally = room.height > room.width;
  }

  // Calculate split position (with randomness around ratio)
  const varianceRange = 0.2; // ±20% from splitRatio
  const variance = (rng() - 0.5) * varianceRange;
  const actualRatio = Math.max(0.3, Math.min(0.7, splitRatio + variance));

  if (splitHorizontally) {
    const splitY = Math.floor(room.height * actualRatio);

    // Ensure both children meet minimum size
    if (splitY < minSize || room.height - splitY < minSize) {
      room.isLeaf = true;
      return;
    }

    room.isLeaf = false;
    room.children = [
      { x: room.x, y: room.y, width: room.width, height: splitY, isLeaf: true },
      { x: room.x, y: room.y + splitY, width: room.width, height: room.height - splitY, isLeaf: true },
    ];
  } else {
    const splitX = Math.floor(room.width * actualRatio);

    // Ensure both children meet minimum size
    if (splitX < minSize || room.width - splitX < minSize) {
      room.isLeaf = true;
      return;
    }

    room.isLeaf = false;
    room.children = [
      { x: room.x, y: room.y, width: splitX, height: room.height, isLeaf: true },
      { x: room.x + splitX, y: room.y, width: room.width - splitX, height: room.height, isLeaf: true },
    ];
  }

  // Recursively split children
  if (room.children) {
    splitRoom(room.children[0], minSize, maxSize, splitRatio, rng);
    splitRoom(room.children[1], minSize, maxSize, splitRatio, rng);
  }
}

/**
 * Extract all leaf rooms from BSP tree
 */
function extractLeafRooms(root: BSPRoom): BSPRoom[] {
  const leaves: BSPRoom[] = [];

  function traverse(room: BSPRoom) {
    if (room.isLeaf) {
      leaves.push(room);
    } else if (room.children) {
      traverse(room.children[0]);
      traverse(room.children[1]);
    }
  }

  traverse(root);
  return leaves;
}

/**
 * Add doors between adjacent rooms
 * Ensures all rooms are connected
 */
function addDoorsBetweenRooms(rooms: BSPRoom[], rng: () => number): void {
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const room1 = rooms[i];
      const room2 = rooms[j];

      // Check if rooms are adjacent
      const adjacency = checkAdjacency(room1, room2);

      if (adjacency) {
        // Add door at random position along shared edge
        const doorPos = calculateDoorPosition(room1, room2, adjacency.direction, rng);

        if (!room1.doorPositions) room1.doorPositions = [];
        room1.doorPositions.push({ ...doorPos, direction: adjacency.direction });
      }
    }
  }
}

/**
 * Check if two rooms are adjacent (share an edge)
 */
function checkAdjacency(room1: BSPRoom, room2: BSPRoom): { direction: 'north' | 'south' | 'east' | 'west' } | null {
  // Check if room1 is north of room2
  if (room1.y + room1.height === room2.y && doRangesOverlap(room1.x, room1.width, room2.x, room2.width)) {
    return { direction: 'south' };
  }

  // Check if room1 is south of room2
  if (room2.y + room2.height === room1.y && doRangesOverlap(room1.x, room1.width, room2.x, room2.width)) {
    return { direction: 'north' };
  }

  // Check if room1 is west of room2
  if (room1.x + room1.width === room2.x && doRangesOverlap(room1.y, room1.height, room2.y, room2.height)) {
    return { direction: 'east' };
  }

  // Check if room1 is east of room2
  if (room2.x + room2.width === room1.x && doRangesOverlap(room1.y, room1.height, room2.y, room2.height)) {
    return { direction: 'west' };
  }

  return null;
}

/**
 * Check if two 1D ranges overlap
 */
function doRangesOverlap(start1: number, len1: number, start2: number, len2: number): boolean {
  return start1 < start2 + len2 && start1 + len1 > start2;
}

/**
 * Calculate door position along shared edge
 */
function calculateDoorPosition(
  room1: BSPRoom,
  room2: BSPRoom,
  direction: 'north' | 'south' | 'east' | 'west',
  rng: () => number
): { x: number; y: number } {
  if (direction === 'north' || direction === 'south') {
    // Vertical door
    const overlapStart = Math.max(room1.x, room2.x);
    const overlapEnd = Math.min(room1.x + room1.width, room2.x + room2.width);
    const doorX = Math.floor(overlapStart + rng() * (overlapEnd - overlapStart));
    const doorY = direction === 'south' ? room1.y + room1.height : room1.y;
    return { x: doorX, y: doorY };
  } else {
    // Horizontal door
    const overlapStart = Math.max(room1.y, room2.y);
    const overlapEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
    const doorY = Math.floor(overlapStart + rng() * (overlapEnd - overlapStart));
    const doorX = direction === 'east' ? room1.x + room1.width : room1.x;
    return { x: doorX, y: doorY };
  }
}
