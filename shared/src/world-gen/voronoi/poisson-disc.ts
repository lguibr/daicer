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
