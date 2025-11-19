/**
 * Wave Function Collapse Solver
 * Core WFC algorithm for constraint-based procedural generation
 */

import { Alea } from '../noise';
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

/**
 * Main WFC solver
 * Collapses a grid of possibilities into a single valid configuration
 */
export function collapseGrid(
  width: number,
  height: number,
  tiles: WFCTile[],
  seed: string,
  maxIterations: number = width * height * 10
): WFCResult {
  const rng = Alea(seed);
  const tileIndex = createTileIndex(tiles);

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

    // Find cell with minimum entropy (fewest options)
    const cell = findMinEntropyCell(grid);

    if (!cell) {
      // All cells collapsed - success!
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

    // Propagate constraints to neighbors
    const propagated = propagateConstraints(grid, cell, tileIndex);

    if (!propagated) {
      // Propagation failed - contradiction
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
