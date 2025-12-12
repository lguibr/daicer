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
