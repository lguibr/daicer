/**
 * Grid Expander Service
 * Pure functions for expanding and merging grid data
 * NO side effects - all functions are deterministic
 */

import type { TerrainChunk } from '../types';

/**
 * Merges a chunk into the existing grid, expanding as needed
 * Returns new grid and new offset (immutable)
 */
export function mergeChunkIntoGrid(
  existingGrid: string[][],
  chunk: TerrainChunk,
  currentOffset: { x: number; y: number },
  chunkSize: number
): { newGrid: string[][]; newOffset: { x: number; y: number } } {
  // Deep clone the grid to maintain immutability
  let newGrid = existingGrid.map((row) => [...row]);
  let newOffsetX = currentOffset.x;
  let newOffsetY = currentOffset.y;

  // Expand LEFT if chunk is west of current grid
  if (chunk.worldOffsetX < currentOffset.x) {
    const extraCols = currentOffset.x - chunk.worldOffsetX;
    newGrid = newGrid.map((row) => [...Array(extraCols).fill('plains'), ...row]);
    newOffsetX = chunk.worldOffsetX;
  }

  // Expand TOP if chunk is north of current grid
  if (chunk.worldOffsetY < currentOffset.y) {
    const extraRows = currentOffset.y - chunk.worldOffsetY;
    const currentWidth = newGrid[0]?.length || 0;
    const topRows = Array(extraRows)
      .fill(null)
      .map(() => Array(currentWidth).fill('plains'));
    newGrid = [...topRows, ...newGrid];
    newOffsetY = chunk.worldOffsetY;
  }

  // Calculate chunk position in grid coordinates
  const gridX = chunk.worldOffsetX - newOffsetX;
  const gridY = chunk.worldOffsetY - newOffsetY;

  // Expand RIGHT if needed
  const requiredWidth = Math.max(newGrid[0]?.length || 0, gridX + chunkSize);
  if (requiredWidth > (newGrid[0]?.length || 0)) {
    const widthDiff = requiredWidth - (newGrid[0]?.length || 0);
    newGrid = newGrid.map((row) => [...row, ...Array(widthDiff).fill('plains')]);
  }

  // Expand BOTTOM if needed
  const requiredHeight = Math.max(newGrid.length, gridY + chunkSize);
  if (requiredHeight > newGrid.length) {
    const heightDiff = requiredHeight - newGrid.length;
    const currentWidth = newGrid[0]?.length || 0;
    const bottomRows = Array(heightDiff)
      .fill(null)
      .map(() => Array(currentWidth).fill('plains'));
    newGrid = [...newGrid, ...bottomRows];
  }

  // Stamp chunk biomes onto grid
  for (let y = 0; y < chunk.biomes.length; y++) {
    const biomeRow = chunk.biomes[y];
    if (!biomeRow) continue;

    for (let x = 0; x < biomeRow.length; x++) {
      const targetX = gridX + x;
      const targetY = gridY + y;
      const biomeTile = biomeRow[x];

      if (
        targetY >= 0 &&
        targetY < newGrid.length &&
        targetX >= 0 &&
        newGrid[targetY] &&
        targetX < newGrid[targetY].length &&
        biomeTile
      ) {
        newGrid[targetY][targetX] = biomeTile;
      }
    }
  }

  return {
    newGrid,
    newOffset: { x: newOffsetX, y: newOffsetY },
  };
}

/**
 * Expands grid in a specific direction
 * Returns new grid (immutable)
 */
export function expandGrid(
  grid: string[][],
  direction: 'left' | 'right' | 'top' | 'bottom',
  amount: number,
  fillValue = 'plains'
): string[][] {
  if (amount <= 0) return grid;

  const currentWidth = grid[0]?.length || 0;
  const currentHeight = grid.length;

  switch (direction) {
    case 'left':
      return grid.map((row) => [...Array(amount).fill(fillValue), ...row]);

    case 'right':
      return grid.map((row) => [...row, ...Array(amount).fill(fillValue)]);

    case 'top': {
      const topRows = Array(amount)
        .fill(null)
        .map(() => Array(currentWidth).fill(fillValue));
      return [...topRows, ...grid];
    }

    case 'bottom': {
      const bottomRows = Array(amount)
        .fill(null)
        .map(() => Array(currentWidth).fill(fillValue));
      return [...grid, ...bottomRows];
    }

    default:
      return grid;
  }
}

/**
 * Gets the chunk key from chunk coordinates
 */
export function getChunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

/**
 * Parses chunk coordinates from chunk key
 */
export function parseChunkKey(chunkKey: string): { chunkX: number; chunkY: number } | null {
  const parts = chunkKey.split(',');
  if (parts.length !== 2) return null;

  const chunkX = parseInt(parts[0], 10);
  const chunkY = parseInt(parts[1], 10);

  if (isNaN(chunkX) || isNaN(chunkY)) return null;

  return { chunkX, chunkY };
}
