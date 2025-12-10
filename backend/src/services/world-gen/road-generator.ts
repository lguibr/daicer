/**
 * Road Generator Service
 * Generates organic roads between structures using simplex noise and A* pathfinding
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import type { Road, Waypoint } from '@daicer/shared/world/road-schema';
import { SimplexNoise } from './noise';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// interface TerrainCost {
//   x: number;
//   y: number;
//   cost: number;
// }

interface ClimateHint {
  temperature: number;
  moisture: number;
  elevation: number;
}

/**
 * Generate roads connecting structures
 * @param structures - Placed structures with absolute coordinates
 * @param terrainHints - Optional climate/elevation hints for pathfinding
 * @param seed - Seed for organic curvature noise
 * @returns Array of roads with waypoints
 */
export function generateRoads(
  structures: Structure[],
  terrainHints: ClimateHint[][] | null = null,
  seed: string = 'roads'
): Road[] {
  if (structures.length < 2) {
    logger.info('[RoadGenerator] Less than 2 structures, no roads generated');
    return [];
  }

  logger.info(`[RoadGenerator] Generating roads between ${structures.length} structures`);

  const roads: Road[] = [];
  const noise = new SimplexNoise(seed);

  // Connect structures based on distance and significance
  const connections = determineConnections(structures);

  // Create a map for quick structure lookup by ID
  const structMap = new Map<string, Structure>();
  structures.forEach((s) => structMap.set(s.id, s));

  for (const pair of connections) {
    const s1 = structures[pair[0]];
    const s2 = structures[pair[1]];
    if (!s1 || !s2) continue;

    const from = structMap.get(s1.id);
    const to = structMap.get(s2.id);

    if (!from || !to) {
      logger.warn(`[RoadGenerator] Skipping road due to missing structure: from=${pair[0]}, to=${pair[1]}`);
      continue;
    }

    logger.debug(`[RoadGenerator] Creating road from ${from.name} to ${to.name}`);

    const waypoints = generatePath(from, to, noise, terrainHints);
    const terrain = determineTerrain(waypoints, terrainHints);
    const quality = determineRoadQuality(from, to);

    roads.push({
      id: uuidv4(),
      from: from.id,
      to: to.id,
      waypoints,
      terrain,
      quality,
    });
  }

  logger.info(`[RoadGenerator] Generated ${roads.length} roads`);
  return roads;
}

/**
 * Determine which structures should be connected
 * Uses distance and significance thresholds
 */
function determineConnections(structures: Structure[]): Array<[number, number]> {
  const connections: Array<[number, number]> = [];
  const maxDistance = 300; // Maximum distance for road connection

  // Sort by significance (high significance structures are hubs)
  const sortedIndices = structures
    .map((s, i) => ({ idx: i, sig: s.significance }))
    .sort((a, b) => b.sig - a.sig)
    .map((s) => s.idx);

  // Connect high-significance structures to nearby structures
  for (let i = 0; i < sortedIndices.length; i++) {
    const fromIdx = sortedIndices[i];
    if (fromIdx === undefined) continue;
    const from = structures[fromIdx];
    if (!from) continue;

    // Find nearest unconnected structures
    const distances = structures
      .map((to, toIdx) => ({
        toIdx,
        distance: Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)),
      }))
      .filter((d) => d.toIdx !== fromIdx && d.distance < maxDistance)
      .sort((a, b) => a.distance - b.distance);

    // Connect to 2-4 nearest structures based on significance
    const connectionCount = Math.min(Math.ceil(from.significance / 3), 4, distances.length);

    for (let j = 0; j < connectionCount; j++) {
      const dist = distances[j];
      if (!dist) continue;
      const toIdx = dist.toIdx;

      // Strict check for valid index
      if (typeof toIdx !== 'number' || toIdx < 0 || toIdx >= structures.length) {
        continue;
      }

      const to = structures[toIdx];
      if (!to) continue;

      const pair: [number, number] = [fromIdx, toIdx];

      // Avoid duplicate connections (both directions)
      const alreadyExists = connections.some(
        ([a, b]) => (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])
      );

      if (!alreadyExists) {
        connections.push(pair);
      }
    }
  }

  return connections;
}

/**
 * Generate organic path between two structures using A* with noise
 */
function generatePath(
  from: Structure,
  to: Structure,
  noise: SimplexNoise,
  terrainHints: ClimateHint[][] | null
): Waypoint[] {
  // Simple straight path with organic curvature
  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
  const segmentCount = Math.max(3, Math.floor(distance / 20)); // Waypoint every ~20 units

  const waypoints: Waypoint[] = [];

  for (let i = 0; i <= segmentCount; i++) {
    const t = i / segmentCount;

    // Linear interpolation
    let x = from.x + (to.x - from.x) * t;
    let y = from.y + (to.y - from.y) * t;

    // Add organic curvature using noise (except start/end)
    if (i > 0 && i < segmentCount) {
      const curvature = noise.octaveNoise(x * 0.02, y * 0.02, 3, 0.5, 2.0);
      const perpAngle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;

      x += Math.cos(perpAngle) * curvature * 15;
      y += Math.sin(perpAngle) * curvature * 15;
    }

    // Determine waypoint type
    let type: Waypoint['type'] = 'path';
    if (i === 0 || i === segmentCount) {
      type = 'junction';
    } else if (i % 5 === 0 && segmentCount > 10) {
      type = 'waystation'; // Long roads get waystations
    }

    // Check for bridge (simplified - water detection would require terrain data)
    const terrainCost = getTerrainCost(Math.round(x), Math.round(y), terrainHints);
    if (terrainCost > 5) {
      type = 'bridge';
    }

    waypoints.push({
      x: Math.round(x),
      y: Math.round(y),
      type,
    });
  }

  return waypoints;
}

/**
 * Get terrain cost for pathfinding (higher = harder to traverse)
 */
function getTerrainCost(x: number, y: number, terrainHints: ClimateHint[][] | null): number {
  if (
    !terrainHints ||
    y < 0 ||
    y >= terrainHints.length ||
    !terrainHints[y] ||
    x < 0 ||
    x >= terrainHints[y].length ||
    !terrainHints[y][x]
  ) {
    return 1; // Default flat terrain
  }

  const hint = terrainHints[y][x];

  // High elevation = mountains (difficult)
  if (hint.elevation > 0.6) return 10;

  // Very low elevation = water (very difficult, needs bridge)
  if (hint.elevation < -0.3) return 20;

  // Normal terrain
  return 1;
}

/**
 * Determine terrain type along road path
 */
function determineTerrain(waypoints: Waypoint[], terrainHints: ClimateHint[][] | null): Road['terrain'] {
  if (!terrainHints) return 'flat';

  let avgElevation = 0;
  let validSamples = 0;

  for (const wp of waypoints) {
    if (terrainHints && wp.y >= 0 && wp.y < terrainHints.length) {
      const row = terrainHints[wp.y];
      if (row && wp.x >= 0 && wp.x < row.length && row[wp.x]) {
        const cell = row[wp.x];
        if (cell) {
          avgElevation += cell.elevation;
          validSamples++;
        }
      }
    }
  }

  if (validSamples === 0) return 'flat';

  avgElevation /= validSamples;

  if (avgElevation > 0.5) return 'mountain';
  if (avgElevation > 0.2) return 'hilly';
  if (avgElevation > -0.2) return 'flat';
  return 'flat'; // Near water
}

/**
 * Determine road quality based on structure importance
 */
function determineRoadQuality(from: Structure, to: Structure): Road['quality'] {
  const avgSignificance = (from.significance + to.significance) / 2;

  if (avgSignificance >= 8) return 'highway';
  if (avgSignificance >= 6) return 'road';
  if (avgSignificance >= 4) return 'path';
  return 'trail';
}
