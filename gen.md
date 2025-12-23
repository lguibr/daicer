File: README.md
""""""
# World Generation Toolkit

Framework-agnostic procedural generation algorithms for DAICE.

## Overview

This module provides all the core algorithms used for world generation:

- **Simplex Noise** - Organic terrain generation (temperature, moisture, elevation, erosion)
- **Cellular Automata** - Cave and cavern systems
- **Binary Space Partitioning (BSP)** - Dungeon room layouts
- **Voronoi + Poisson Disc** - Natural feature distribution and biome regions
- **Wave Function Collapse (WFC)** - Constraint-based structure generation

All algorithms are:

- **Deterministic** - Same seed produces same output
- **Framework-agnostic** - No React, no Winston logger, no LangGraph dependencies
- **Frontend-compatible** - Can run in browser or Node.js
- **Callback-based** - Optional `onDebug`, `onProgress` callbacks for debugging

## Installation

```bash
yarn workspace @daicer/shared add fast-simplex-noise
```

## Usage

### Simplex Noise

```typescript
import { SimplexNoise, Alea } from '@daicer/shared/world-gen/noise';

const noise = new SimplexNoise('my-seed');

// Basic 2D noise
const value = noise.noise(x, y); // -1 to 1

// Octave noise (Fractal Brownian Motion)
const terrain = noise.octaveNoise(x * 0.01, y * 0.01, 4, 0.5, 2.0);

// Domain warping for organic shapes
const warped = noise.domainWarpedNoise(x, y, 0.5, 4);

// Ridge noise for mountains
const mountains = noise.ridgeNoise(x, y, 4);
```

### Cellular Automata

```typescript
import { generateCaveCA } from '@daicer/shared/world-gen/cellular-automata';

const cave = generateCaveCA(
  50,
  50, // width, height
  'cave-seed',
  {
    fillPercentage: 0.45,
    iterations: 5,
    birthLimit: 4,
    deathLimit: 3,
  },
  {
    onProgress: (iter, max) => console.log(`Iteration ${iter}/${max}`),
  }
);

// cave is boolean[][] where true = solid rock, false = air
```

### Binary Space Partitioning

```typescript
import { generateBSPLayout } from '@daicer/shared/world-gen/bsp';

const rooms = generateBSPLayout(
  80,
  60, // width, height
  'dungeon-seed',
  {
    minRoomSize: 4,
    maxRoomSize: 12,
    splitRatio: 0.5,
  }
);

// rooms is BSPRoom[] with x, y, width, height, doorPositions
```

### Voronoi and Poisson Disc

```typescript
import { poissonDiskSampling2D, findNearestVoronoiSeed } from '@daicer/shared/world-gen/voronoi';

// Generate evenly-spaced points
const points = poissonDiskSampling2D(
  100,
  100, // width, height
  10, // min distance
  30, // max attempts
  'feature-seed'
);

// Find nearest Voronoi seed
const nearest = findNearestVoronoiSeed(x, y, points);
```

### Wave Function Collapse

```typescript
import { collapseGrid, getPresetTiles } from '@daicer/shared/world-gen/wfc';

const tiles = getPresetTiles('castle');

const result = collapseGrid(
  20,
  20, // width, height
  tiles,
  'castle-seed',
  1000, // max iterations
  {
    onCollapse: (x, y, tileId) => console.log(`Collapsed (${x},${y}) to ${tileId}`),
    onDebug: (msg) => console.log(msg),
  }
);

if (result.success) {
  // result.grid is string[][] of tile IDs
  console.log('Generated successfully in', result.iterations, 'iterations');
}
```

## Deterministic Generation

All algorithms use the Alea PRNG for deterministic results:

```typescript
import { Alea } from '@daicer/shared/world-gen/noise';

const rng = Alea('my-seed');
const random1 = rng(); // Same seed = same sequence
const random2 = rng();
```

## Integration with Backend

Backend services can wrap these algorithms with logging:

```typescript
import { generateCaveCA } from '@daicer/shared/world-gen/cellular-automata';
import { logger } from '@/utils/logger';

export function generateCaveWithLogging(width: number, height: number, seed: string) {
  return generateCaveCA(
    width,
    height,
    seed,
    {},
    {
      onDebug: (msg) => logger.debug(`[CA] ${msg}`),
      onProgress: (iter, max) => logger.debug(`[CA] Iteration ${iter}/${max}`),
    }
  );
}
```

## Testing

All modules include unit tests in `__tests__/` directories:

```bash
yarn workspace @daicer/shared test world-gen
```

## Performance

- **Simplex Noise**: ~1ms for 100x100 grid (4 octaves)
- **Cellular Automata**: ~50ms for 100x100 grid (5 iterations)
- **BSP**: ~5ms for 80x60 area
- **Poisson Disc**: ~100ms for 100x100 area (min distance 10)
- **WFC**: ~500ms for 20x20 grid (depends on tile constraints)

## References

- [Fast Simplex Noise](https://www.npmjs.com/package/fast-simplex-noise)
- [Cellular Automata for Cave Generation](https://roguebasin.com/index.php/Cellular_Automata_Method_for_Generating_Random_Cave-Like_Levels)
- [Binary Space Partitioning](https://eskerda.com/bsp-dungeon-generation/)
- [Poisson Disc Sampling](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)
- [Wave Function Collapse](https://github.com/mxgmn/WaveFunctionCollapse)
""""""


File: bsp/bsp-generator.ts
""""""
/**
 * Binary Space Partitioning (BSP) Room Generator
 * Generates non-overlapping room layouts for building interiors
 * Framework-agnostic implementation with optional callbacks
 */

import { Alea } from '../noise/alea';
import type { BSPRoom, BSPParams, BSPGeneratorOptions } from './types';

/**
 * Generate BSP room layout
 * Returns tree of rooms and leaf rooms suitable for interior generation
 */
export function generateBSPLayout(
  width: number,
  height: number,
  seed: string,
  params: BSPParams = {},
  options?: BSPGeneratorOptions
): BSPRoom[] {
  const { minRoomSize = 4, maxRoomSize = 12, splitRatio = 0.5 } = params;

  options?.onDebug?.(`Generating layout for ${width}x${height} area with seed: ${seed}`);

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
  splitRoom(root, minRoomSize, maxRoomSize, splitRatio, rng, options);

  // Extract leaf rooms (actual rooms, not containers)
  const leafRooms = extractLeafRooms(root);

  // Add doors between adjacent rooms
  addDoorsBetweenRooms(leafRooms, rng);

  options?.onDebug?.(`Generated ${leafRooms.length} rooms`);
  return leafRooms;
}

/**
 * Recursively split a room using BSP
 */
function splitRoom(
  room: BSPRoom,
  minSize: number,
  maxSize: number,
  splitRatio: number,
  rng: () => number,
  options?: BSPGeneratorOptions
): void {
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

  options?.onSplit?.(room, splitHorizontally);

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
    const child0 = room.children[0];
    const child1 = room.children[1];
    if (child0) splitRoom(child0, minSize, maxSize, splitRatio, rng, options);
    if (child1) splitRoom(child1, minSize, maxSize, splitRatio, rng, options);
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
      const child0 = room.children[0];
      const child1 = room.children[1];
      if (child0) traverse(child0);
      if (child1) traverse(child1);
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

      if (!room1 || !room2) continue;

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
  }
  // Horizontal door
  const overlapStart = Math.max(room1.y, room2.y);
  const overlapEnd = Math.min(room1.y + room1.height, room2.y + room2.height);
  const doorY = Math.floor(overlapStart + rng() * (overlapEnd - overlapStart));
  const doorX = direction === 'east' ? room1.x + room1.width : room1.x;
  return { x: doorX, y: doorY };
}
""""""


File: bsp/index.ts
""""""
/**
 * BSP (Binary Space Partitioning) Module
 * Exports BSP room generation functionality
 */

export { generateBSPLayout } from './bsp-generator';
export type { BSPRoom, BSPParams, BSPGeneratorOptions } from './types';
""""""


File: bsp/types.ts
""""""
/**
 * BSP (Binary Space Partitioning) Types
 */

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
  /** Minimum room dimension (default 4) */
  minRoomSize?: number;
  /** Maximum room dimension (default 12) */
  maxRoomSize?: number;
  /** How even splits are (0.5 = exactly half, default 0.4-0.6) */
  splitRatio?: number;
}

export interface BSPGeneratorOptions {
  /** Optional callback for split events */
  onSplit?: (room: BSPRoom, horizontal: boolean) => void;
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}
""""""


File: cellular-automata/ca-generator.ts
""""""
/**
 * Cellular Automata Cave Generator
 * Generates organic cave systems using CA rules (inspired by Dwarf Fortress)
 * Framework-agnostic implementation with optional callbacks
 */

import { Alea } from '../noise/alea';
import type { CAParams, CAGeneratorOptions } from './types';

/**
 * Generate a cave system using cellular automata
 * Returns a boolean grid where true = solid rock, false = cave/air
 */
export function generateCaveCA(
  width: number,
  height: number,
  seed: string,
  params: CAParams = {},
  options?: CAGeneratorOptions
): boolean[][] {
  const { fillPercentage = 0.45, iterations = 5, birthLimit = 4, deathLimit = 3 } = params;

  options?.onDebug?.(`Generating ${width}x${height} cave with seed: ${seed}`);

  const rng = Alea(seed);

  // Step 1: Random initialization
  let grid = initializeRandomGrid(width, height, fillPercentage, rng);

  // Step 2: Apply CA rules iteratively
  for (let i = 0; i < iterations; i++) {
    options?.onProgress?.(i + 1, iterations);
    grid = applyCAStep(grid, birthLimit, deathLimit);
  }

  // Step 3: Remove small isolated regions (optional cleanup)
  grid = removeSmallRegions(grid, 5);

  options?.onDebug?.(`Cave generation complete`);

  return grid;
}

/**
 * Initialize grid with random fill
 */
function initializeRandomGrid(width: number, height: number, fillPercentage: number, rng: () => number): boolean[][] {
  const grid: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const isSolid = rng() < fillPercentage;
      row.push(isSolid);
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Apply one iteration of CA rules
 * Rule: A cell becomes solid if birthLimit or more neighbors are solid,
 * stays solid if deathLimit or more neighbors are solid
 */
function applyCAStep(grid: boolean[][], birthLimit: number, deathLimit: number): boolean[][] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const newGrid: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const neighbors = countSolidNeighbors(grid, x, y);

      const currentRow = grid[y];
      const currentCell = currentRow ? currentRow[x] : false;

      // Apply CA rule
      if (currentCell) {
        // Currently solid
        row.push(neighbors >= deathLimit);
      } else {
        // Currently empty
        row.push(neighbors >= birthLimit);
      }
    }
    newGrid.push(row);
  }

  return newGrid;
}

/**
 * Count solid neighbors (8-way)
 */
function countSolidNeighbors(grid: boolean[][], x: number, y: number): number {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip self

      const nx = x + dx;
      const ny = y + dy;

      // Treat out-of-bounds as solid (creates cave walls at edges)
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        count++;
        continue;
      }

      // Safe access
      const row = grid[ny];
      if (row && row[nx]) count++;
    }
  }

  return count;
}

/**
 * Remove small isolated regions (flood fill)
 * Removes cave pockets smaller than minSize
 */
function removeSmallRegions(grid: boolean[][], minSize: number): boolean[][] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const result = grid.map((row) => [...row]); // Deep copy

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check visited or solid safely
      const rowVisited = visited[y];
      if (!rowVisited || rowVisited[x]) continue;

      const rowGrid = grid[y];
      if (!rowGrid || rowGrid[x]) continue;

      // Flood fill to find region size
      const region = floodFill(grid, x, y, visited);

      // If region too small, fill it in
      if (region.length < minSize) {
        for (const pos of region) {
          const resultRow = result[pos.y];
          if (resultRow) resultRow[pos.x] = true; // Make solid
        }
      }
    }
  }

  return result;
}

/**
 * Flood fill to find connected region
 */
function floodFill(
  grid: boolean[][],
  startX: number,
  startY: number,
  visited: boolean[][]
): Array<{ x: number; y: number }> {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const region: Array<{ x: number; y: number }> = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const pos = queue.shift()!;

    if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) continue;

    // Check visited safely
    const visitedRow = visited[pos.y];
    if (visitedRow && visitedRow[pos.x]) continue;

    // Check solid safely
    const gridRow = grid[pos.y];
    if (gridRow && gridRow[pos.x]) continue; // Solid, not part of cave

    if (visitedRow) visitedRow[pos.x] = true;
    region.push(pos);

    // Add 4-way neighbors
    queue.push({ x: pos.x + 1, y: pos.y });
    queue.push({ x: pos.x - 1, y: pos.y });
    queue.push({ x: pos.x, y: pos.y + 1 });
    queue.push({ x: pos.x, y: pos.y - 1 });
  }

  return region;
}

/**
 * Convert CA grid to cave tiles
 * Inverts the grid (true in CA = solid becomes false = cave in output)
 */
export function caToCaveGrid(caGrid: boolean[][]): boolean[][] {
  return caGrid.map((row) => row.map((cell) => !cell)); // Invert
}
""""""


File: cellular-automata/index.ts
""""""
/**
 * Cellular Automata Module
 * Exports CA cave generation functionality
 */

export { generateCaveCA, caToCaveGrid } from './ca-generator';
export type { CAParams, CAGeneratorOptions } from './types';
""""""


File: cellular-automata/types.ts
""""""
/**
 * Cellular Automata Parameters
 */
export interface CAParams {
  /** Initial random fill percentage (default 45%) */
  fillPercentage?: number;
  /** Number of smoothing iterations (default 5) */
  iterations?: number;
  /** Neighbors needed to become solid (default 4) */
  birthLimit?: number;
  /** Neighbors needed to stay solid (default 3) */
  deathLimit?: number;
}

/**
 * Options for CA generation
 */
export interface CAGeneratorOptions {
  /** Optional callback for progress updates */
  onProgress?: (iteration: number, maxIterations: number) => void;
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}
""""""


File: index.ts
""""""
/**
 * World Generation Toolkit
 * Framework-agnostic procedural generation algorithms
 *
 * This module contains all the core algorithms used for world generation in DAICE:
 * - Simplex Noise for organic terrain
 * - Cellular Automata for cave systems
 * - Binary Space Partitioning for room layouts
 * - Voronoi and Poisson Disc for natural feature distribution
 * - Wave Function Collapse for constraint-based structure generation
 */

// Noise generation
export * from './noise';

// Cellular Automata
export * from './cellular-automata';

// Binary Space Partitioning
export * from './bsp';

// Voronoi and Poisson Disc
export * from './voronoi';

// Wave Function Collapse
export * from './wfc';

// Structures
export * from './structures';

// Utilities
export * from './utils';

// Simple Generation (Parity)
export * from './simple-gen';
""""""


File: noise/alea.ts
""""""
/**
 * Alea PRNG (Pseudo-Random Number Generator)
 * Based on Johannes Baagøe's algorithm
 * Provides deterministic random numbers from a seed
 */

export function Alea(...args: (string | number)[]): () => number {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = (): ((data: string | number) => number) => {
    let n = 0xefc8249d;
    return (data: string | number) => {
      const str = String(data);
      for (let i = 0; i < str.length; i += 1) {
        n += str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        let h = 0.02519603282416938 * n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        h *= n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
      }
      // eslint-disable-next-line no-bitwise
      return (n >>> 0) * 2.3283064365386963e-10;
    };
  };

  const masher = mash();
  s0 = masher(' ');
  s1 = masher(' ');
  s2 = masher(' ');

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== undefined) {
      s0 -= masher(args[i] as string | number);
      if (s0 < 0) s0 += 1;
      s1 -= masher(args[i] as string | number);
      if (s1 < 0) s1 += 1;
      s2 -= masher(args[i] as string | number);
      if (s2 < 0) s2 += 1;
    }
  }

  return () => {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10;
    s0 = s1;
    s1 = s2;
    // eslint-disable-next-line no-bitwise
    c = t | 0;
    s2 = t - c;
    return s2;
  };
}
""""""


File: noise/index.ts
""""""
/**
 * Noise Generation Module
 * Exports Simplex noise and Alea PRNG for deterministic procedural generation
 */

export { Alea } from './alea';
export { SimplexNoise, createWorldNoise, type WorldNoise, type SimplexNoiseOptions } from './simplex';
""""""


File: noise/simplex.ts
""""""
/**
 * Simplex Noise Generator
 * Provides type-safe, high-performance noise generation for world generation
 * Framework-agnostic implementation with optional debug callbacks
 */

import { makeNoise2D, makeNoise3D, makeNoise4D } from 'fast-simplex-noise';
import { Alea } from './alea';

export interface SimplexNoiseOptions {
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}

/**
 * SimplexNoise wrapper using fast-simplex-noise
 * Returns values in range [-1, 1]
 */
export class SimplexNoise {
  private noise2D: ReturnType<typeof makeNoise2D>;

  private noise3D: ReturnType<typeof makeNoise3D>;

  private noise4D: ReturnType<typeof makeNoise4D>;

  private rng: () => number;

  private options?: SimplexNoiseOptions;

  constructor(seed: string | number = 0, options?: SimplexNoiseOptions) {
    this.rng = Alea(seed);
    this.options = options;

    // Initialize noise generators with seeded random function
    this.noise2D = makeNoise2D(this.rng);
    this.noise3D = makeNoise3D(this.rng);
    this.noise4D = makeNoise4D(this.rng);

    this.options?.onDebug?.(`SimplexNoise initialized with seed: ${seed}`);
  }

  /**
   * 2D noise
   */
  noise(x: number, y: number): number {
    return this.noise2D(x, y);
  }

  /**
   * 3D noise
   */
  noise3(x: number, y: number, z: number): number {
    return this.noise3D(x, y, z);
  }

  /**
   * 4D noise
   */
  noise4(x: number, y: number, z: number, w: number): number {
    return this.noise4D(x, y, z, w);
  }

  /**
   * Octave noise - combines multiple noise layers (Fractal Brownian Motion)
   */
  octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * 3D octave noise - for volumetric generation
   */
  octaveNoise3(
    x: number,
    y: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Domain warping - feed noise output back into input for organic distortion
   */
  domainWarpedNoise(x: number, y: number, warpStrength: number = 0.5, octaves: number = 4): number {
    const warpX = this.octaveNoise(x, y, octaves) * warpStrength;
    const warpY = this.octaveNoise(x + 100, y + 100, octaves) * warpStrength;

    return this.octaveNoise(x + warpX, y + warpY, octaves);
  }

  /**
   * Ridge noise - absolute value creates mountain ridges
   */
  ridgeNoise(x: number, y: number, octaves: number = 4): number {
    return 1 - Math.abs(this.octaveNoise(x, y, octaves));
  }

  /**
   * Turbulence - sum of absolute octaves
   */
  turbulence(x: number, y: number, octaves: number = 4): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += Math.abs(this.noise2D(x * frequency, y * frequency)) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return total / maxValue;
  }
}

/**
 * Type alias for WorldNoise (SimplexNoise with extended features)
 */
export type WorldNoise = SimplexNoise;

/**
 * Factory function to create WorldNoise instance
 * @param seed - Random seed for deterministic generation
 * @param options - Optional configuration
 * @returns WorldNoise instance
 */
export function createWorldNoise(seed: string | number, options?: SimplexNoiseOptions): WorldNoise {
  return new SimplexNoise(seed, options);
}
""""""


File: simple-gen.test.ts
""""""
import { describe, it, expect } from '@jest/globals';
import { createUnifiedTerrainGenerator, createSimpleChunkGenerator, DEFAULT_GENERATION_PARAMS } from './simple-gen';

describe('Unified Terrain Generator', () => {
  const seed = 'test-seed-123';
  const generator = createUnifiedTerrainGenerator(seed, {
    ...DEFAULT_GENERATION_PARAMS,
    bspSize: 64, // reduce size for test speed
  });

  it('should generate a ChunkDTO with correct structure', () => {
    const chunkSize = 16;
    const chunk = generator(0, 0, chunkSize);

    expect(chunk).toBeDefined();
    expect(chunk.size).toBe(chunkSize);
    expect(chunk.chunkX).toBe(0);
    expect(chunk.chunkY).toBe(0);
    expect(chunk.grid).toBeDefined();
    expect(chunk.grid.length).toBe(7); // 7 floors

    // Check dimensionality
    const surface = chunk.grid[3];
    expect(surface.length).toBe(chunkSize);
    expect(surface[0].length).toBe(chunkSize);

    // Check content
    const tile = surface[0][0];
    expect(tile.b).toBeDefined();
    expect(tile.t).toBeDefined();
    expect(typeof tile.b).toBe('string');
    expect(typeof tile.t).toBe('string');
  });

  it('should generate consistent results for same seed', () => {
    const gen1 = createUnifiedTerrainGenerator(seed, DEFAULT_GENERATION_PARAMS);
    const gen2 = createUnifiedTerrainGenerator(seed, DEFAULT_GENERATION_PARAMS);

    const chunk1 = gen1(0, 0, 16);
    const chunk2 = gen2(0, 0, 16);

    expect(JSON.stringify(chunk1.grid)).toEqual(JSON.stringify(chunk2.grid));
  });
});

describe('Legacy Simple Generator (Compat)', () => {
  const seed = 'test-seed-legacy';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const legacyGen = createSimpleChunkGenerator(seed, DEFAULT_GENERATION_PARAMS);

  it('should return 3D string array', () => {
    const grid = legacyGen(0, 0, 16, 16);

    expect(grid).toBeDefined();
    expect(grid.length).toBe(7); // 7 floors
    expect(grid[3].length).toBe(16);
    expect(grid[3][0].length).toBe(16); // 16x16

    // Check that it's strings
    expect(typeof grid[3][0][0]).toBe('string');
  });
});
""""""


File: simple-gen.ts
""""""
import { SimplexNoise } from './noise';

import { generateStructureFootprints, stampDetailedStructures } from './structures/generator';
import type { ChunkDTO } from '../world/terrain-types';

export interface GenerationParams {
  // Structures
  structureMinDistance: number;
  maxStructures: number;
  generateRoads: boolean;

  // Elevation Noise
  elevationScale: number;
  elevationOctaves: number;
  elevationPersistence: number;

  // Moisture Noise
  moistureScale: number;
  moistureOctaves: number;
  moisturePersistence: number;

  // Cellular Automata (Caves)
  caveFillPercentage: number;
  caveIterations: number;
  caveBirthLimit: number;
  caveDeathLimit: number;

  // BSP Rooms
  bspSize: number;
  bspMinRoomSize: number;
  bspMaxRoomSize: number;

  // Poisson Disc (Features)
  featureMinDistance: number;
  featureAttempts: number;

  // New: Biome Control
  biomePreset?: string;
  skipCoreStructures?: boolean; // Optimization: Skip generating core structure footprints
}

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  structureMinDistance: 30,
  maxStructures: 10,
  generateRoads: false,
  elevationScale: 0.02,
  elevationOctaves: 4,
  elevationPersistence: 0.5,
  moistureScale: 0.03,
  moistureOctaves: 3,
  moisturePersistence: 0.5,
  caveFillPercentage: 0.45,
  caveIterations: 5,
  caveBirthLimit: 4,
  caveDeathLimit: 3,
  bspSize: 64,
  bspMinRoomSize: 4,
  bspMaxRoomSize: 12,
  featureMinDistance: 20,
  featureAttempts: 30,
  biomePreset: 'default',
};

/**
 * Pure function to get biome and block type from noise at a specific coordinate.
 * This is the SINGLE SOURCE OF TRUTH for the "Natural World".
 */
export function getProceduralTile(
  x: number,
  y: number,
  z: number, // -3 to +3
  _seed: string,
  params: GenerationParams,
  noise: SimplexNoise
): { biome: string; blockType: string } {
  // --- PRESET OVERRIDES ---
  if (params.biomePreset === 'flat') {
    if (z === 0) return { biome: 'plains', blockType: 'grass' };
    if (z < 0) return { biome: 'plains', blockType: 'stone' };
    return { biome: 'plains', blockType: 'air' };
  }

  // 1. Base Noise
  const elev = noise.octaveNoise(
    x * params.elevationScale,
    y * params.elevationScale,
    params.elevationOctaves,
    params.elevationPersistence
  );

  if (params.biomePreset === 'vulcan') {
    // Vulcan Biome Logic
    let biome = 'wasteland';
    let blockType = 'stone';

    if (z === 0) {
      if (elev < -0.4) {
        biome = 'lava_sea';
        blockType = 'lava';
      } else if (elev < -0.2) {
        biome = 'basalt_deltas';
        blockType = 'basalt';
      } else if (elev < 0.3) {
        biome = 'wasteland';
        blockType = 'stone';
      } else {
        biome = 'volcano';
        blockType = 'obsidian';
      }
      return { biome, blockType };
    }
    if (z < 0) return { biome: 'wasteland', blockType: 'stone' };
    return { biome: 'wasteland', blockType: 'air' };
  }

  const moist = noise.octaveNoise(
    x * params.moistureScale + 1000,
    y * params.moistureScale + 1000,
    params.moistureOctaves,
    params.moisturePersistence
  );

  // 2. Determine Biome
  let biome = 'plains';
  if (elev < -0.3) biome = 'ocean';
  else if (elev < -0.1) biome = 'beach';
  else if (elev < 0.1) {
    if (moist < -0.2) biome = 'desert';
    else if (moist < 0.2) biome = 'plains';
    else biome = 'swamp';
  } else if (elev < 0.4) {
    if (moist < -0.1) biome = 'savanna';
    else if (moist < 0.3) biome = 'forest';
    else biome = 'jungle';
  } else if (elev < 0.6) {
    biome = 'hills';
  } else {
    biome = 'mountains';
  }

  // 3. Determine Block Type based on Z-Level and Biome
  let blockType = 'air';

  // Surface Level (z=0)
  if (z === 0) {
    // Water handling
    if (biome === 'ocean' || biome === 'deep_ocean') return { biome, blockType: 'water' };

    // Default surface blocks
    switch (biome) {
      case 'desert':
        blockType = 'sand';
        break;
      case 'beach':
        blockType = 'sand';
        break;
      case 'snowy_peaks':
        blockType = 'snow';
        break;
      case 'mountains':
        blockType = 'stone';
        break;
      case 'badlands':
        blockType = 'terracotta';
        break;
      default:
        blockType = 'grass';
    }
  }
  // Underground (z < 0)
  else if (z < 0) {
    blockType = 'stone';
    // Deep underground could be dark
  }
  // Sky/Air (z > 0)
  else {
    blockType = 'air';
  }

  return { biome, blockType };
}

/**
 * Unified Terrain Generator
 * Returns a ChunkDTO structure with 3D data.
 */
export function createUnifiedTerrainGenerator(seed: string, inParams: GenerationParams) {
  const params = { ...DEFAULT_GENERATION_PARAMS, ...inParams };
  const CORE_SIZE = 1024;
  const noise = new SimplexNoise(seed);

  // --- CORE WORLD CACHE ---
  // We still pre-generate the Core World footprints for roads and global structures
  // But we store them differently or just use them as a "Layermask"
  let coreStructures: string[][][] | null = null;
  // We also need to know checking strictly for "Is this a road/structure?"

  try {
    const structureParams = {
      minDistance: params.structureMinDistance,
      maxStructures: params.maxStructures,
      generateRoads: params.generateRoads,
      elevationScale: params.elevationScale,
      elevationOctaves: params.elevationOctaves,
      elevationPersistence: params.elevationPersistence,
      moistureScale: params.moistureScale,
      moistureOctaves: params.moistureOctaves,
      moisturePersistence: params.moisturePersistence,
      caveFillPercentage: params.caveFillPercentage,
      caveIterations: params.caveIterations,
      caveBirthLimit: params.caveBirthLimit,
      caveDeathLimit: params.caveDeathLimit,
      bspSize: params.bspSize,
      bspMinRoomSize: params.bspMinRoomSize,
      bspMaxRoomSize: params.bspMaxRoomSize,
      featureMinDistance: params.featureMinDistance,
      featureAttempts: params.featureAttempts,
      roadMaterial: 'stone' as any,
      wfcBlendEdges: false,
    };

    if (!params.skipCoreStructures) {
      const footprints = generateStructureFootprints(CORE_SIZE, CORE_SIZE, seed, structureParams);

      // stampDetailedStructures returns [floor][y][x] strings
      coreStructures = stampDetailedStructures(
        footprints.biomeGrid,
        footprints.detailedStructures || [],
        footprints.biomeGrid
      );
    }
  } catch (e) {
    console.warn('[UnifiedGen] Failed to generate core roads', e);
  }

  /**
   * Generates a single tile at (x,y,z)
   * Resolves: Core Structure -> Stateless Structure -> Procedural Terrain
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTileAt = (x: number, y: number, z: number): { biome: string; blockType: string } => {
    const floorIndex = z + 3; // Map -3..3 to 0..6

    // 1. Check Core World Cache (if inside bounds)
    if (coreStructures && x >= 0 && y >= 0 && x < CORE_SIZE && y < CORE_SIZE) {
      const coreBlock = coreStructures[floorIndex]?.[y]?.[x];
      // If coreBlock is present and NOT empty string, use it
      if (coreBlock && coreBlock !== '') {
        // Parse the string "biome" from the old generator
        // The old generator returned strings like 'stone', 'plains', 'wall', etc.
        // We need to infer blockType from it if possible, or mapping

        // Quick heuristic mapping from the string soup
        const raw = coreBlock;
        let b = 'plains';
        let t = 'grass';

        if (raw === 'stone') {
          t = 'stone';
          b = 'plains';
        } else if (raw === 'wood') {
          t = 'wood';
          b = 'forest';
        } else if (raw === 'wall') {
          t = 'wall';
          b = 'plains';
        } else if (raw === 'floor') {
          t = 'floor';
          b = 'plains';
        } else if (raw === 'water') {
          t = 'water';
          b = 'ocean';
        } else {
          // It might be a biome name like 'forest'
          b = raw;
          t = 'grass'; // default
        }
        return { biome: b, blockType: t };
      }
    }

    // 2. Stateless Structures (for non-Core world)
    // TODO: Implement stateless structures here if needed, or rely on procedural for outside
    // For MVP, we stick to Procedural for everything else

    // 3. Procedural Terrain
    return getProceduralTile(x, y, z, seed, params, noise);
  };

  /**
   * Bundle a chunk
   */
  return (chunkX: number, chunkY: number, size: number): ChunkDTO => {
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // Initialize 7-layer grid
    const grid: { b: string; t: string }[][][] = [];
    for (let f = 0; f < 7; f++) grid[f] = [];

    for (let floor = 0; floor < 7; floor++) {
      const z = floor - 3;
      for (let y = 0; y < size; y++) {
        const row: { b: string; t: string }[] = [];
        for (let x = 0; x < size; x++) {
          const worldX = worldOffsetX + x;
          const worldY = worldOffsetY + y;

          const tile = getTileAt(worldX, worldY, z);
          row.push({ b: tile.biome, t: tile.blockType });
        }
        if (grid[floor]) {
          grid[floor]!.push(row);
        }
      }
    }

    return {
      chunkX,
      chunkY,
      worldOffsetX,
      worldOffsetY,
      size,
      grid,
    };
  };
}

// Re-export the legacy generator for now to avoid breaking imports immediately,
// strictly aliased or wrapped if needed.
// But we will REPLACE the content of createSimpleChunkGenerator to use the new logic
// while maintaining the signature for compat if possible, OR just export the new one.

// Backward compatibility wrapper
export function createSimpleChunkGenerator(seed: string, params: GenerationParams) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const unified = createUnifiedTerrainGenerator(seed, params);
  const noise = new SimplexNoise(seed);

  const CORE_SIZE = 1024;
  let coreStructures: string[][][] | null = null;

  // Initialize Core Structures once (Closure)
  try {
    const structureParams = {
      minDistance: params.structureMinDistance,
      maxStructures: params.maxStructures,
      generateRoads: params.generateRoads,
      elevationScale: params.elevationScale,
      elevationOctaves: params.elevationOctaves,
      elevationPersistence: params.elevationPersistence,
      moistureScale: params.moistureScale,
      moistureOctaves: params.moistureOctaves,
      moisturePersistence: params.moisturePersistence,
      caveFillPercentage: params.caveFillPercentage,
      caveIterations: params.caveIterations,
      caveBirthLimit: params.caveBirthLimit,
      caveDeathLimit: params.caveDeathLimit,
      bspSize: params.bspSize, // params.bspSize
      bspMinRoomSize: params.bspMinRoomSize,
      bspMaxRoomSize: params.bspMaxRoomSize,
      featureMinDistance: params.featureMinDistance,
      featureAttempts: params.featureAttempts,
      roadMaterial: 'stone' as any,
      wfcBlendEdges: false,
    };
    const footprints = generateStructureFootprints(CORE_SIZE, CORE_SIZE, seed, structureParams);
    coreStructures = stampDetailedStructures(
      footprints.biomeGrid,
      footprints.detailedStructures || [],
      footprints.biomeGrid
    );
  } catch (e) {
    // console.warn('Failed to gen core structures', e);
  }

  // Return the generator function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (worldX: number, worldY: number, width: number, height: number): string[][][] => {
    const grid: string[][][] = []; // [floor][y][x]

    for (let f = 0; f < 7; f++) {
      const z = f - 3;
      const floorGrid: string[][] = [];
      for (let ly = 0; ly < height; ly++) {
        const row: string[] = [];
        for (let lx = 0; lx < width; lx++) {
          const wx = worldX + lx;
          const wy = worldY + ly;

          // Check Core
          let val = '';
          if (coreStructures && wx >= 0 && wy >= 0 && wx < CORE_SIZE && wy < CORE_SIZE) {
            val = coreStructures[f]?.[wy]?.[wx] || '';
          }

          if (!val) {
            // Procedural
            const tile = getProceduralTile(wx, wy, z, seed, params, noise);
            if (z === 0) val = tile.biome;
            else val = '';
          }
          row.push(val);
        }
        floorGrid.push(row);
      }
      grid.push(floorGrid);
    }
    return grid;
  };
}
""""""


File: structures/README.md
""""""
# Structure Generation Module

Structures are **first-class biomes** in the DAICE world generation pipeline. They are placed FIRST, before noise generation, and all subsequent algorithms respect their boundaries.

## Architecture

### Generation Pipeline Order

```
1. Structure Placement (this module) → outputs biome grid with "structure_*" biomes
2. Simplex Noise (elevation/moisture) → avoids structure tiles
3. Biome Classification → assigns biomes to non-structure tiles only
4. Cellular Automata / BSP / Poisson → respects structure boundaries
5. WFC Edge Blending (optional) → blends structure edges into terrain
```

### Structure Biome Naming

Structures are represented as biome types:

- Format: `structure_{type}_{material}_{floor}`
- Examples:
  - `structure_house_wood_0` (house surface floor, wood)
  - `structure_castle_stone_-1` (castle basement, stone)
  - `structure_road_stone` (road, stone)

## Multi-Floor Support

Structures support 3 floors:

- Floor -1: Underground (basements, dungeons, caves)
- Floor 0: Surface (main level, roads)
- Floor +1: Upper (second stories, towers)

Stairs are bidirectional and connect adjacent floors.

## Usage

```typescript
import { generateStructuresAsBiomes } from '@daicer/shared/world-gen/structures';

const result = generateStructuresAsBiomes(256, 256, 'my-seed', {
  minDistance: 30,
  maxStructures: 20,
  generateRoads: true,
  roadMaterial: 'stone',
  wfcBlendEdges: false,
});

// result.biomeGrid[floor][y][x] = biome name
// result.structures = array of placed structures

// Use structure biomes in subsequent generation steps
const surfaceBiomes = result.biomeGrid[1]; // Floor 0 (surface)
// Pass to noise, CA, BSP, etc. - they will respect structure tiles
```

## Structure Types

- `house`: Small residential building (floor 0 only)
- `tower`: Tall defensive structure (all 3 floors)
- `castle`: Large fortress (all 3 floors)
- `dungeon`: Underground complex (floors -1 and 0)
- `temple`: Religious structure (floor 0 only)
- `cave_entrance`: Natural cave opening (floor -1 only)
- `ancient_tree`: Massive tree (floor 0 only)
- `stone_circle`: Ritual site (floor 0 only)
- `road`: Pathways connecting structures (floor 0 only)

## Materials

- `wood`: Brown (#8B4513)
- `stone`: Gray (#696969)
- `metal`: Silver (#A9A9A9)
- `marble`: Beige (#F5F5DC)
- `rock`: Dark gray (#4A4A4A)

## Determinism

All generation uses seeded PRNG (Alea). Same seed + params = identical structure placement.

## Road Generation

When `generateRoads: true`, the system uses A\* pathfinding to connect structures:

1. Find nearest neighbor for each structure
2. A\* path between structure centers
3. Cost function prefers flat terrain, avoids water/mountains
4. Roads placed on floor 0 as `structure_road_{material}` biomes

## Integration

Other algorithms check for structure biomes:

```typescript
import { isStructureBiome, canAssignBiome } from '@daicer/shared/world-gen/structures';

// Skip structure tiles in noise generation
if (isStructureBiome(biomeGrid[y][x])) {
  continue; // Don't overwrite structure
}

// Check before assigning biome
if (canAssignBiome(biomeGrid, x, y)) {
  biomeGrid[y][x] = 'plains';
}
```
""""""


File: structures/features.ts
""""""
/**
 * Feature Zone Generation
 * Placement of loot, traps, decorations within structures
 */

import type { Structure, FeatureZone, StructureFloor } from './types';
import { Alea } from '../noise/alea';

/**
 * Generate feature zones for a structure based on its type and layout
 */
export function generateFeatureZones(structure: Structure, seed: string): FeatureZone[] {
  const rng = Alea(`${seed}_features`);
  const zones: FeatureZone[] = [];

  // Rules based on structure type
  switch (structure.type) {
    case 'house':
      zones.push(...generateHouseFeatures(structure, rng));
      break;
    case 'castle':
      zones.push(...generateCastleFeatures(structure, rng));
      break;
    case 'dungeon':
      zones.push(...generateDungeonFeatures(structure, rng));
      break;
    case 'temple':
      zones.push(...generateTempleFeatures(structure, rng));
      break;
    case 'tower':
      zones.push(...generateTowerFeatures(structure, rng));
      break;
    case 'cave_entrance':
      zones.push(...generateCaveFeatures(structure, rng));
      break;
    default:
      // No features for other structure types
      break;
  }

  return zones;
}

/**
 * House Features: furniture and decorations
 */
function generateHouseFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place furniture in corners
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          // Check if corner (walls on 2 adjacent sides)
          const hasWallLeft = x > 0 && row[x - 1]?.tileType === 'wall';
          const hasWallRight = x < row.length - 1 && row[x + 1]?.tileType === 'wall';

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          const hasWallUp = rowAbove ? rowAbove[x]?.tileType === 'wall' : false;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          const hasWallDown = rowBelow ? rowBelow[x]?.tileType === 'wall' : false;

          if ((hasWallLeft || hasWallRight) && (hasWallUp || hasWallDown)) {
            if (rng() < 0.5) {
              zones.push({
                x: structure.worldX + x,
                y: structure.worldY + y,
                floor,
                featureType: 'furniture',
                radius: 1,
                density: 0.8,
              });
            }
          }
        }
      }
    }

    // Add lights (torches) along walls
    const numLights = Math.floor(rng() * 4) + 2;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);
        const row = floorTiles[y];

        if (row?.[x]?.tileType === 'floor') {
          // Check if adjacent to wall
          const hasWallLeft = x > 0 && row[x - 1]?.tileType === 'wall';
          const hasWallRight = x < row.length - 1 && row[x + 1]?.tileType === 'wall';

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          const hasWallUp = rowAbove ? rowAbove[x]?.tileType === 'wall' : false;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          const hasWallDown = rowBelow ? rowBelow[x]?.tileType === 'wall' : false;

          const nearWall = hasWallLeft || hasWallRight || hasWallUp || hasWallDown;

          if (nearWall) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'light',
              radius: 1,
              density: 1.0,
            });
            break;
          }
        }
      }
    }
  }

  return zones;
}

/**
 * Castle Features: loot rooms, decorations, lights
 */
function generateCastleFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place treasure/loot in isolated rooms (far from doors)
    const floorPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          floorPositions.push({ x, y });
        }
      }
    }

    if (floorPositions.length > 0) {
      // Place 1-2 loot zones per floor
      const numLoot = Math.floor(rng() * 2) + 1;
      for (let l = 0; l < numLoot; l++) {
        const posIndex = Math.floor(rng() * floorPositions.length);
        const pos = floorPositions[posIndex];
        if (pos) {
          zones.push({
            x: structure.worldX + pos.x,
            y: structure.worldY + pos.y,
            floor,
            featureType: 'loot',
            radius: 2,
            density: 0.6,
          });
        }
      }
    }

    // Place lights throughout
    const numLights = Math.floor(rng() * 6) + 4;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 1.0,
          });
          break;
        }
      }
    }

    // Place decorations
    const numDecorations = Math.floor(rng() * 5) + 3;
    for (let d = 0; d < numDecorations; d++) {
      if (floorPositions.length > 0) {
        const posIndex = Math.floor(rng() * floorPositions.length);
        const pos = floorPositions[posIndex];
        if (pos) {
          zones.push({
            x: structure.worldX + pos.x,
            y: structure.worldY + pos.y,
            floor,
            featureType: 'decoration',
            radius: 1,
            density: 0.7,
          });
        }
      }
    }
  }

  return zones;
}

/**
 * Dungeon Features: traps in corridors, loot in rooms
 */
function generateDungeonFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place traps in corridors (narrow passages)
    for (let y = 1; y < floorTiles.length - 1; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 1; x < row.length - 1; x++) {
        if (row[x]?.tileType === 'floor') {
          // Count adjacent walls to detect corridors
          let wallCount = 0;
          if (row[x - 1]?.tileType === 'wall') wallCount++;
          if (row[x + 1]?.tileType === 'wall') wallCount++;

          const rowAbove = floorTiles[y - 1];
          if (rowAbove?.[x]?.tileType === 'wall') wallCount++;

          const rowBelow = floorTiles[y + 1];
          if (rowBelow?.[x]?.tileType === 'wall') wallCount++;

          // Corridor if 2 opposite walls
          if (wallCount === 2 && rng() < 0.2) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'trap',
              radius: 1,
              density: 0.9,
            });
          }
        }
      }
    }

    // Place loot in open areas (rooms)
    const numLoot = Math.floor(rng() * 3) + 2;
    for (let l = 0; l < numLoot; l++) {
      const attempts = 50;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);
        const row = floorTiles[y];

        if (row?.[x]?.tileType === 'floor') {
          // Check if in open area (few adjacent walls)
          let wallCount = 0;
          if (row[x - 1]?.tileType === 'wall') wallCount++;
          if (row[x + 1]?.tileType === 'wall') wallCount++;

          const rowAbove = y > 0 ? floorTiles[y - 1] : undefined;
          if (rowAbove?.[x]?.tileType === 'wall') wallCount++;

          const rowBelow = y < floorTiles.length - 1 ? floorTiles[y + 1] : undefined;
          if (rowBelow?.[x]?.tileType === 'wall') wallCount++;

          if (wallCount <= 1) {
            zones.push({
              x: structure.worldX + x,
              y: structure.worldY + y,
              floor,
              featureType: 'loot',
              radius: 2,
              density: 0.7,
            });
            break;
          }
        }
      }
    }

    // Minimal lighting (dungeons are dark)
    const numLights = Math.floor(rng() * 2) + 1;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 0.5,
          });
          break;
        }
      }
    }
  }

  return zones;
}

/**
 * Temple Features: decorations and lights (no loot or traps)
 */
function generateTempleFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return zones;

  // Abundant decorations
  const numDecorations = Math.floor(rng() * 10) + 5;
  for (let d = 0; d < numDecorations; d++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'decoration',
          radius: 1,
          density: 0.8,
        });
        break;
      }
    }
  }

  // Abundant lights
  const numLights = Math.floor(rng() * 8) + 4;
  for (let l = 0; l < numLights; l++) {
    const attempts = 30;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'light',
          radius: 1,
          density: 1.0,
        });
        break;
      }
    }
  }

  return zones;
}

/**
 * Tower Features: loot at top, lights on each floor
 */
function generateTowerFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place lights on each floor
    const numLights = Math.floor(rng() * 3) + 2;
    for (let l = 0; l < numLights; l++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          zones.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            featureType: 'light',
            radius: 1,
            density: 1.0,
          });
          break;
        }
      }
    }
  }

  // Major loot at the top floor
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);

      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          featureType: 'loot',
          radius: 3,
          density: 0.9,
        });
      }
    }
  }

  return zones;
}

/**
 * Cave Features: minimal features (natural cave)
 */
function generateCaveFeatures(structure: Structure, rng: () => number): FeatureZone[] {
  const zones: FeatureZone[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return zones;

  // Sparse lighting (cave is dark)
  const numLights = Math.floor(rng() * 2) + 1;
  for (let l = 0; l < numLights; l++) {
    const attempts = 30;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        zones.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          featureType: 'light',
          radius: 1,
          density: 0.3,
        });
        break;
      }
    }
  }

  return zones;
}
""""""


File: structures/generator.ts
""""""
/**
 * Structure Generation - 2-Phase System
 * Phase 1: Place reserved footprints BEFORE terrain generation
 * Phase 2: Stamp detailed layouts AFTER terrain generation
 */

import type {
  Structure,
  StructurePlacementParams,
  StructureGenerationResult,
  StructureType,
  StructureFloor,
} from './types';
import { structureTileToBiome, isStructureBiome, isReservedBiome, getFloorIndex } from './types';
import { STRUCTURE_TEMPLATES, DEFAULT_STRUCTURE_WEIGHTS } from './presets';
import { selectRandomMaterial } from './materials';
import { poissonDiskSampling2D } from '../voronoi/poisson-disc';
import { generateRoadPaths } from './pathfinding';
import { generateNPCSpawnPoints } from './spawn-points';
import { generateFeatureZones } from './features';
import { Alea } from '../noise/alea';

/**
 * Phase 1: Generate structure footprints with RESERVED markers
 * This runs BEFORE terrain generation (noise, CA, etc.)
 */
export function generateStructureFootprints(
  width: number,
  height: number,
  seed: string,
  params: StructurePlacementParams
): StructureGenerationResult {
  const rng = Alea(seed);

  // Initialize empty biome grids for 7 floors (-3 to +3)
  const biomeGrid: string[][][] = [];
  for (let i = 0; i < 7; i++) {
    biomeGrid.push(
      Array(height)
        .fill(null)
        .map(() => Array(width).fill(''))
    );
  }

  const structures: Structure[] = [];

  // Step 1: Generate structure placement points using Poisson disc sampling
  const placementPoints = poissonDiskSampling2D(width, height, params.minDistance, 30, seed);

  console.log(`[Structures] Generated ${placementPoints.length} placement points`);

  // Step 2: For each point, randomly decide structure type and place RESERVED footprint
  let placedCount = 0;
  const maxStructures = params.maxStructures || placementPoints.length;

  for (const point of placementPoints) {
    if (placedCount >= maxStructures) break;

    // Select structure type based on weights
    const structureType = selectStructureType(rng, DEFAULT_STRUCTURE_WEIGHTS);
    if (!structureType || structureType === 'road' || structureType === 'bridge') continue;

    // Get template
    const template = STRUCTURE_TEMPLATES[structureType];
    if (!template) continue;

    // Select material (use default or random)
    const material = rng() < 0.7 ? template.defaultMaterial : selectRandomMaterial(rng);

    // Generate structure layout
    const tiles = template.generator(material, `${seed}-${point.x}-${point.y}`);

    // Check if structure fits
    const worldX = Math.floor(point.x);
    const worldY = Math.floor(point.y);

    if (worldX + template.width > width || worldY + template.height > height) {
      continue;
    }

    // Check for overlap with existing structures (check surface floor)
    const surfaceIndex = getFloorIndex(0);
    const surfaceGrid = biomeGrid[surfaceIndex];
    if (surfaceGrid && hasOverlap(surfaceGrid, worldX, worldY, template.width, template.height)) {
      continue;
    }

    // Create structure with spawn points and features
    const structure: Structure = {
      id: `struct-${placedCount}`,
      name: `${template.name} ${placedCount + 1}`,
      type: structureType,
      material,
      width: template.width,
      height: template.height,
      tiles,
      worldX,
      worldY,
      npcSpawnPoints: [],
      featureZones: [],
      layoutAlgorithm: template.layoutAlgorithm,
    };

    // Generate NPCs and features
    structure.npcSpawnPoints = generateNPCSpawnPoints(structure, seed);
    structure.featureZones = generateFeatureZones(structure, seed);

    // Place RESERVED footprint on grid
    placeReservedFootprint(biomeGrid, structure);
    structures.push(structure);
    placedCount++;
  }

  console.log(`[Structures] Placed ${structures.length} structures`);

  // Step 3: Generate roads if enabled
  let roadTileCount = 0;
  if (params.generateRoads && structures.length > 1) {
    const surfaceIndex = getFloorIndex(0);
    const surfaceGrid = biomeGrid[surfaceIndex];
    if (surfaceGrid) {
      const roadPoints = generateRoadPaths(structures, surfaceGrid, seed);
      roadTileCount = roadPoints.length;
      console.log(`[Structures] Generated ${roadTileCount} road tiles`);

      // Place road reserved markers on floor 0
      for (const point of roadPoints) {
        if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
          const row = surfaceGrid[point.y];
          if (row && row[point.x] !== undefined) {
            const cell = row[point.x];
            if (cell !== undefined && !isStructureBiome(cell)) {
              row[point.x] = `structure_reserved_road`;
            }
          }
        }
      }
    }
  }

  // Return with detailed structures stored separately for Phase 2
  return { biomeGrid, structures, detailedStructures: structures };
}

/**
 * Phase 2: Stamp detailed structure layouts AFTER terrain generation
 * This replaces reserved markers with final detailed tiles
 */
export function stampDetailedStructures(
  _biomeGrid: string[][][],
  structures: Structure[],
  terrainGrid: string[][][]
): string[][][] {
  console.log(`[Structures] Stamping ${structures.length} detailed structures`);

  // Create a copy of terrain grid
  const finalGrid: string[][][] = terrainGrid.map((floor) => floor.map((row) => [...row]));

  // Stamp each structure
  for (const structure of structures) {
    stampStructure(finalGrid, structure);
  }

  return finalGrid;
}

/**
 * Legacy function: Generate structures as biomes (old 1-phase system)
 * Kept for backward compatibility
 */
export function generateStructuresAsBiomes(
  width: number,
  height: number,
  seed: string,
  params: StructurePlacementParams
): StructureGenerationResult {
  // Use new 2-phase system but immediately stamp
  const phase1 = generateStructureFootprints(width, height, seed, params);

  // Stamp directly onto the reserved grid
  const finalGrid = stampDetailedStructures(phase1.biomeGrid, phase1.detailedStructures || [], phase1.biomeGrid);

  return {
    biomeGrid: finalGrid,
    structures: phase1.structures,
    detailedStructures: phase1.detailedStructures,
  };
}

/**
 * Select a structure type based on weights
 */
function selectStructureType(rng: () => number, weights: Record<StructureType, number>): StructureType | null {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = rng() * totalWeight;

  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return type as StructureType;
    }
  }

  return null;
}

/**
 * Check if a structure would overlap with existing structures
 */
function hasOverlap(biomeGrid: string[][], worldX: number, worldY: number, width: number, height: number): boolean {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gridY = worldY + y;
      const gridX = worldX + x;

      if (gridY >= 0 && gridY < biomeGrid.length) {
        const row = biomeGrid[gridY];
        if (row && gridX >= 0 && gridX < row.length) {
          const biome = row[gridX];
          if (biome && isStructureBiome(biome)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Place a RESERVED footprint on the biome grid (Phase 1)
 */
function placeReservedFootprint(biomeGrid: string[][][], structure: Structure): void {
  for (const [floorKey, tiles] of Object.entries(structure.tiles)) {
    const floor = parseInt(floorKey) as StructureFloor;
    const gridIndex = getFloorIndex(floor);

    if (gridIndex < 0 || gridIndex >= biomeGrid.length) continue;
    const targetGrid = biomeGrid[gridIndex];
    if (!targetGrid) continue;

    for (let y = 0; y < tiles.length; y++) {
      const tileRow = tiles[y];
      if (!tileRow) continue;

      for (let x = 0; x < tileRow.length; x++) {
        const tile = tileRow[x];
        if (!tile) continue; // Safety check

        const worldX = structure.worldX + x;
        const worldY = structure.worldY + y;

        if (worldY >= 0 && worldY < targetGrid.length) {
          const gridRow = targetGrid[worldY];
          if (gridRow && worldX >= 0 && worldX < gridRow.length) {
            // Place reserved marker
            if (tile.tileType !== 'empty') {
              gridRow[worldX] = `structure_reserved_${structure.id}`;
            }
          }
        }
      }
    }
  }
}

/**
 * Stamp a detailed structure onto the final grid (Phase 2)
 */
function stampStructure(biomeGrid: string[][][], structure: Structure): void {
  for (const [floorKey, tiles] of Object.entries(structure.tiles)) {
    const floor = parseInt(floorKey) as StructureFloor;
    const gridIndex = getFloorIndex(floor);

    if (gridIndex < 0 || gridIndex >= biomeGrid.length) continue;
    const targetGrid = biomeGrid[gridIndex];
    if (!targetGrid) continue;

    for (let y = 0; y < tiles.length; y++) {
      const tileRow = tiles[y];
      if (!tileRow) continue;

      for (let x = 0; x < tileRow.length; x++) {
        const tile = tileRow[x];
        if (!tile) continue;

        const worldX = structure.worldX + x;
        const worldY = structure.worldY + y;

        if (worldY >= 0 && worldY < targetGrid.length) {
          const gridRow = targetGrid[worldY];
          if (gridRow && worldX >= 0 && worldX < gridRow.length) {
            // Only stamp if this was a reserved tile
            const currentBiome = gridRow[worldX];
            if (currentBiome && isReservedBiome(currentBiome)) {
              const biomeName = structureTileToBiome(tile, floor, false, structure.id);
              if (biomeName) {
                gridRow[worldX] = biomeName;
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Helper: Check if a biome grid tile can have a biome assigned
 * (i.e., it's not already a structure)
 */
export function canAssignBiome(biomeGrid: string[][], x: number, y: number): boolean {
  if (y < 0 || y >= biomeGrid.length) return false;
  const row = biomeGrid[y];
  if (!row || x < 0 || x >= row.length) return false;

  const biome = row[x];
  return !biome || !isStructureBiome(biome);
}
""""""


File: structures/index.ts
""""""
/**
 * Structure Generation Module
 * Structures are first-class biomes placed before terrain generation
 */

export * from './types';
export * from './materials';
export * from './presets';
export * from './generator';
export * from './pathfinding';
export * from './layouts';
export * from './spawn-points';
export * from './features';
export * from './placement-map';
""""""


File: structures/layouts.ts
""""""
/**
 * Structure Layout Generation
 * Provides algorithms for generating rich, detailed structure interiors
 */

import type { StructureTile, StructureMaterial, StructureFloor } from './types';
import { Alea } from '../noise/alea';
import { generateBSPLayout } from '../bsp';
import { generateCaveCA } from '../cellular-automata';

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
      const row = grid[y];
      if (!row) continue;
      for (let x = 1; x < width - 1; x++) {
        row[x] = { material, tileType: 'floor', floor };
      }
    }
    for (let y = 0; y < height; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          row[x] = { material, tileType: 'wall', floor };
        }
      }
    }
    // Add a door
    const firstRow = grid[0];
    if (firstRow) {
      firstRow[Math.floor(width / 2)] = { material, tileType: 'door', floor };
    }
    return grid;
  }

  // Place floors in rooms
  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + room.height && ry < height; ry++) {
      const row = grid[ry];
      if (!row) continue;
      for (let rx = room.x; rx < room.x + room.width && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          row[rx] = { material, tileType: 'floor', floor };
        }
      }
    }
  }

  // Place walls around rooms
  for (const room of rooms) {
    for (let ry = room.y - 1; ry <= room.y + room.height && ry < height; ry++) {
      const row = grid[ry];
      if (!row) continue;
      for (let rx = room.x - 1; rx <= room.x + room.width && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          if (ry === room.y - 1 || ry === room.y + room.height || rx === room.x - 1 || rx === room.x + room.width) {
            if (row[rx]?.tileType === 'empty') {
              row[rx] = { material, tileType: 'wall', floor };
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

    if (!roomA || !roomB) continue;

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
        const row = grid[currentY];
        if (row) {
          if (row[currentX]?.tileType === 'empty') {
            row[currentX] = { material, tileType: 'floor', floor };
          }
          // Add walls beside corridor
          if (currentY > 0) {
            const aboveRow = grid[currentY - 1];
            if (aboveRow && aboveRow[currentX]?.tileType === 'empty') {
              aboveRow[currentX] = { material, tileType: 'wall', floor };
            }
          }
          if (currentY < height - 1) {
            const belowRow = grid[currentY + 1];
            if (belowRow && belowRow[currentX]?.tileType === 'empty') {
              belowRow[currentX] = { material, tileType: 'wall', floor };
            }
          }
        }
      }
      currentX += currentX < centerB.x ? 1 : -1;
    }

    while (currentY !== centerB.y) {
      if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
        const row = grid[currentY];
        if (row) {
          if (row[currentX]?.tileType === 'empty') {
            row[currentX] = { material, tileType: 'floor', floor };
          }
          // Add walls beside corridor
          if (currentX > 0 && row[currentX - 1]?.tileType === 'empty') {
            row[currentX - 1] = { material, tileType: 'wall', floor };
          }
          if (currentX < width - 1 && row[currentX + 1]?.tileType === 'empty') {
            row[currentX + 1] = { material, tileType: 'wall', floor };
          }
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
        const row = grid[doorY];
        if (row && row[doorX]?.tileType === 'wall') {
          // Check if there's floor on both sides
          const hasFloorNearby =
            (doorY > 0 && grid[doorY - 1]?.[doorX]?.tileType === 'floor') ||
            (doorY < height - 1 && grid[doorY + 1]?.[doorX]?.tileType === 'floor') ||
            (doorX > 0 && row[doorX - 1]?.tileType === 'floor') ||
            (doorX < width - 1 && row[doorX + 1]?.tileType === 'floor');

          if (hasFloorNearby) {
            row[doorX] = { material, tileType: 'door', floor };
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
  _seed: string
): StructureTile[][] {
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
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < width; x++) {
      if (y >= 0 && y < height) {
        row[x] = { material, tileType: 'floor', floor };
      }
    }
  }

  // Vertical corridor
  for (let x = centerX - corridorWidth; x <= centerX + corridorWidth; x++) {
    for (let y = 0; y < height; y++) {
      const row = grid[y];
      if (!row) continue;
      if (x >= 0 && x < width) {
        row[x] = { material, tileType: 'floor', floor };
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
      const row = grid[ry];
      if (!row) continue;
      for (let rx = room.x; rx < room.x + roomSize && rx < width; rx++) {
        if (ry >= 0 && rx >= 0) {
          row[rx] = { material, tileType: 'floor', floor };
        }
      }
    }
  }

  // Place walls around the perimeter and around floor areas
  for (let y = 0; y < height; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < width; x++) {
      if (row[x]?.tileType === 'floor') {
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
            const neighborRow = grid[ny];
            if (neighborRow && neighborRow[nx]?.tileType === 'empty') {
              neighborRow[nx] = { material, tileType: 'wall', floor };
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
      const row = grid[door.y];
      if (row && row[door.x]?.tileType === 'wall') {
        row[door.x] = { material, tileType: 'door', floor };
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
    const row = grid[y];
    if (!row) continue;

    const caRow = caGrid[y];
    if (!caRow) continue;

    for (let x = 0; x < width; x++) {
      if (caRow[x] === undefined) continue;

      if (!caRow[x]) {
        // false = Open space = floor
        row[x] = { material, tileType: 'floor', floor };
      } else {
        // true = Walls
        row[x] = { material, tileType: 'wall', floor };
      }
    }
  }

  // Add some doors at random wall positions adjacent to floors
  const rng = Alea(`${seed}_doors`);
  const numDoors = Math.floor(rng() * 3) + 1;

  for (let d = 0; d < numDoors; d++) {
    const attempts = 100;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const x = Math.floor(rng() * width);
      const y = Math.floor(rng() * height);

      const row = grid[y];
      if (row && row[x]?.tileType === 'wall') {
        // Check if adjacent to floor
        const hasFloor =
          (y > 0 && grid[y - 1]?.[x]?.tileType === 'floor') ||
          (y < height - 1 && grid[y + 1]?.[x]?.tileType === 'floor') ||
          (x > 0 && row[x - 1]?.tileType === 'floor') ||
          (x < width - 1 && row[x + 1]?.tileType === 'floor');

        if (hasFloor) {
          row[x] = { material, tileType: 'door', floor };
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
  const rng = Alea(`${seed}_stairs`);
  const height = lowerFloorGrid.length;
  const width = lowerFloorGrid[0]?.length ?? 0;

  // Find a suitable location for stairs (must have floor on both levels)
  const attempts = 100;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = Math.floor(rng() * (width - 2)) + 1;
    const y = Math.floor(rng() * (height - 2)) + 1;

    const lowerRow = lowerFloorGrid[y];
    const upperRow = upperFloorGrid[y];

    if (lowerRow && upperRow && lowerRow[x]?.tileType === 'floor' && upperRow[x]?.tileType === 'floor') {
      // Place stairs
      lowerRow[x] = { material, tileType: 'stairs', floor: lowerFloor };
      upperRow[x] = { material, tileType: 'stairs', floor: upperFloor };
      return;
    }
  }
}
""""""


File: structures/materials.ts
""""""
/**
 * Structure Material Definitions
 * Colors, properties, and metadata for structure materials
 */

import type { StructureMaterial } from './types';

export interface MaterialProperties {
  name: string;
  color: string; // Hex color for rendering
  durability: number; // 1-10 scale
  weight: number; // Probability weight for random selection
  naturalness: number; // How natural vs artificial (0-10)
}

export const MATERIAL_PROPERTIES: Record<StructureMaterial, MaterialProperties> = {
  wood: {
    name: 'Wood',
    color: '#8B4513', // Saddle brown
    durability: 4,
    weight: 40,
    naturalness: 7,
  },
  stone: {
    name: 'Stone',
    color: '#696969', // Dim gray
    durability: 8,
    weight: 30,
    naturalness: 6,
  },
  metal: {
    name: 'Metal',
    color: '#A9A9A9', // Dark gray (silver)
    durability: 9,
    weight: 10,
    naturalness: 2,
  },
  marble: {
    name: 'Marble',
    color: '#F5F5DC', // Beige
    durability: 7,
    weight: 5,
    naturalness: 5,
  },
  rock: {
    name: 'Rock',
    color: '#4A4A4A', // Very dark gray
    durability: 6,
    weight: 15,
    naturalness: 9,
  },
};

/**
 * Get color for a specific material
 */
export function getMaterialColor(material: StructureMaterial): string {
  return MATERIAL_PROPERTIES[material].color;
}

/**
 * Select a random material based on weights
 */
export function selectRandomMaterial(rng: () => number): StructureMaterial {
  const totalWeight = Object.values(MATERIAL_PROPERTIES).reduce((sum, prop) => sum + prop.weight, 0);
  let random = rng() * totalWeight;

  for (const [material, props] of Object.entries(MATERIAL_PROPERTIES)) {
    random -= props.weight;
    if (random <= 0) {
      return material as StructureMaterial;
    }
  }

  return 'stone'; // Default fallback
}

/**
 * Get material by name (case-insensitive)
 */
export function getMaterialByName(name: string): StructureMaterial | null {
  const normalized = name.toLowerCase();
  if (normalized in MATERIAL_PROPERTIES) {
    return normalized as StructureMaterial;
  }
  return null;
}
""""""


File: structures/pathfinding.ts
""""""
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
""""""


File: structures/placement-map.ts
""""""
/**
 * High-Level Structure Placement Map
 *
 * This module generates a deterministic global map of structure locations and road paths
 * for an entire world (up to 512k x 512k). The placement map is lightweight (just coordinates)
 * and can be stored in Firestore. Detailed structure generation happens on-demand when
 * players get close to a structure location.
 */

import { Alea } from '../noise/alea';
import { poissonDiskSampling2D } from '../voronoi/poisson-disc';
import type { StructureType, StructureMaterial, RoadSegment } from './types';
import { STRUCTURE_TEMPLATES, DEFAULT_STRUCTURE_WEIGHTS } from './presets';

/**
 * Lightweight structure placement data (stored in Firestore)
 */
export interface StructurePlacement {
  id: string;
  type: StructureType;
  worldX: number;
  worldY: number;
  material: StructureMaterial;
  size: number; // Approximate radius for collision/rendering
  gridX: number; // Grid cell coordinates for spatial indexing
  gridY: number;
}

/**
 * Parameters for global placement map generation
 */
export interface PlacementMapParams {
  minDistance: number; // Minimum distance between structures
  maxStructures?: number; // Max structures (probability-based)
  generateRoads: boolean;
  roadMaterial: StructureMaterial;
  structureWeights?: Record<StructureType, number>; // Probability weights
}

/**
 * Complete placement map result
 */
export interface GlobalPlacementMap {
  structures: StructurePlacement[];
  roads: RoadSegment[];
  worldSize: number;
  seed: string;
  generatedAt: number; // Timestamp
}

/**
 * Generate a deterministic global structure placement map
 *
 * This is the Tier 1 system: it decides WHERE structures will be, but not their detailed layouts.
 *
 * @param seed - Master seed for deterministic generation
 * @param worldSize - World dimensions (e.g., 512000 for 512k x 512k)
 * @param params - Placement parameters
 * @returns Global placement map with structure locations and road paths
 */
export function generateGlobalPlacementMap(
  seed: string,
  worldSize: number,
  params: PlacementMapParams
): GlobalPlacementMap {
  const startTime = Date.now();
  console.log(`[PlacementMap] Generating global map: ${worldSize}x${worldSize}, seed="${seed}"`);

  const {
    minDistance,
    maxStructures = 50,
    generateRoads,
    roadMaterial,
    structureWeights = DEFAULT_STRUCTURE_WEIGHTS,
  } = params;

  // Use Poisson disc sampling to distribute structure locations evenly across the world
  // This ensures structures are well-spaced without overlap
  const placementPoints = poissonDiskSampling2D(
    worldSize,
    worldSize,
    minDistance,
    30, // attempts per point
    `${seed}-placement`
  );

  console.log(`[PlacementMap] Generated ${placementPoints.length} potential structure locations`);

  // Convert placement points to structure placements
  const rng = Alea(`${seed}-structures`);
  const structures: StructurePlacement[] = [];

  // Calculate total weight for probability distribution
  const totalWeight = Object.values(structureWeights).reduce((sum, w) => sum + w, 0);

  for (let i = 0; i < placementPoints.length; i++) {
    const point = placementPoints[i];
    if (!point) continue;

    const { x, y } = point;

    // Probability-based culling to control structure density
    const structureProbability = Math.min(maxStructures / 50, 0.3);
    if (rng() > structureProbability) continue;

    // Deterministically select structure type based on weights
    const roll = rng() * totalWeight;
    let cumulative = 0;
    let selectedType: StructureType = 'house';

    for (const [type, weight] of Object.entries(structureWeights)) {
      cumulative += weight;
      if (roll <= cumulative) {
        selectedType = type as StructureType;
        break;
      }
    }

    const template = STRUCTURE_TEMPLATES[selectedType];
    if (!template) continue;

    const material = template.defaultMaterial;
    const size = Math.max(template.width, template.height) / 2; // Approximate radius

    structures.push({
      id: `struct-${Math.floor(x)}-${Math.floor(y)}`,
      type: selectedType,
      worldX: Math.floor(x),
      worldY: Math.floor(y),
      material,
      size,
      gridX: Math.floor(x / minDistance),
      gridY: Math.floor(y / minDistance),
    });
  }

  console.log(`[PlacementMap] Placed ${structures.length} structures after probability culling`);

  // Generate roads connecting nearby structures
  const roads: RoadSegment[] = [];

  if (generateRoads && structures.length > 1) {
    // Sort structures by proximity and connect neighbors
    const maxRoadDistance = minDistance * 2.5; // Only connect relatively close structures

    for (let i = 0; i < structures.length; i++) {
      const structure = structures[i];
      if (!structure) continue;

      // Find nearby structures
      const nearby = structures
        .filter((s, idx) => {
          if (idx <= i) return false; // Avoid duplicate roads
          const dx = s.worldX - structure.worldX;
          const dy = s.worldY - structure.worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist <= maxRoadDistance;
        })
        .sort((a, b) => {
          const distA = Math.hypot(a.worldX - structure.worldX, a.worldY - structure.worldY);
          const distB = Math.hypot(b.worldX - structure.worldX, b.worldY - structure.worldY);
          return distA - distB;
        })
        .slice(0, 3); // Connect to at most 3 nearest neighbors

      for (const target of nearby) {
        // Generate straight-line road path (A* pathfinding would be overkill for placement map)
        const path = generateStraightPath(structure.worldX, structure.worldY, target.worldX, target.worldY);

        roads.push({
          id: `road-${structure.id}-${target.id}`,
          startX: structure.worldX,
          startY: structure.worldY,
          endX: target.worldX,
          endY: target.worldY,
          path,
          material: roadMaterial,
        });
      }
    }

    console.log(`[PlacementMap] Generated ${roads.length} road segments`);
  }

  const elapsed = Date.now() - startTime;
  console.log(`[PlacementMap] ✅ Complete in ${elapsed}ms`);

  return {
    structures,
    roads,
    worldSize,
    seed,
    generatedAt: Date.now(),
  };
}

/**
 * Generate a straight-line path between two points
 * Uses Bresenham's line algorithm for integer coordinates
 */
function generateStraightPath(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const path: Array<[number, number]> = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  // Sample every 4 tiles for a smoother, less dense path
  let step = 0;

  while (true) {
    if (step % 4 === 0) {
      path.push([x, y]);
    }

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }

    step++;
  }

  // Always include end point
  const lastPoint = path[path.length - 1];
  if (!lastPoint || lastPoint[0] !== x1 || lastPoint[1] !== y1) {
    path.push([x1, y1]);
  }

  return path;
}

/**
 * Query structures near a specific world location
 * Used for on-demand detail generation
 */
export function getStructuresNearLocation(
  placements: StructurePlacement[],
  worldX: number,
  worldY: number,
  radius: number
): StructurePlacement[] {
  return placements.filter((s) => {
    const dx = s.worldX - worldX;
    const dy = s.worldY - worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= radius + s.size;
  });
}

/**
 * Query road segments that pass through a specific world area
 */
export function getRoadsInArea(
  roads: RoadSegment[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): RoadSegment[] {
  return roads.filter((road) =>
    // Check if any point in the road path intersects the area
    road.path.some(([x, y]) => x >= minX && x <= maxX && y >= minY && y <= maxY)
  );
}
""""""


File: structures/presets.ts
""""""
/**
 * Structure Presets and Templates
 * Predefined structure layouts for common building types
 */

import type { StructureTile, StructureType, StructureMaterial, StructureFloor, LayoutAlgorithm } from './types';
import { generateRoomLayout, generateWFCLayout, generateCALayout, addStairs } from './layouts';

/**
 * Structure template (before placement)
 */
export interface StructureTemplate {
  type: StructureType;
  name: string;
  width: number;
  height: number;
  defaultMaterial: StructureMaterial;
  floors: StructureFloor[]; // Which floors this structure has (e.g., [-1, 0, 1])
  layoutAlgorithm: LayoutAlgorithm;
  generator: (material: StructureMaterial, seed: string) => Partial<Record<StructureFloor, StructureTile[][]>>;
}

/**
 * Generate a house layout (2 floors: 0 ground, 1 upper)
 */
function generateHouseLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 10;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [0, 1];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 4);
  }

  // Add stairs connecting floors
  const l0 = layouts[0];
  const l1 = layouts[1];
  if (l0 && l1) {
    addStairs(l0, l1, 0, 1, material, seed);
  }

  return layouts;
}

/**
 * Generate a tower layout (5 floors: -1, 0, 1, 2, 3)
 */
function generateTowerLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 8;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [-1, 0, 1, 2, 3];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 5);
  }

  // Add stairs connecting each floor
  for (let i = 0; i < floors.length - 1; i++) {
    const f1 = floors[i];
    const f2 = floors[i + 1];

    if (f1 === undefined || f2 === undefined) continue;

    const l1 = layouts[f1];
    const l2 = layouts[f2];
    if (l1 && l2) {
      addStairs(l1, l2, f1, f2, material, seed);
    }
  }

  return layouts;
}

/**
 * Generate a castle layout (3 floors: -1, 0, 1) with large courtyards
 */
function generateCastleLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 32;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [-1, 0, 1];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 6);
  }

  // Add stairs connecting floors
  for (let i = 0; i < floors.length - 1; i++) {
    const f1 = floors[i];
    const f2 = floors[i + 1];

    if (f1 === undefined || f2 === undefined) continue;

    const l1 = layouts[f1];
    const l2 = layouts[f2];
    if (l1 && l2) {
      addStairs(l1, l2, f1, f2, material, seed);
    }
  }

  return layouts;
}

/**
 * Generate a dungeon using cellular automata (3 floors: -3, -2, -1)
 */
function generateDungeonLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 20;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [-3, -2, -1];

  for (const floor of floors) {
    layouts[floor] = generateCALayout(size, size, floor, material, `${seed}_${floor}`, 0.45, 4);
  }

  // Add stairs connecting floors
  for (let i = 0; i < floors.length - 1; i++) {
    const f1 = floors[i];
    const f2 = floors[i + 1];

    if (f1 === undefined || f2 === undefined) continue;

    const l1 = layouts[f1];
    const l2 = layouts[f2];
    if (l1 && l2) {
      addStairs(l1, l2, f1, f2, material, seed);
    }
  }

  return layouts;
}

/**
 * Generate a temple using WFC (2 floors: -1 basement, 0 main hall)
 */
function generateTempleLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 16;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [-1, 0];

  for (const floor of floors) {
    layouts[floor] = generateWFCLayout(size, size, floor, material, `${seed}_${floor}`);
  }

  // Add stairs connecting basement to main hall
  const l_1 = layouts[-1];
  const l0 = layouts[0];
  if (l_1 && l0) {
    addStairs(l_1, l0, -1, 0, material, seed);
  }

  return layouts;
}

/**
 * Generate a cave entrance (floors -1, 0)
 */
function generateCaveEntranceLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 12;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [-1, 0];

  for (const floor of floors) {
    layouts[floor] = generateCALayout(size, size, floor, material, `${seed}_${floor}`, 0.4, 3);
  }

  const l_1 = layouts[-1];
  const l0 = layouts[0];
  if (l_1 && l0) {
    addStairs(l_1, l0, -1, 0, material, seed);
  }

  return layouts;
}

/**
 * Generate an ancient tree (floors 0, 1, 2)
 */
function generateAncientTreeLayout(
  material: StructureMaterial,
  seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 10;
  const layouts: Partial<Record<StructureFloor, StructureTile[][]>> = {};
  const floors: StructureFloor[] = [0, 1, 2];

  for (const floor of floors) {
    layouts[floor] = generateRoomLayout(size, size, floor, material, `${seed}_${floor}`, 4);
  }

  // Connect floors with stairs
  for (let i = 0; i < floors.length - 1; i++) {
    const f1 = floors[i];
    const f2 = floors[i + 1];

    if (f1 === undefined || f2 === undefined) continue;

    const l1 = layouts[f1];
    const l2 = layouts[f2];
    if (l1 && l2) {
      addStairs(l1, l2, f1, f2, material, seed);
    }
  }

  return layouts;
}

/**
 * Generate a stone circle (floor 0 only)
 */
function generateStoneCircleLayout(
  material: StructureMaterial,
  _seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const size = 8;
  const floor0: StructureTile[][] = [];

  // Simple circular pattern
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist >= radius - 0.5 && dist <= radius + 0.5) {
        row.push({ material, tileType: 'wall', floor: 0 });
      } else if (dist < radius) {
        row.push({ material, tileType: 'floor', floor: 0 });
      } else {
        row.push({ material, tileType: 'empty', floor: 0 });
      }
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * Road segment (floor 0 only, simple straight line)
 */
function generateRoadLayout(
  material: StructureMaterial,
  _seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const width = 3;
  const height = 1;
  const floor0: StructureTile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ material, tileType: 'road', floor: 0 });
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * Bridge segment (floor 0 only)
 */
function generateBridgeLayout(
  material: StructureMaterial,
  _seed: string
): Partial<Record<StructureFloor, StructureTile[][]>> {
  const width = 5;
  const height = 1;
  const floor0: StructureTile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: StructureTile[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1) {
        row.push({ material, tileType: 'wall', floor: 0 });
      } else {
        row.push({ material, tileType: 'floor', floor: 0 });
      }
    }
    floor0.push(row);
  }

  return { 0: floor0 };
}

/**
 * All structure templates
 */
export const STRUCTURE_TEMPLATES: Record<StructureType, StructureTemplate> = {
  house: {
    type: 'house',
    name: 'House',
    width: 10,
    height: 10,
    defaultMaterial: 'wood',
    floors: [0, 1],
    layoutAlgorithm: 'manual',
    generator: generateHouseLayout,
  },
  tower: {
    type: 'tower',
    name: 'Tower',
    width: 8,
    height: 8,
    defaultMaterial: 'stone',
    floors: [-1, 0, 1, 2, 3],
    layoutAlgorithm: 'manual',
    generator: generateTowerLayout,
  },
  castle: {
    type: 'castle',
    name: 'Castle',
    width: 32,
    height: 32,
    defaultMaterial: 'stone',
    floors: [-1, 0, 1],
    layoutAlgorithm: 'manual',
    generator: generateCastleLayout,
  },
  dungeon: {
    type: 'dungeon',
    name: 'Dungeon',
    width: 20,
    height: 20,
    defaultMaterial: 'rock',
    floors: [-3, -2, -1],
    layoutAlgorithm: 'cellular-automata',
    generator: generateDungeonLayout,
  },
  temple: {
    type: 'temple',
    name: 'Temple',
    width: 16,
    height: 16,
    defaultMaterial: 'marble',
    floors: [-1, 0],
    layoutAlgorithm: 'wfc',
    generator: generateTempleLayout,
  },
  cave_entrance: {
    type: 'cave_entrance',
    name: 'Cave Entrance',
    width: 12,
    height: 12,
    defaultMaterial: 'rock',
    floors: [-1, 0],
    layoutAlgorithm: 'cellular-automata',
    generator: generateCaveEntranceLayout,
  },
  ancient_tree: {
    type: 'ancient_tree',
    name: 'Ancient Tree',
    width: 10,
    height: 10,
    defaultMaterial: 'wood',
    floors: [0, 1, 2],
    layoutAlgorithm: 'manual',
    generator: generateAncientTreeLayout,
  },
  stone_circle: {
    type: 'stone_circle',
    name: 'Stone Circle',
    width: 8,
    height: 8,
    defaultMaterial: 'stone',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateStoneCircleLayout,
  },
  road: {
    type: 'road',
    name: 'Road',
    width: 3,
    height: 1,
    defaultMaterial: 'stone',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateRoadLayout,
  },
  bridge: {
    type: 'bridge',
    name: 'Bridge',
    width: 5,
    height: 1,
    defaultMaterial: 'wood',
    floors: [0],
    layoutAlgorithm: 'manual',
    generator: generateBridgeLayout,
  },
};

/**
 * Structure type selection weights
 */
export const DEFAULT_STRUCTURE_WEIGHTS: Record<StructureType, number> = {
  house: 0.3,
  tower: 0.15,
  temple: 0.1,
  castle: 0.05,
  dungeon: 0.15,
  cave_entrance: 0.1,
  ancient_tree: 0.1,
  stone_circle: 0.05,
  road: 0, // Roads are generated separately via pathfinding
  bridge: 0, // Bridges are generated separately
};
""""""


File: structures/spawn-points.ts
""""""
/**
 * NPC Spawn Point Generation
 * Rules-based placement of NPCs within structures
 */

import type { Structure, NPCSpawnPoint, StructureFloor } from './types';
import { Alea } from '../noise/alea';

/**
 * Generate NPC spawn points for a structure based on its type and layout
 */
export function generateNPCSpawnPoints(structure: Structure, seed: string): NPCSpawnPoint[] {
  const rng = Alea(`${seed}_npcs`);
  const spawnPoints: NPCSpawnPoint[] = [];

  // Rules based on structure type
  switch (structure.type) {
    case 'house':
      spawnPoints.push(...generateHouseNPCs(structure, rng));
      break;
    case 'castle':
      spawnPoints.push(...generateCastleNPCs(structure, rng));
      break;
    case 'dungeon':
      spawnPoints.push(...generateDungeonNPCs(structure, rng));
      break;
    case 'temple':
      spawnPoints.push(...generateTempleNPCs(structure, rng));
      break;
    case 'tower':
      spawnPoints.push(...generateTowerNPCs(structure, rng));
      break;
    case 'cave_entrance':
      spawnPoints.push(...generateCaveNPCs(structure, rng));
      break;
    default:
      // No NPCs for other structure types
      break;
  }

  return spawnPoints;
}

/**
 * House NPCs: villagers inside
 */
function generateHouseNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  // Place 1-2 villagers in the house
  const numNPCs = Math.floor(rng() * 2) + 1;

  for (let i = 0; i < numNPCs; i++) {
    const floorIndex = Math.floor(rng() * floors.length);
    const floor = floors[floorIndex];
    if (floor === undefined) continue;

    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Find floor tiles (not doors, walls)
    const floorPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          floorPositions.push({ x, y });
        }
      }
    }

    if (floorPositions.length > 0) {
      const posIndex = Math.floor(rng() * floorPositions.length);
      const pos = floorPositions[posIndex];
      if (!pos) continue;

      points.push({
        x: structure.worldX + pos.x,
        y: structure.worldY + pos.y,
        floor,
        npcType: 'villager',
        spawnChance: 0.8,
      });
    }
  }

  return points;
}

/**
 * Castle NPCs: guards near doors and key areas
 */
function generateCastleNPCs(structure: Structure, _rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place guards near doors
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'door') {
          // Place guard adjacent to door
          const guardPositions = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 },
          ];

          for (const gPos of guardPositions) {
            if (
              gPos.x >= 0 &&
              gPos.x < row.length &&
              gPos.y >= 0 &&
              gPos.y < floorTiles.length &&
              floorTiles[gPos.y]?.[gPos.x]?.tileType === 'floor'
            ) {
              points.push({
                x: structure.worldX + gPos.x,
                y: structure.worldY + gPos.y,
                floor,
                npcType: 'guard',
                spawnChance: 0.6,
              });
              break; // Only one guard per door
            }
          }
        }
      }
    }
  }

  // Add a boss in the top floor
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      // Find center-ish floor tile
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);
      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          npcType: 'boss',
          spawnChance: 1.0,
        });
      }
    }
  }

  return points;
}

/**
 * Dungeon NPCs: monsters scattered throughout
 */
function generateDungeonNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Count floor tiles
    let floorTileCount = 0;
    for (let y = 0; y < floorTiles.length; y++) {
      const row = floorTiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x]?.tileType === 'floor') {
          floorTileCount++;
        }
      }
    }

    // Place monsters: ~1 per 20 floor tiles
    const numMonsters = Math.max(1, Math.floor(floorTileCount / 20));
    for (let m = 0; m < numMonsters; m++) {
      const attempts = 50;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            npcType: 'monster',
            spawnChance: 0.7,
          });
          break;
        }
      }
    }
  }

  // Add a boss on the deepest floor
  const deepestFloor = Math.min(...floors) as StructureFloor;
  const deepTiles = structure.tiles[deepestFloor];
  if (deepTiles && deepTiles.length > 0) {
    const firstRow = deepTiles[0];
    if (firstRow) {
      // Find a far corner
      const corners = [
        { x: 0, y: 0 },
        { x: firstRow.length - 1, y: 0 },
        { x: 0, y: deepTiles.length - 1 },
        { x: firstRow.length - 1, y: deepTiles.length - 1 },
      ];

      for (const corner of corners) {
        if (deepTiles[corner.y]?.[corner.x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + corner.x,
            y: structure.worldY + corner.y,
            floor: deepestFloor,
            npcType: 'boss',
            spawnChance: 1.0,
          });
          break;
        }
      }
    }
  }

  return points;
}

/**
 * Temple NPCs: merchants and villagers
 */
function generateTempleNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return points;

  // Place 1-2 merchants in the temple
  const numMerchants = Math.floor(rng() * 2) + 1;

  for (let i = 0; i < numMerchants; i++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          npcType: 'merchant',
          spawnChance: 0.9,
        });
        break;
      }
    }
  }

  return points;
}

/**
 * Tower NPCs: guards on each floor, boss at top
 */
function generateTowerNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const floors = Object.keys(structure.tiles).map(Number) as StructureFloor[];

  for (const floor of floors) {
    const floorTiles = structure.tiles[floor];
    if (!floorTiles) continue;

    // Place 1-2 guards per floor
    const numGuards = Math.floor(rng() * 2) + 1;
    for (let g = 0; g < numGuards; g++) {
      const attempts = 30;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const firstRow = floorTiles[0];
        if (!firstRow) break;

        const x = Math.floor(rng() * firstRow.length);
        const y = Math.floor(rng() * floorTiles.length);

        if (floorTiles[y]?.[x]?.tileType === 'floor') {
          points.push({
            x: structure.worldX + x,
            y: structure.worldY + y,
            floor,
            npcType: 'guard',
            spawnChance: 0.7,
          });
          break;
        }
      }
    }
  }

  // Boss at the top
  const topFloor = Math.max(...floors) as StructureFloor;
  const topTiles = structure.tiles[topFloor];
  if (topTiles && topTiles.length > 0) {
    const firstRow = topTiles[0];
    if (firstRow) {
      const centerX = Math.floor(firstRow.length / 2);
      const centerY = Math.floor(topTiles.length / 2);
      if (topTiles[centerY]?.[centerX]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + centerX,
          y: structure.worldY + centerY,
          floor: topFloor,
          npcType: 'boss',
          spawnChance: 1.0,
        });
      }
    }
  }

  return points;
}

/**
 * Cave NPCs: monsters near the entrance
 */
function generateCaveNPCs(structure: Structure, rng: () => number): NPCSpawnPoint[] {
  const points: NPCSpawnPoint[] = [];
  const surfaceFloor = 0 as StructureFloor;
  const floorTiles = structure.tiles[surfaceFloor];
  if (!floorTiles) return points;

  // Place 2-4 monsters
  const numMonsters = Math.floor(rng() * 3) + 2;

  for (let m = 0; m < numMonsters; m++) {
    const attempts = 50;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const firstRow = floorTiles[0];
      if (!firstRow) break;

      const x = Math.floor(rng() * firstRow.length);
      const y = Math.floor(rng() * floorTiles.length);

      if (floorTiles[y]?.[x]?.tileType === 'floor') {
        points.push({
          x: structure.worldX + x,
          y: structure.worldY + y,
          floor: surfaceFloor,
          npcType: 'monster',
          spawnChance: 0.8,
        });
        break;
      }
    }
  }

  return points;
}
""""""


File: structures/types.ts
""""""
/**
 * Structure Type Definitions
 * Structures are first-class biomes in the generation pipeline
 */

export interface RoadSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width?: number;
  material: StructureMaterial;
  path: Array<[number, number]>;
}

export type StructureMaterial = 'wood' | 'stone' | 'metal' | 'marble' | 'rock';

export type StructureType =
  | 'house'
  | 'tower'
  | 'temple'
  | 'castle'
  | 'dungeon'
  | 'cave_entrance'
  | 'ancient_tree'
  | 'stone_circle'
  | 'road'
  | 'bridge';

export type StructureFloor = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export type LayoutAlgorithm = 'manual' | 'wfc' | 'cellular-automata';

export type NPCType = 'guard' | 'merchant' | 'monster' | 'villager' | 'boss';

export type FeatureType = 'loot' | 'trap' | 'decoration' | 'furniture' | 'light';

export interface StructureTile {
  material: StructureMaterial;
  tileType: 'wall' | 'floor' | 'door' | 'stairs' | 'empty' | 'road';
  floor: StructureFloor;
}

export interface NPCSpawnPoint {
  x: number;
  y: number;
  floor: StructureFloor;
  npcType: NPCType;
  spawnChance: number; // 0.0 to 1.0
}

export interface FeatureZone {
  x: number;
  y: number;
  floor: StructureFloor;
  featureType: FeatureType;
  radius: number; // size of the zone
  density: number; // 0.0 to 1.0, how many features in this zone
}

export interface Structure {
  id: string;
  name: string;
  type: StructureType;
  material: StructureMaterial;
  width: number;
  height: number;
  tiles: Partial<Record<StructureFloor, StructureTile[][]>>; // floor -> [y][x]
  worldX: number;
  worldY: number;
  npcSpawnPoints: NPCSpawnPoint[];
  featureZones: FeatureZone[];
  layoutAlgorithm: LayoutAlgorithm;
}

export interface StructurePlacementParams {
  biomeAffinityRules?: Record<string, Record<StructureType, number>>; // optional: place near existing biomes
  minDistance: number;
  maxStructures?: number;
  generateRoads: boolean;
  roadMaterial: StructureMaterial;
  wfcBlendEdges: boolean; // enable WFC edge blending at the end
}

export interface StructureGenerationResult {
  biomeGrid: string[][][]; // [floor][y][x], 7 floors: -3, -2, -1, 0, 1, 2, 3
  structures: Structure[];
  detailedStructures?: Structure[]; // For 2-phase generation: detailed layouts stored separately
}

/**
 * Helper: Map StructureFloor to array index (0-6)
 */
export function getFloorIndex(floor: StructureFloor): number {
  return floor + 3; // -3 -> 0, -2 -> 1, ..., 3 -> 6
}

/**
 * Helper: Map array index to StructureFloor
 */
export function getFloorFromIndex(index: number): StructureFloor {
  return (index - 3) as StructureFloor; // 0 -> -3, 1 -> -2, ..., 6 -> 3
}

/**
 * Helper: Convert structure tile to biome name
 * For Phase 1 (reserved): use structure_reserved_<id>
 * For Phase 2 (stamped): use structure_final_<material>_<tileType>
 */
export function structureTileToBiome(
  tile: StructureTile,
  floor: StructureFloor,
  isReserved = false,
  structureId?: string
): string {
  if (isReserved && structureId) {
    return `structure_reserved_${structureId}`;
  }

  if (tile.tileType === 'road') {
    return `structure_road_${tile.material}`;
  }
  if (tile.tileType === 'empty') {
    return ''; // Empty tiles don't become structure biomes
  }
  return `structure_final_${tile.material}_${tile.tileType}_${floor}`;
}

/**
 * Helper: Check if a biome is a structure
 */
export function isStructureBiome(biome: string): boolean {
  return biome.startsWith('structure_');
}

/**
 * Helper: Check if a biome is a reserved structure footprint
 */
export function isReservedBiome(biome: string): boolean {
  return biome.startsWith('structure_reserved_');
}

/**
 * Helper: Check if a biome is a final stamped structure
 */
export function isFinalStructureBiome(biome: string): boolean {
  return biome.startsWith('structure_final_');
}

/**
 * Helper: Get biome name for a structure at specific coordinates
 */
export function getStructureBiomeName(
  structure: Structure,
  floor: StructureFloor,
  localX: number,
  localY: number,
  isReserved = false
): string {
  const floorTiles = structure.tiles[floor];
  if (!floorTiles || !floorTiles[localY] || !floorTiles[localY][localX]) {
    return '';
  }

  const tile = floorTiles[localY][localX];
  return structureTileToBiome(tile, floor, isReserved, structure.id);
}
""""""


File: utils/grid.ts
""""""
/**
 * Grid utility functions
 */

export function createEmptyGrid<T>(width: number, height: number, fillValue: T): T[][] {
  const grid: T[][] = [];
  for (let y = 0; y < height; y++) {
    const row: T[] = [];
    for (let x = 0; x < width; x++) {
      row.push(fillValue);
    }
    grid.push(row);
  }
  return grid;
}

export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

export function isInBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}
""""""


File: utils/index.ts
""""""
/**
 * Utility Module
 * Common utilities for world generation
 */

export * from './types';
export * from './grid';
export * from './math';
""""""


File: utils/math.ts
""""""
/**
 * Math utility functions for world generation
 */

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}
""""""


File: utils/types.ts
""""""
/**
 * Common position and grid types
 */

export interface Position {
  x: number;
  y: number;
}

export interface Position3D extends Position {
  z: number;
}

export type Grid<T> = T[][];

export type Seed = string | number;
""""""


File: voronoi/index.ts
""""""
/**
 * Voronoi and Poisson Disc Sampling Module
 * Exports Voronoi utilities and Poisson disc sampling
 */

export { poissonDiskSampling2D, poissonDiscSampling } from './poisson-disc';
export { findNearestVoronoiSeed, voronoiDistance } from './voronoi';
export type { Point2D, Point3D, VoronoiRegion } from './types';
""""""


File: voronoi/poisson-disc.ts
""""""
/* eslint-disable complexity */
/**
 * Poisson Disk Sampling for natural feature placement
 * Ensures features (trees, rocks, etc.) are evenly spaced without clustering
 * Framework-agnostic implementation
 */

import { SimplexNoise } from '../noise/simplex';
import type { Point2D } from './types';

/**
 * Poisson disk sampling in 2D
 * Creates evenly distributed points with minimum distance constraint
 */
export function poissonDiskSampling2D(
  width: number,
  height: number,
  minDistance: number,
  maxAttempts: number = 30,
  seed: string = '0'
): Point2D[] {
  const noise = new SimplexNoise(seed);
  const cellSize = minDistance / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (Point2D | null)[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(null));

  const points: Point2D[] = [];
  const activeList: Point2D[] = [];

  // Start with random point
  const startX = noise.noise(0, 0) * width * 0.5 + width * 0.5;
  const startY = noise.noise(100, 100) * height * 0.5 + height * 0.5;
  const startPoint: Point2D = { x: startX, y: startY };

  const gridX = Math.floor(startPoint.x / cellSize);
  const gridY = Math.floor(startPoint.y / cellSize);
  if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight && grid[gridX]) {
    const col = grid[gridX];
    if (col) col[gridY] = startPoint;
    points.push(startPoint);
    activeList.push(startPoint);
  }

  let attemptCounter = 0;

  while (activeList.length > 0 && attemptCounter < maxAttempts * 1000) {
    attemptCounter += 1;

    // Pick random point from active list
    const randomIndex = Math.floor(
      noise.noise(attemptCounter, attemptCounter * 2) * activeList.length * 0.5 + activeList.length * 0.5
    );
    const point = activeList[Math.min(randomIndex, activeList.length - 1)];
    if (!point) break;

    let found = false;

    // Try to generate points around it
    for (let i = 0; i < maxAttempts; i += 1) {
      // Random angle and distance
      const angle = noise.noise(attemptCounter + i, point.x) * Math.PI * 2;
      const radius = minDistance + noise.noise(point.y, attemptCounter + i) * minDistance;

      const newX = point.x + Math.cos(angle) * radius;
      const newY = point.y + Math.sin(angle) * radius;

      // Check if in bounds
      if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
        continue; // eslint-disable-line no-continue
      }

      const newPoint: Point2D = { x: newX, y: newY };
      const newGridX = Math.floor(newX / cellSize);
      const newGridY = Math.floor(newY / cellSize);

      // Check if too close to existing points
      let tooClose = false;
      const searchRadius = 2;

      for (let dx = -searchRadius; dx <= searchRadius; dx += 1) {
        for (let dy = -searchRadius; dy <= searchRadius; dy += 1) {
          const checkX = newGridX + dx;
          const checkY = newGridY + dy;

          if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
            const col = grid[checkX];
            const neighbor = col ? col[checkY] : null;
            if (neighbor) {
              const dist = Math.sqrt((neighbor.x - newX) ** 2 + (neighbor.y - newY) ** 2);
              if (dist < minDistance) {
                tooClose = true;
                break;
              }
            }
          }
        }
        if (tooClose) break;
      }

      if (!tooClose) {
        const col = grid[newGridX];
        if (col) col[newGridY] = newPoint;
        points.push(newPoint);
        activeList.push(newPoint);
        found = true;
        break;
      }
    }

    if (!found) {
      // Remove from active list
      const pointIndex = activeList.indexOf(point);
      if (pointIndex >= 0) {
        activeList.splice(pointIndex, 1);
      }
    }
  }

  return points;
}

/**
 * Alias for compatibility
 */
export const poissonDiscSampling = poissonDiskSampling2D;
""""""


File: voronoi/types.ts
""""""
/**
 * Voronoi and Poisson Disc Sampling Types
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface VoronoiRegion {
  seed: Point2D;
  cells: Point2D[];
}
""""""


File: voronoi/voronoi.ts
""""""
/**
 * Voronoi diagram utilities
 */

import type { Point2D } from './types';

/**
 * Find nearest Voronoi seed point
 */
export function findNearestVoronoiSeed(x: number, y: number, seeds: Point2D[]): Point2D {
  if (seeds.length === 0) {
    throw new Error('No seeds provided');
  }

  let nearestSeed = seeds[0]!;
  let minDist = Infinity;

  for (const seed of seeds) {
    const dist = (seed.x - x) ** 2 + (seed.y - y) ** 2;
    if (dist < minDist) {
      minDist = dist;
      nearestSeed = seed;
    }
  }

  return nearestSeed;
}

/**
 * Calculate distance from point to nearest Voronoi seed
 */
export function voronoiDistance(x: number, y: number, seeds: Point2D[]): number {
  const nearest = findNearestVoronoiSeed(x, y, seeds);
  return Math.sqrt((nearest.x - x) ** 2 + (nearest.y - y) ** 2);
}
""""""


File: wfc/index.ts
""""""
/**
 * Wave Function Collapse (WFC) Module
 * Exports WFC algorithm and related utilities
 */

export { collapseGrid, applyWFCToGrid, type WFCResult, type WFCOptions } from './wfc-solver';
export { createTileIndex, canBeAdjacent, TERRAIN_TILES, STRUCTURE_TILES, type WFCTile } from './wfc-tiles';
export { extractPatterns, patternsToAdjacencyRules, mergePatterns, type Pattern } from './wfc-patterns';
export {
  getPresetTiles,
  getPresetExamples,
  WFC_PRESETS,
  CASTLE_EXAMPLE,
  HOUSE_EXAMPLE,
  DUNGEON_ROOM_EXAMPLE,
  TERRAIN_EXAMPLE,
} from './wfc-presets';
""""""


File: wfc/wfc-patterns.ts
""""""
/**
 * WFC Pattern Extraction
 * Learns patterns from example structures for WFC generation
 */

export interface Pattern {
  id: string;
  tiles: string[][]; // 3x3 or NxN grid of tile IDs
  frequency: number; // How often this pattern appears
}

/**
 * Extract NxN patterns from an example grid
 * This allows WFC to learn from hand-crafted examples
 */
export function extractPatterns(exampleGrid: string[][], patternSize: number = 3): Pattern[] {
  const patterns = new Map<string, Pattern>();
  const height = exampleGrid.length;
  const width = exampleGrid[0]?.length ?? 0;

  if (width === 0 || height === 0) return [];

  // Slide window across example
  for (let y = 0; y <= height - patternSize; y++) {
    for (let x = 0; x <= width - patternSize; x++) {
      const pattern = extractPatternAt(exampleGrid, x, y, patternSize);
      const patternKey = serializePattern(pattern);

      if (patterns.has(patternKey)) {
        patterns.get(patternKey)!.frequency++;
      } else {
        patterns.set(patternKey, {
          id: patternKey,
          tiles: pattern,
          frequency: 1,
        });
      }
    }
  }

  return Array.from(patterns.values());
}

/**
 * Extract a pattern at a specific position
 */
function extractPatternAt(grid: string[][], startX: number, startY: number, size: number): string[][] {
  const pattern: string[][] = [];

  for (let y = 0; y < size; y++) {
    const row: string[] = [];
    for (let x = 0; x < size; x++) {
      const sourceRow = grid[startY + y];
      const tileId = sourceRow?.[startX + x] ?? 'empty';
      row.push(tileId);
    }
    pattern.push(row);
  }

  return pattern;
}

/**
 * Serialize pattern to unique string key
 */
function serializePattern(pattern: string[][]): string {
  return pattern.map((row) => row.join(',')).join(';');
}

/**
 * Convert patterns to adjacency rules
 * This generates tile adjacency constraints from observed patterns
 */
export function patternsToAdjacencyRules(patterns: Pattern[]): Map<string, Set<string>[]> {
  const rules = new Map<string, { north: Set<string>; south: Set<string>; east: Set<string>; west: Set<string> }>();

  for (const pattern of patterns) {
    const height = pattern.tiles.length;
    const width = pattern.tiles[0]?.length ?? 0;

    // For each tile in pattern, record what can be adjacent
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const row = pattern.tiles[y];
        if (!row) continue;
        const tileId = row[x];
        if (!tileId) continue;

        if (!rules.has(tileId)) {
          rules.set(tileId, {
            north: new Set(),
            south: new Set(),
            east: new Set(),
            west: new Set(),
          });
        }

        const tileRules = rules.get(tileId)!;

        // Record neighbors
        if (y > 0) {
          const northTile = pattern.tiles[y - 1]?.[x];
          if (northTile) tileRules.north.add(northTile);
        }
        if (y < height - 1) {
          const southTile = pattern.tiles[y + 1]?.[x];
          if (southTile) tileRules.south.add(southTile);
        }
        if (x < width - 1) {
          const eastTile = pattern.tiles[y]?.[x + 1];
          if (eastTile) tileRules.east.add(eastTile);
        }
        if (x > 0) {
          const westTile = pattern.tiles[y]?.[x - 1];
          if (westTile) tileRules.west.add(westTile);
        }
      }
    }
  }

  // Convert to array format
  const rulesArray = new Map<string, Set<string>[]>();
  for (const [tileId, dirs] of rules.entries()) {
    rulesArray.set(tileId, [dirs.north, dirs.south, dirs.east, dirs.west]);
  }

  return rulesArray;
}

/**
 * Merge multiple example grids into combined patterns
 */
export function mergePatterns(...patternSets: Pattern[][]): Pattern[] {
  const merged = new Map<string, Pattern>();

  for (const patterns of patternSets) {
    for (const pattern of patterns) {
      if (merged.has(pattern.id)) {
        merged.get(pattern.id)!.frequency += pattern.frequency;
      } else {
        merged.set(pattern.id, { ...pattern });
      }
    }
  }

  return Array.from(merged.values());
}
""""""


File: wfc/wfc-presets.ts
""""""
/**
 * WFC Presets
 * Hand-crafted structure patterns for WFC-based generation
 */

import type { WFCTile } from './wfc-tiles';
import { TERRAIN_TILES, STRUCTURE_TILES } from './wfc-tiles';

/**
 * Example castle layout (used to train WFC)
 */
export const CASTLE_EXAMPLE: string[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'door', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

/**
 * Example village house
 */
export const HOUSE_EXAMPLE: string[][] = [
  ['empty', 'wall', 'wall', 'wall', 'empty'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall'],
  ['empty', 'wall', 'door', 'wall', 'empty'],
];

/**
 * Example dungeon room
 */
export const DUNGEON_ROOM_EXAMPLE: string[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['door', 'floor', 'floor', 'floor', 'floor', 'door'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'door', 'wall', 'wall'],
];

/**
 * Example terrain patterns (grassland with forest patches)
 */
export const TERRAIN_EXAMPLE: string[][] = [
  ['grass', 'grass', 'forest', 'forest', 'grass', 'grass'],
  ['grass', 'forest', 'forest', 'forest', 'forest', 'grass'],
  ['grass', 'forest', 'forest', 'forest', 'grass', 'grass'],
  ['grass', 'grass', 'forest', 'grass', 'grass', 'stone'],
  ['grass', 'grass', 'grass', 'grass', 'stone', 'stone'],
  ['water', 'sand', 'grass', 'grass', 'stone', 'mountain'],
];

/**
 * Preset collections for different structure types
 */
export const WFC_PRESETS = {
  castle: {
    tiles: STRUCTURE_TILES,
    examples: [CASTLE_EXAMPLE],
    patternSize: 3,
  },
  house: {
    tiles: STRUCTURE_TILES,
    examples: [HOUSE_EXAMPLE],
    patternSize: 3,
  },
  dungeon: {
    tiles: STRUCTURE_TILES,
    examples: [DUNGEON_ROOM_EXAMPLE],
    patternSize: 3,
  },
  terrain: {
    tiles: TERRAIN_TILES,
    examples: [TERRAIN_EXAMPLE],
    patternSize: 3,
  },
};

/**
 * Get tiles for a preset type
 */
export function getPresetTiles(presetType: keyof typeof WFC_PRESETS): WFCTile[] {
  return WFC_PRESETS[presetType].tiles;
}

/**
 * Get examples for a preset type
 */
export function getPresetExamples(presetType: keyof typeof WFC_PRESETS): string[][][] {
  return WFC_PRESETS[presetType].examples;
}
""""""


File: wfc/wfc-solver.ts
""""""
/**
 * Wave Function Collapse Solver
 * Core WFC algorithm for constraint-based procedural generation
 * Framework-agnostic implementation with optional callbacks
 */

import { Alea } from '../noise/alea';
import type { WFCTile } from './wfc-tiles';
import { createTileIndex } from './wfc-tiles';

interface Cell {
  x: number;
  y: number;
  collapsed: boolean;
  options: Set<string>; // Possible tile IDs
  tileId?: string; // Final tile ID (when collapsed)
}

interface WFCGrid {
  width: number;
  height: number;
  cells: Cell[][];
}

export interface WFCResult {
  width: number;
  height: number;
  grid: string[][]; // Tile IDs
  success: boolean;
  iterations: number;
}

export interface WFCOptions {
  /** Optional callback for iteration updates */
  onIteration?: (iteration: number, maxIterations: number) => void;
  /** Optional callback for cell collapse events */
  onCollapse?: (x: number, y: number, tileId: string) => void;
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}

/**
 * Main WFC solver
 * Collapses a grid of possibilities into a single valid configuration
 */
export function collapseGrid(
  width: number,
  height: number,
  tiles: WFCTile[],
  seed: string,
  maxIterations: number = width * height * 10,
  options?: WFCOptions
): WFCResult {
  const rng = Alea(seed);
  const tileIndex = createTileIndex(tiles);

  options?.onDebug?.(`Starting WFC collapse for ${width}x${height} grid with seed: ${seed}`);

  // Initialize grid with all possibilities
  const grid: WFCGrid = {
    width,
    height,
    cells: [],
  };

  // Create cells with all tile options
  const allTileIds = tiles.map((t) => t.id);
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x,
        y,
        collapsed: false,
        options: new Set(allTileIds),
      });
    }
    grid.cells.push(row);
  }

  let iterations = 0;

  // Main WFC loop
  while (iterations < maxIterations) {
    iterations++;
    options?.onIteration?.(iterations, maxIterations);

    // Find cell with minimum entropy (fewest options)
    const cell = findMinEntropyCell(grid);

    if (!cell) {
      // All cells collapsed - success!
      options?.onDebug?.(`WFC completed successfully in ${iterations} iterations`);
      return {
        width,
        height,
        grid: extractTileIds(grid),
        success: true,
        iterations,
      };
    }

    // Collapse the cell (choose a tile)
    const tileId = collapseCell(cell, tiles, rng);

    if (!tileId) {
      // No valid options - contradiction, fail
      options?.onDebug?.(`WFC failed: contradiction at (${cell.x}, ${cell.y}) after ${iterations} iterations`);
      return {
        width,
        height,
        grid: extractTileIds(grid),
        success: false,
        iterations,
      };
    }

    cell.collapsed = true;
    cell.tileId = tileId;
    cell.options.clear();
    cell.options.add(tileId);

    options?.onCollapse?.(cell.x, cell.y, tileId);

    // Propagate constraints to neighbors
    const propagated = propagateConstraints(grid, cell, tileIndex);

    if (!propagated) {
      // Propagation failed - contradiction
      options?.onDebug?.(`WFC failed: propagation contradiction after ${iterations} iterations`);
      return {
        width,
        height,
        grid: extractTileIds(grid),
        success: false,
        iterations,
      };
    }
  }

  // Max iterations reached - partial success
  options?.onDebug?.(`WFC reached max iterations (${maxIterations})`);
  return {
    width,
    height,
    grid: extractTileIds(grid),
    success: false,
    iterations,
  };
}

/**
 * Find the cell with minimum entropy (fewest non-zero options)
 */
function findMinEntropyCell(grid: WFCGrid): Cell | null {
  let minEntropy = Infinity;
  let minCell: Cell | null = null;

  for (const row of grid.cells) {
    for (const cell of row) {
      if (cell.collapsed) continue;

      const entropy = cell.options.size;
      if (entropy === 0) {
        // Cell has no options - contradiction
        return null;
      }

      if (entropy < minEntropy) {
        minEntropy = entropy;
        minCell = cell;
      }
    }
  }

  return minCell;
}

/**
 * Collapse a cell by choosing one of its possible tiles
 * Uses weighted random selection based on tile weights
 */
function collapseCell(cell: Cell, tiles: WFCTile[], rng: () => number): string | null {
  if (cell.options.size === 0) return null;

  // Get valid tiles and their weights
  const validTiles = tiles.filter((t) => cell.options.has(t.id));
  const totalWeight = validTiles.reduce((sum, t) => sum + t.weight, 0);

  // Weighted random selection
  let random = rng() * totalWeight;
  for (const tile of validTiles) {
    random -= tile.weight;
    if (random <= 0) {
      return tile.id;
    }
  }

  // Fallback (shouldn't reach here)
  return validTiles[0]?.id ?? null;
}

/**
 * Propagate constraints from a collapsed cell to its neighbors
 * Removes invalid options from neighboring cells
 */
function propagateConstraints(grid: WFCGrid, cell: Cell, tileIndex: Map<string, WFCTile>): boolean {
  const queue: Cell[] = [cell];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const currentTile = tileIndex.get(current.tileId ?? '')!;
    if (!currentTile) continue;

    // Check all 4 directions
    const neighbors = [
      { cell: getCell(grid, current.x, current.y - 1), dir: 'north' as const },
      { cell: getCell(grid, current.x, current.y + 1), dir: 'south' as const },
      { cell: getCell(grid, current.x + 1, current.y), dir: 'east' as const },
      { cell: getCell(grid, current.x - 1, current.y), dir: 'west' as const },
    ];

    for (const { cell: neighbor, dir } of neighbors) {
      if (!neighbor || neighbor.collapsed) continue;

      // Get valid tile IDs for this direction
      const validIds = currentTile[dir];

      // Remove invalid options from neighbor
      const originalSize = neighbor.options.size;
      neighbor.options = new Set([...neighbor.options].filter((id) => validIds.includes(id)));

      // If options changed, add to queue
      if (neighbor.options.size !== originalSize) {
        if (neighbor.options.size === 0) {
          return false; // Contradiction
        }
        queue.push(neighbor);
      }
    }
  }

  return true;
}

/**
 * Get cell at position (or null if out of bounds)
 */
function getCell(grid: WFCGrid, x: number, y: number): Cell | null {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    return null;
  }
  const row = grid.cells[y];
  if (!row) return null;
  return row[x] ?? null;
}

/**
 * Extract final tile IDs from grid
 */
function extractTileIds(grid: WFCGrid): string[][] {
  const result: string[][] = [];

  for (const row of grid.cells) {
    const rowIds: string[] = [];
    for (const cell of row) {
      rowIds.push(cell.tileId ?? 'empty');
    }
    result.push(rowIds);
  }

  return result;
}

/**
 * Apply WFC result to a grid of tiles
 */
export function applyWFCToGrid<T>(result: WFCResult, tileMap: Map<string, T>, defaultTile: T): T[][] {
  const output: T[][] = [];

  for (const row of result.grid) {
    const outputRow: T[] = [];
    for (const tileId of row) {
      outputRow.push(tileMap.get(tileId) ?? defaultTile);
    }
    output.push(outputRow);
  }

  return output;
}
""""""


File: wfc/wfc-tiles.ts
""""""
/**
 * WFC Tile Definitions
 * Defines tiles and their adjacency rules for Wave Function Collapse
 */

export interface WFCTile {
  id: string;
  name: string;
  weight: number; // Probability weight for this tile
  // Adjacency constraints: which tile IDs can be adjacent in each direction
  north: string[];
  south: string[];
  east: string[];
  west: string[];
  // Visual/block type
  blockType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Define basic terrain tiles with adjacency rules
 */
export const TERRAIN_TILES: WFCTile[] = [
  {
    id: 'grass',
    name: 'Grass',
    weight: 10,
    north: ['grass', 'forest', 'stone', 'water'],
    south: ['grass', 'forest', 'stone', 'water'],
    east: ['grass', 'forest', 'stone', 'water'],
    west: ['grass', 'forest', 'stone', 'water'],
    blockType: 'grass',
  },
  {
    id: 'forest',
    name: 'Forest',
    weight: 5,
    north: ['grass', 'forest'],
    south: ['grass', 'forest'],
    east: ['grass', 'forest'],
    west: ['grass', 'forest'],
    blockType: 'grass',
    metadata: { hasTree: true },
  },
  {
    id: 'stone',
    name: 'Stone',
    weight: 3,
    north: ['grass', 'stone', 'mountain'],
    south: ['grass', 'stone', 'mountain'],
    east: ['grass', 'stone', 'mountain'],
    west: ['grass', 'stone', 'mountain'],
    blockType: 'stone',
  },
  {
    id: 'mountain',
    name: 'Mountain',
    weight: 2,
    north: ['stone', 'mountain'],
    south: ['stone', 'mountain'],
    east: ['stone', 'mountain'],
    west: ['stone', 'mountain'],
    blockType: 'stone',
    metadata: { elevation: 5 },
  },
  {
    id: 'water',
    name: 'Water',
    weight: 4,
    north: ['grass', 'water', 'sand'],
    south: ['grass', 'water', 'sand'],
    east: ['grass', 'water', 'sand'],
    west: ['grass', 'water', 'sand'],
    blockType: 'water',
  },
  {
    id: 'sand',
    name: 'Sand',
    weight: 3,
    north: ['sand', 'water', 'grass'],
    south: ['sand', 'water', 'grass'],
    east: ['sand', 'water', 'grass'],
    west: ['sand', 'water', 'grass'],
    blockType: 'sand',
  },
];

/**
 * Define structure tiles for building generation
 */
export const STRUCTURE_TILES: WFCTile[] = [
  {
    id: 'empty',
    name: 'Empty',
    weight: 20,
    north: ['empty', 'wall', 'door'],
    south: ['empty', 'wall', 'door'],
    east: ['empty', 'wall', 'door'],
    west: ['empty', 'wall', 'door'],
    blockType: 'air',
  },
  {
    id: 'wall',
    name: 'Wall',
    weight: 5,
    north: ['wall', 'corner', 'door'],
    south: ['wall', 'corner', 'door'],
    east: ['wall', 'corner', 'door'],
    west: ['wall', 'corner', 'door'],
    blockType: 'stone',
    metadata: { isWall: true },
  },
  {
    id: 'corner',
    name: 'Corner',
    weight: 2,
    north: ['wall', 'corner'],
    south: ['wall', 'corner'],
    east: ['wall', 'corner'],
    west: ['wall', 'corner'],
    blockType: 'stone',
    metadata: { isWall: true, isCorner: true },
  },
  {
    id: 'door',
    name: 'Door',
    weight: 1,
    north: ['wall', 'empty'],
    south: ['wall', 'empty'],
    east: ['wall', 'empty'],
    west: ['wall', 'empty'],
    blockType: 'air',
    metadata: { isDoor: true },
  },
  {
    id: 'floor',
    name: 'Floor',
    weight: 10,
    north: ['floor', 'wall', 'empty'],
    south: ['floor', 'wall', 'empty'],
    east: ['floor', 'wall', 'empty'],
    west: ['floor', 'wall', 'empty'],
    blockType: 'dirt',
    metadata: { isFloor: true },
  },
];

/**
 * Create a tile index for fast lookup
 */
export function createTileIndex(tiles: WFCTile[]): Map<string, WFCTile> {
  const index = new Map<string, WFCTile>();
  for (const tile of tiles) {
    index.set(tile.id, tile);
  }
  return index;
}

/**
 * Check if two tiles can be adjacent
 */
export function canBeAdjacent(tile1: WFCTile, tile2: WFCTile, direction: 'north' | 'south' | 'east' | 'west'): boolean {
  return tile1[direction].includes(tile2.id);
}
""""""


