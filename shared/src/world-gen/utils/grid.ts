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
