/**
 * Grid Expander Service
 * Pure functions for expanding and merging grid data
 * NO side effects - all functions are deterministic
 */

import type { GridTile } from 'daicer/shared/world';
import type { TerrainChunk } from '../types';

/**
 * Merges a chunk into the existing grid, expanding as needed
 * Returns new grid and new offset (immutable)
 */
export function mergeChunkIntoGrid(
  existingGrid: (GridTile | null)[][],
  chunk: TerrainChunk,
  currentOffset: { x: number; y: number },
  chunkSize: number
): { newGrid: (GridTile | null)[][]; newOffset: { x: number; y: number } } {
  // Deep clone the grid to maintain immutability
  let newGrid = existingGrid.map((row) => [...row]);
  let newOffsetX = currentOffset.x;
  let newOffsetY = currentOffset.y;

  // Expand LEFT if chunk is west of current grid
  if (chunk.worldOffsetX < currentOffset.x) {
    const extraCols = currentOffset.x - chunk.worldOffsetX;
    newGrid = newGrid.map((row) => [...Array(extraCols).fill(null), ...row]);
    newOffsetX = chunk.worldOffsetX;
  }

  // Expand TOP if chunk is north of current grid
  if (chunk.worldOffsetY < currentOffset.y) {
    const extraRows = currentOffset.y - chunk.worldOffsetY;
    const currentWidth = newGrid[0]?.length || 0;
    const topRows = Array(extraRows)
      .fill(null)
      .map(() => Array(currentWidth).fill(null));
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
    newGrid = newGrid.map((row) => [...row, ...Array(widthDiff).fill(null)]);
  }

  // Expand BOTTOM if needed
  const requiredHeight = Math.max(newGrid.length, gridY + chunkSize);
  if (requiredHeight > newGrid.length) {
    const heightDiff = requiredHeight - newGrid.length;
    const currentWidth = newGrid[0]?.length || 0;
    const bottomRows = Array(heightDiff)
      .fill(null)
      .map(() => Array(currentWidth).fill(null));
    newGrid = [...newGrid, ...bottomRows];
  }

  // Stamp chunk tiles onto grid
  if (chunk.tiles && Array.isArray(chunk.tiles)) {
    chunk.tiles.forEach((tile: any) => {
      // Calculate local coordinates relative to the grid
      // tile.x/y are world coordinates
      const targetX = tile.x - newOffsetX;
      const targetY = tile.y - newOffsetY;

      if (
        targetY >= 0 &&
        targetY < newGrid.length &&
        targetX >= 0 &&
        newGrid[targetY] &&
        targetX < newGrid[targetY].length
      ) {
        newGrid[targetY][targetX] = tile;
      }
    });
  } else if (chunk.biomes && Array.isArray(chunk.biomes)) {
    // Handle 2D biomes array (standard for new system)
    // Handle 2D biomes array (standard for new system)
    chunk.biomes.forEach((row: any, y: number) => {
      if (!Array.isArray(row)) return;
      row.forEach((tile: any, x: number) => {
        // Calculate world coordinates from chunk offset
        const worldX = chunk.worldOffsetX + x;
        const worldY = chunk.worldOffsetY + y;

        const targetX = worldX - newOffsetX;
        const targetY = worldY - newOffsetY;

        if (
          targetY >= 0 &&
          targetY < newGrid.length &&
          targetX >= 0 &&
          newGrid[targetY] &&
          targetX < newGrid[targetY].length
        ) {
          // Ensure tile is a proper GridTile object
          const tileObj =
            typeof tile === 'string'
              ? ({ x: worldX, y: worldY, z: 0, biome: tile, blockType: 'grass' } as GridTile)
              : tile;

          newGrid[targetY]![targetX] = tileObj;
        }
      });
    });
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

  const currentHeight = grid.length;
  const currentWidth = grid[0]?.length || 0;

  if (direction === 'left') {
    const newCols = Array(currentHeight)
      .fill(null)
      .map(() => Array(amount).fill(fillValue));
    return grid.map((row, i) => [...(newCols[i] || []), ...row]);
  }

  if (direction === 'right') {
    const newCols = Array(currentHeight)
      .fill(null)
      .map(() => Array(amount).fill(fillValue));
    return grid.map((row, i) => [...row, ...(newCols[i] || [])]);
  }

  if (direction === 'top') {
    const newRows = Array(amount)
      .fill(null)
      .map(() => Array(currentWidth).fill(fillValue));
    return [...newRows, ...grid];
  }

  if (direction === 'bottom') {
    const newRows = Array(amount)
      .fill(null)
      .map(() => Array(currentWidth).fill(fillValue));
    return [...grid, ...newRows];
  }

  return grid;
}

/**
 * Generates a unique key for a chunk
 */
export function getChunkKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Parses a chunk key back to coordinates
 */
export function parseChunkKey(key: string): { x: number; y: number } {
  const parts = key.split(',').map((n) => parseInt(n, 10));
  const x = parts[0];
  const y = parts[1];

  if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
    return { x: 0, y: 0 };
  }

  return { x, y };
}
