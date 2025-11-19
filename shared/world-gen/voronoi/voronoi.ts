/**
 * Voronoi diagram utilities
 */

import type { Point2D } from './types';

/**
 * Find nearest Voronoi seed point
 */
export function findNearestVoronoiSeed(x: number, y: number, seeds: Point2D[]): Point2D {
  let nearestSeed = seeds[0];
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
