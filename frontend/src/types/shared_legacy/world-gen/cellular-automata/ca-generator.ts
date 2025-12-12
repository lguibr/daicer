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
