/**
 * Voronoi Road Network Generator
 * Creates organic road networks between structures using Voronoi diagrams
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import type { Road } from '@daicer/shared/world/road-schema';
import { Alea } from './noise';
import { logger } from '@/utils/logger';

interface Point {
  x: number;
  y: number;
}

interface VoronoiEdge {
  start: Point;
  end: Point;
  length: number;
}

/**
 * Generate road network using Voronoi diagram
 * Creates roads along Voronoi cell edges between structures
 */
export function generateVoronoiRoads(
  structures: Structure[],
  seed: string,
  mapWidth: number,
  mapHeight: number
): Road[] {
  if (structures.length < 2) {
    logger.warn('[VoronoiRoads] Need at least 2 structures for road network');
    return [];
  }

  logger.info(`[VoronoiRoads] Generating roads for ${structures.length} structures`);

  const rng = Alea(seed);

  // Extract structure positions as Voronoi seeds
  const points: Point[] = structures.map((s) => ({ x: s.x, y: s.y }));

  // Generate Voronoi diagram (simplified Delaunay triangulation approach)
  const edges = generateVoronoiEdges(points, mapWidth, mapHeight);

  // Convert edges to roads
  const roads: Road[] = [];
  const roadIdBase = Date.now();

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];

    // Determine road quality based on edge length and structure significance
    const quality = determineRoadQuality(edge.length, structures, rng);

    // Create smoothed waypoints
    const waypoints = smoothPath([edge.start, edge.end], 4, rng);

    roads.push({
      id: `voronoi_road_${roadIdBase}_${i}`,
      name: `Road ${i + 1}`,
      waypoints,
      quality,
      era: 0,
    });
  }

  logger.info(`[VoronoiRoads] Generated ${roads.length} roads`);
  return roads;
}

/**
 * Generate Voronoi edges (simplified using minimum spanning tree)
 * For production, consider using d3-delaunay library
 */
function generateVoronoiEdges(points: Point[], mapWidth: number, mapHeight: number): VoronoiEdge[] {
  const edges: VoronoiEdge[] = [];

  // Use minimum spanning tree approach (connects all points with minimal total distance)
  const connected = new Set<number>([0]); // Start with first point
  const unconnected = new Set(points.map((_, i) => i).slice(1));

  while (unconnected.size > 0) {
    let minDist = Infinity;
    let bestEdge: { from: number; to: number } | null = null;

    // Find shortest edge from connected to unconnected
    for (const fromIdx of connected) {
      for (const toIdx of unconnected) {
        const dist = distance(points[fromIdx], points[toIdx]);
        if (dist < minDist) {
          minDist = dist;
          bestEdge = { from: fromIdx, to: toIdx };
        }
      }
    }

    if (bestEdge) {
      edges.push({
        start: points[bestEdge.from],
        end: points[bestEdge.to],
        length: minDist,
      });
      connected.add(bestEdge.to);
      unconnected.delete(bestEdge.to);
    } else {
      break; // No more connections possible
    }
  }

  return edges;
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Determine road quality based on length and structure significance
 */
function determineRoadQuality(length: number, structures: Structure[], rng: () => number): Road['quality'] {
  // Shorter roads or roads between significant structures = higher quality
  const avgSignificance = structures.reduce((sum, s) => sum + s.significance, 0) / structures.length;

  if (length < 50 && avgSignificance > 7) {
    return 'highway'; // Major road between important structures
  } else if (length < 100 && avgSignificance > 5) {
    return 'road';
  } else if (length < 200) {
    return 'path';
  } else {
    return 'trail';
  }
}

/**
 * Smooth a path by adding intermediate waypoints
 * Creates more organic curves instead of straight lines
 */
function smoothPath(waypoints: Point[], subdivisions: number, rng: () => number): Point[] {
  if (waypoints.length < 2) return waypoints;

  const first = waypoints[0];
  if (!first) return waypoints;

  const smoothed: Point[] = [first];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    if (!start || !end) continue;

    // Add intermediate points with slight random offset
    for (let j = 1; j <= subdivisions; j++) {
      const t = j / (subdivisions + 1);
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      // Add random perpendicular offset for curves
      const offsetMagnitude = 10;
      const angle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
      const offset = (rng() - 0.5) * offsetMagnitude;

      smoothed.push({
        x: x + Math.cos(angle) * offset,
        y: y + Math.sin(angle) * offset,
      });
    }

    smoothed.push(end);
  }

  return smoothed;
}

/**
 * Create road network ensuring all structures are connected
 * Uses Prim's algorithm for minimum spanning tree
 */
export function createConnectedRoadNetwork(structures: Structure[], seed: string): Road[] {
  if (structures.length === 0) return [];
  if (structures.length === 1) {
    // Single structure - no roads needed
    return [];
  }

  const rng = Alea(seed);
  const roads: Road[] = [];
  const firstStruct = structures[0];
  if (!firstStruct) return [];

  const connected = new Set<string>([firstStruct.id]);
  const unconnected = new Set(structures.slice(1).map((s) => s.id));
  const structMap = new Map(structures.map((s) => [s.id, s]));

  while (unconnected.size > 0) {
    let minDist = Infinity;
    let bestPair: { from: string; to: string } | null = null;

    for (const fromId of connected) {
      for (const toId of unconnected) {
        const from = structMap.get(fromId)!;
        const to = structMap.get(toId)!;
        const dist = distance(from, to);

        if (dist < minDist) {
          minDist = dist;
          bestPair = { from: fromId, to: toId };
        }
      }
    }

    if (bestPair) {
      const from = structMap.get(bestPair.from);
      const to = structMap.get(bestPair.to);

      if (!from || !to) {
        unconnected.delete(bestPair.to);
        continue;
      }

      // Create road
      const waypoints = smoothPath(
        [
          { x: from.x, y: from.y },
          { x: to.x, y: to.y },
        ],
        3,
        rng
      );
      const quality = determineRoadQuality(minDist, [from, to], rng);

      roads.push({
        id: `road_${from.id}_${to.id}`,
        name: `Road: ${from.name} to ${to.name}`,
        waypoints,
        quality,
        era: Math.max(from.era, to.era),
      });

      connected.add(bestPair.to);
      unconnected.delete(bestPair.to);
    } else {
      break;
    }
  }

  return roads;
}
