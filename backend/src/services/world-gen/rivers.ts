/**
 * River and Lake Generation
 * Gradient-based water flow simulation with basin detection
 */

import { SimplexNoise } from './noise';

export interface WaterFeature {
  type: 'river' | 'lake' | 'spring';
  points: Array<{ x: number; y: number; z: number }>;
  width: number; // For rivers
  depth: number;
}

export interface HeightMap {
  width: number;
  height: number;
  data: Float32Array; // Elevation values
}

/**
 * Create height map from elevation data
 */
export function createHeightMap(
  width: number,
  height: number,
  elevationFn: (x: number, y: number) => number
): HeightMap {
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[y * width + x] = elevationFn(x, y);
    }
  }

  return { width, height, data };
}

/**
 * Get elevation at position
 */
function getElevation(heightMap: HeightMap, x: number, y: number): number {
  const { width, height, data } = heightMap;
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return Infinity; // Out of bounds = infinitely high
  }
  return data[y * width + x] || 0;
}

/**
 * Calculate gradient (steepest descent direction)
 */
function calculateGradient(heightMap: HeightMap, x: number, y: number): { dx: number; dy: number; magnitude: number } {
  const center = getElevation(heightMap, x, y);

  // Sample 8 neighbors
  const neighbors = [
    { dx: -1, dy: -1, h: getElevation(heightMap, x - 1, y - 1) },
    { dx: 0, dy: -1, h: getElevation(heightMap, x, y - 1) },
    { dx: 1, dy: -1, h: getElevation(heightMap, x + 1, y - 1) },
    { dx: -1, dy: 0, h: getElevation(heightMap, x - 1, y) },
    { dx: 1, dy: 0, h: getElevation(heightMap, x + 1, y) },
    { dx: -1, dy: 1, h: getElevation(heightMap, x - 1, y + 1) },
    { dx: 0, dy: 1, h: getElevation(heightMap, x, y + 1) },
    { dx: 1, dy: 1, h: getElevation(heightMap, x + 1, y + 1) },
  ];

  // Find steepest descent
  let steepestDx = 0;
  let steepestDy = 0;
  let steepestGradient = 0;

  for (const neighbor of neighbors) {
    const gradient = center - neighbor.h;
    if (gradient > steepestGradient) {
      steepestGradient = gradient;
      steepestDx = neighbor.dx;
      steepestDy = neighbor.dy;
    }
  }

  return {
    dx: steepestDx,
    dy: steepestDy,
    magnitude: steepestGradient,
  };
}

/**
 * Trace a river from source following gradient
 */
export function traceRiver(
  heightMap: HeightMap,
  startX: number,
  startY: number,
  waterLevel: number,
  maxLength: number = 1000
): WaterFeature {
  const points: Array<{ x: number; y: number; z: number }> = [];
  let x = startX;
  let y = startY;
  const visited = new Set<string>();

  for (let i = 0; i < maxLength; i += 1) {
    const key = `${Math.floor(x)},${Math.floor(y)}`;
    if (visited.has(key)) {
      break; // Loop detected
    }
    visited.add(key);

    const elevation = getElevation(heightMap, Math.floor(x), Math.floor(y));

    // Stop if we hit water level (ocean/lake)
    if (elevation <= waterLevel) {
      points.push({ x: Math.floor(x), y: Math.floor(y), z: waterLevel });
      break;
    }

    points.push({ x: Math.floor(x), y: Math.floor(y), z: elevation });

    // Follow gradient
    const gradient = calculateGradient(heightMap, Math.floor(x), Math.floor(y));

    if (gradient.magnitude < 0.01) {
      // Flat area or local minimum - stop
      break;
    }

    // Move in gradient direction
    x += gradient.dx;
    y += gradient.dy;

    // Out of bounds check
    if (x < 0 || x >= heightMap.width || y < 0 || y >= heightMap.height) {
      break;
    }
  }

  return {
    type: 'river',
    points,
    width: 2, // Default river width
    depth: 3,
  };
}

/**
 * Detect basins (local minima) for lake placement
 */
export function detectBasins(
  heightMap: HeightMap,
  waterLevel: number,
  minBasinSize: number = 5
): Array<{ x: number; y: number; z: number; size: number }> {
  const { width, height } = heightMap;
  const basins: Array<{ x: number; y: number; z: number; size: number }> = [];
  const visited = new Set<string>();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue; // eslint-disable-line no-continue

      const elevation = getElevation(heightMap, x, y);

      // Skip if at or below water level (already ocean)
      if (elevation <= waterLevel) continue; // eslint-disable-line no-continue

      // Check if this is a local minimum
      const gradient = calculateGradient(heightMap, x, y);

      if (gradient.magnitude < 0.1) {
        // Potential basin - flood fill to measure size
        const basinPoints: Array<{ x: number; y: number }> = [];
        const queue: Array<{ x: number; y: number }> = [{ x, y }];
        const basinVisited = new Set<string>();

        while (queue.length > 0) {
          const current = queue.shift();
          if (!current) break;

          const ck = `${current.x},${current.y}`;
          if (basinVisited.has(ck)) continue; // eslint-disable-line no-continue
          basinVisited.add(ck);
          visited.add(ck);

          const currentElevation = getElevation(heightMap, current.x, current.y);

          // Only include points within elevation threshold
          if (Math.abs(currentElevation - elevation) < 2) {
            basinPoints.push(current);

            // Check neighbors
            const neighbors = [
              { x: current.x - 1, y: current.y },
              { x: current.x + 1, y: current.y },
              { x: current.x, y: current.y - 1 },
              { x: current.x, y: current.y + 1 },
            ];

            for (const neighbor of neighbors) {
              if (
                neighbor.x >= 0 &&
                neighbor.x < width &&
                neighbor.y >= 0 &&
                neighbor.y < height &&
                !basinVisited.has(`${neighbor.x},${neighbor.y}`)
              ) {
                queue.push(neighbor);
              }
            }
          }
        }

        if (basinPoints.length >= minBasinSize) {
          basins.push({
            x,
            y,
            z: elevation,
            size: basinPoints.length,
          });
        }
      }
    }
  }

  return basins;
}

/**
 * Generate lakes in basins
 */
export function generateLakes(
  heightMap: HeightMap,
  basins: Array<{ x: number; y: number; z: number; size: number }>,
  waterLevel: number
): WaterFeature[] {
  const lakes: WaterFeature[] = [];

  for (const basin of basins) {
    const lakePoints: Array<{ x: number; y: number; z: number }> = [];

    // Flood fill from basin center up to water level
    const queue: Array<{ x: number; y: number }> = [{ x: basin.x, y: basin.y }];
    const visited = new Set<string>();
    const lakeLevel = Math.min(basin.z + 2, waterLevel); // Lake fills up a bit

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue; // eslint-disable-line no-continue
      visited.add(key);

      const elevation = getElevation(heightMap, current.x, current.y);

      if (elevation <= lakeLevel) {
        lakePoints.push({ x: current.x, y: current.y, z: lakeLevel });

        // Expand to neighbors
        const neighbors = [
          { x: current.x - 1, y: current.y },
          { x: current.x + 1, y: current.y },
          { x: current.x, y: current.y - 1 },
          { x: current.x, y: current.y + 1 },
        ];

        for (const neighbor of neighbors) {
          if (
            neighbor.x >= 0 &&
            neighbor.x < heightMap.width &&
            neighbor.y >= 0 &&
            neighbor.y < heightMap.height &&
            !visited.has(`${neighbor.x},${neighbor.y}`)
          ) {
            queue.push(neighbor);
          }
        }
      }
    }

    if (lakePoints.length > 0) {
      lakes.push({
        type: 'lake',
        points: lakePoints,
        width: 0, // Lakes don't have "width"
        depth: 5,
      });
    }
  }

  return lakes;
}

/**
 * Generate river sources (springs) in mountainous areas
 */
export function generateRiverSources(
  heightMap: HeightMap,
  seed: string,
  count: number,
  minElevation: number
): Array<{ x: number; y: number }> {
  const noise = new SimplexNoise(seed);
  const sources: Array<{ x: number; y: number }> = [];
  const { width, height } = heightMap;

  let attempts = 0;
  const maxAttempts = count * 10;

  while (sources.length < count && attempts < maxAttempts) {
    attempts += 1;

    const x = Math.floor(noise.noise(attempts, 0) * width * 0.5 + width * 0.5);
    const y = Math.floor(noise.noise(0, attempts) * height * 0.5 + height * 0.5);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      const elevation = getElevation(heightMap, x, y);

      if (elevation > minElevation) {
        sources.push({ x, y });
      }
    }
  }

  return sources;
}

/**
 * Generate complete water system for a region
 */
export function generateWaterSystem(
  heightMap: HeightMap,
  seed: string,
  options: {
    waterLevel?: number;
    riverCount?: number;
    minRiverElevation?: number;
    minBasinSize?: number;
  } = {}
): WaterFeature[] {
  const { waterLevel = 0, riverCount = 10, minRiverElevation = 50, minBasinSize = 10 } = options;

  const features: WaterFeature[] = [];

  // Generate river sources
  const sources = generateRiverSources(heightMap, seed, riverCount, minRiverElevation);

  // Trace rivers from sources
  for (const source of sources) {
    const river = traceRiver(heightMap, source.x, source.y, waterLevel);
    if (river.points.length > 5) {
      // Only keep rivers with reasonable length
      features.push(river);
    }
  }

  // Detect basins
  const basins = detectBasins(heightMap, waterLevel, minBasinSize);

  // Generate lakes
  const lakes = generateLakes(heightMap, basins, waterLevel);
  features.push(...lakes);

  return features;
}

/**
 * Apply water features to world blocks
 */
export function applyWaterFeaturesToWorld(
  features: WaterFeature[],
  worldOffsetX: number,
  worldOffsetY: number
): Array<{ x: number; y: number; z: number; blockType: string }> {
  const blocks: Array<{ x: number; y: number; z: number; blockType: string }> = [];

  for (const feature of features) {
    for (const point of feature.points) {
      const worldX = point.x + worldOffsetX;
      const worldY = point.y + worldOffsetY;

      if (feature.type === 'river') {
        // River: place water and expand based on width
        for (let dx = -Math.floor(feature.width / 2); dx <= Math.floor(feature.width / 2); dx += 1) {
          for (let dy = -Math.floor(feature.width / 2); dy <= Math.floor(feature.width / 2); dy += 1) {
            for (let dz = 0; dz < feature.depth; dz += 1) {
              blocks.push({
                x: worldX + dx,
                y: worldY + dy,
                z: point.z - dz,
                blockType: 'water',
              });
            }
          }
        }
      } else if (feature.type === 'lake') {
        // Lake: place water at this position
        for (let dz = 0; dz < feature.depth; dz += 1) {
          blocks.push({
            x: worldX,
            y: worldY,
            z: point.z - dz,
            blockType: 'water',
          });
        }
      }
    }
  }

  return blocks;
}
