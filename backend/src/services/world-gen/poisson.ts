/* eslint-disable complexity */
/**
 * Poisson Disk Sampling for natural feature placement
 * Ensures features (trees, rocks, etc.) are evenly spaced without clustering
 */

import { SimplexNoise } from './noise';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface FeaturePlacement {
  position: Point3D;
  featureType: 'tree' | 'rock' | 'grass' | 'flower' | 'structure';
  variant: number; // 0-1 for selecting tree species, rock size, etc.
  rotation: number; // 0-360 degrees
  scale: number; // Size multiplier
}

/**
 * Alias for compatibility
 */
export const poissonDiscSampling = poissonDiskSampling2D;

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
 * Generate features for a chunk based on biome density settings
 */
export function generateChunkFeatures(
  chunkX: number,
  chunkY: number,
  chunkSize: number,
  seed: string,
  biomeData: Array<{
    x: number;
    y: number;
    z: number;
    biomeName: string;
    treeDensity: number;
    rockDensity: number;
    grassDensity: number;
    flowerDensity: number;
    elevation: number;
    isSolid: boolean;
  }>
): FeaturePlacement[] {
  const features: FeaturePlacement[] = [];
  const noise = new SimplexNoise(`${seed}-features`);
  const rotationNoise = new SimplexNoise(`${seed}-rotation`);
  const scaleNoise = new SimplexNoise(`${seed}-scale`);

  // Calculate average densities for the chunk
  const surfaceTiles = biomeData.filter((tile) => tile.isSolid && tile.z === Math.floor(tile.elevation));

  if (surfaceTiles.length === 0) return features;

  const avgTreeDensity = surfaceTiles.reduce((sum, t) => sum + t.treeDensity, 0) / surfaceTiles.length;
  const avgRockDensity = surfaceTiles.reduce((sum, t) => sum + t.rockDensity, 0) / surfaceTiles.length;
  const avgGrassDensity = surfaceTiles.reduce((sum, t) => sum + t.grassDensity, 0) / surfaceTiles.length;
  const avgFlowerDensity = surfaceTiles.reduce((sum, t) => sum + t.flowerDensity, 0) / surfaceTiles.length;

  const worldX = chunkX * chunkSize;
  const worldY = chunkY * chunkSize;

  // Trees - use Poisson sampling for natural spacing
  if (avgTreeDensity > 0.01) {
    const treeMinDistance = Math.max(3, 10 * (1 - avgTreeDensity)); // Closer trees in dense forests
    const treePoints = poissonDiskSampling2D(
      chunkSize,
      chunkSize,
      treeMinDistance,
      30,
      `${seed}-trees-${chunkX}-${chunkY}`
    );

    for (const point of treePoints) {
      const x = Math.floor(point.x + worldX);
      const y = Math.floor(point.y + worldY);

      // Find the surface tile at this position
      const surfaceTile = surfaceTiles.find((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);

      if (surfaceTile && surfaceTile.treeDensity > 0.05) {
        // Random chance based on local tree density
        const spawnChance = noise.noise(x * 0.1, y * 0.1) * 0.5 + 0.5;
        if (spawnChance < surfaceTile.treeDensity) {
          features.push({
            position: { x, y, z: surfaceTile.z + 1 },
            featureType: 'tree',
            variant: noise.noise(x * 0.01, y * 0.01) * 0.5 + 0.5, // Tree species
            rotation: rotationNoise.noise(x, y) * 180 + 180, // 0-360
            scale: scaleNoise.noise(x * 0.05, y * 0.05) * 0.4 + 0.8, // 0.8-1.2
          });
        }
      }
    }
  }

  // Rocks - moderate spacing
  if (avgRockDensity > 0.01) {
    const rockMinDistance = Math.max(5, 15 * (1 - avgRockDensity));
    const rockPoints = poissonDiskSampling2D(
      chunkSize,
      chunkSize,
      rockMinDistance,
      20,
      `${seed}-rocks-${chunkX}-${chunkY}`
    );

    for (const point of rockPoints) {
      const x = Math.floor(point.x + worldX);
      const y = Math.floor(point.y + worldY);

      const surfaceTile = surfaceTiles.find((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);

      if (surfaceTile && surfaceTile.rockDensity > 0.01) {
        const spawnChance = noise.noise(x * 0.2, y * 0.2) * 0.5 + 0.5;
        if (spawnChance < surfaceTile.rockDensity) {
          features.push({
            position: { x, y, z: surfaceTile.z },
            featureType: 'rock',
            variant: noise.noise(x * 0.02, y * 0.02) * 0.5 + 0.5,
            rotation: rotationNoise.noise(x + 1000, y + 1000) * 180 + 180,
            scale: scaleNoise.noise(x * 0.03, y * 0.03) * 0.6 + 0.7, // 0.7-1.3
          });
        }
      }
    }
  }

  // Grass - dense placement
  if (avgGrassDensity > 0.1) {
    const grassMinDistance = 2;
    const grassPoints = poissonDiskSampling2D(
      chunkSize,
      chunkSize,
      grassMinDistance,
      15,
      `${seed}-grass-${chunkX}-${chunkY}`
    );

    for (const point of grassPoints) {
      const x = Math.floor(point.x + worldX);
      const y = Math.floor(point.y + worldY);

      const surfaceTile = surfaceTiles.find((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);

      if (surfaceTile && surfaceTile.grassDensity > 0.2) {
        const spawnChance = noise.noise(x * 0.5, y * 0.5) * 0.5 + 0.5;
        if (spawnChance < surfaceTile.grassDensity * 0.5) {
          // Lower actual spawn rate
          features.push({
            position: { x, y, z: surfaceTile.z + 1 },
            featureType: 'grass',
            variant: noise.noise(x * 0.1, y * 0.1) * 0.5 + 0.5,
            rotation: rotationNoise.noise(x + 2000, y + 2000) * 180 + 180,
            scale: scaleNoise.noise(x * 0.2, y * 0.2) * 0.3 + 0.85,
          });
        }
      }
    }
  }

  // Flowers - scattered placement
  if (avgFlowerDensity > 0.05) {
    const flowerMinDistance = 3;
    const flowerPoints = poissonDiskSampling2D(
      chunkSize,
      chunkSize,
      flowerMinDistance,
      20,
      `${seed}-flowers-${chunkX}-${chunkY}`
    );

    for (const point of flowerPoints) {
      const x = Math.floor(point.x + worldX);
      const y = Math.floor(point.y + worldY);

      const surfaceTile = surfaceTiles.find((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);

      if (surfaceTile && surfaceTile.flowerDensity > 0.1) {
        const spawnChance = noise.noise(x * 0.3, y * 0.3) * 0.5 + 0.5;
        if (spawnChance < surfaceTile.flowerDensity) {
          features.push({
            position: { x, y, z: surfaceTile.z + 1 },
            featureType: 'flower',
            variant: noise.noise(x * 0.15, y * 0.15) * 0.5 + 0.5, // Flower type
            rotation: rotationNoise.noise(x + 3000, y + 3000) * 180 + 180,
            scale: scaleNoise.noise(x * 0.25, y * 0.25) * 0.2 + 0.9,
          });
        }
      }
    }
  }

  return features;
}

/**
 * Density map for controlling feature placement
 */
export interface DensityMap {
  width: number;
  height: number;
  data: Float32Array; // 0-1 density values
}

/**
 * Create a density map from noise for organic feature distribution
 */
export function createDensityMap(width: number, height: number, seed: string, scale: number = 0.05): DensityMap {
  const noise = new SimplexNoise(seed);
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // Multi-octave noise for natural variation
      const value = noise.octaveNoise(x * scale, y * scale, 3, 0.5, 2.0) * 0.5 + 0.5; // 0-1 range
      data[y * width + x] = value;
    }
  }

  return { width, height, data };
}

/**
 * Sample density at a position with bilinear interpolation
 */
export function sampleDensity(densityMap: DensityMap, x: number, y: number): number {
  const { width, height, data } = densityMap;

  // Clamp to bounds
  const clampedX = Math.max(0, Math.min(width - 1, x));
  const clampedY = Math.max(0, Math.min(height - 1, y));

  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const fx = clampedX - x0;
  const fy = clampedY - y0;

  // Bilinear interpolation
  const v00 = data[y0 * width + x0] || 0;
  const v10 = data[y0 * width + x1] || 0;
  const v01 = data[y1 * width + x0] || 0;
  const v11 = data[y1 * width + x1] || 0;

  const v0 = v00 * (1 - fx) + v10 * fx;
  const v1 = v01 * (1 - fx) + v11 * fx;

  return v0 * (1 - fy) + v1 * fy;
}
