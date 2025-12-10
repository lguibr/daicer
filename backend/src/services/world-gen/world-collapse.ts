/**
 * World Collapse Service
 * Modifies terrain generation to accommodate structures and roads
 */

import type { Structure } from '@daicer/shared/world/structure-schema';
import type { Road } from '@daicer/shared/world/road-schema';
import type { WorldGenerationParams } from './worldGenService';
import { logger } from '@/utils/logger';

export interface CollapseInfluence {
  x: number;
  y: number;
  radius: number;
  type: 'structure' | 'road';
  flatten: boolean; // Should terrain be flattened?
  targetElevation: number; // Target elevation for this area
  strength: number; // How strongly this influence affects terrain (0-1)
}

export interface CollapseData {
  influences: CollapseInfluence[];
  structureMap: Map<string, { x: number; y: number; radius: number }>;
  roadSegments: Array<{ x1: number; y1: number; x2: number; y2: number; width: number }>;
}

/**
 * Create collapse data from structures and roads
 * This modifies terrain generation to place structures logically
 * @param structures - Placed structures
 * @param roads - Generated roads
 * @param params - World generation parameters
 * @returns Collapse data to apply during chunk generation
 */
export function collapseWorldAroundStructures(
  structures: Structure[],
  roads: Road[],
  _params: WorldGenerationParams
): CollapseData {
  logger.info(`[WorldCollapse] Creating collapse data for ${structures.length} structures and ${roads.length} roads`);

  const influences: CollapseInfluence[] = [];
  const structureMap = new Map<string, { x: number; y: number; radius: number }>();

  // Process structures
  for (const structure of structures) {
    const radius = getStructureInfluenceRadius(structure.size);
    const elevation = getStructureElevation(structure.type);

    influences.push({
      x: structure.x,
      y: structure.y,
      radius,
      type: 'structure',
      flatten: true,
      targetElevation: elevation,
      strength: Math.min(structure.significance / 10, 1.0),
    });

    structureMap.set(structure.id, {
      x: structure.x,
      y: structure.y,
      radius: radius / 2, // Core radius for placement
    });
  }

  // Process roads - create influences along waypoints
  const roadSegments: Array<{ x1: number; y1: number; x2: number; y2: number; width: number }> = [];

  for (const road of roads) {
    const roadWidth = getRoadWidth(road.quality);

    // Create influence points along each road segment
    for (let i = 0; i < road.waypoints.length - 1; i++) {
      const wp1 = road.waypoints[i];
      const wp2 = road.waypoints[i + 1];

      if (!wp1 || !wp2) continue;

      roadSegments.push({
        x1: wp1.x,
        y1: wp1.y,
        x2: wp2.x,
        y2: wp2.y,
        width: roadWidth,
      });

      // Add influences at waypoints
      influences.push({
        x: wp1.x,
        y: wp1.y,
        radius: roadWidth * 2,
        type: 'road',
        flatten: true,
        targetElevation: 0.1, // Roads prefer slightly elevated flat ground
        strength: 0.6,
      });
    }

    // Last waypoint
    if (road.waypoints.length > 0) {
      const lastWp = road.waypoints[road.waypoints.length - 1];
      if (lastWp) {
        influences.push({
          x: lastWp.x,
          y: lastWp.y,
          radius: getRoadWidth(road.quality) * 2,
          type: 'road',
          flatten: true,
          targetElevation: 0.1,
          strength: 0.6,
        });
      }
    }
  }

  logger.info(`[WorldCollapse] Created ${influences.length} collapse influences`);

  return {
    influences,
    structureMap,
    roadSegments,
  };
}

/**
 * Apply collapse influence to a specific position during chunk generation
 * @param x - World X coordinate
 * @param y - World Y coordinate
 * @param baseElevation - Original elevation from noise
 * @param collapseData - Collapse influences
 * @returns Modified elevation
 */
export function applyCollapseInfluence(
  x: number,
  y: number,
  baseElevation: number,
  collapseData: CollapseData
): number {
  if (!collapseData || collapseData.influences.length === 0) {
    return baseElevation;
  }

  let modifiedElevation = baseElevation;
  let totalInfluence = 0;

  // Check all influences
  for (const influence of collapseData.influences) {
    const distance = Math.sqrt(Math.pow(x - influence.x, 2) + Math.pow(y - influence.y, 2));

    if (distance < influence.radius) {
      // Calculate falloff (1 at center, 0 at radius edge)
      const falloff = 1 - distance / influence.radius;
      const effectiveStrength = influence.strength * falloff;

      // Blend towards target elevation
      modifiedElevation = lerp(modifiedElevation, influence.targetElevation, effectiveStrength);

      totalInfluence += effectiveStrength;
    }
  }

  // Check if on road segment
  for (const segment of collapseData.roadSegments) {
    const distToSegment = pointToSegmentDistance(x, y, segment.x1, segment.y1, segment.x2, segment.y2);

    if (distToSegment < segment.width) {
      // On road - flatten significantly
      const falloff = 1 - distToSegment / segment.width;
      modifiedElevation = lerp(modifiedElevation, 0.05, falloff * 0.8);
      totalInfluence += falloff;
    }
  }

  return modifiedElevation;
}

/**
 * Check if a position is within a structure's footprint
 */
export function isInStructureFootprint(x: number, y: number, collapseData: CollapseData): boolean {
  for (const [_id, struct] of collapseData.structureMap.entries()) {
    const distance = Math.sqrt(Math.pow(x - struct.x, 2) + Math.pow(y - struct.y, 2));

    if (distance < struct.radius) {
      return true;
    }
  }
  return false;
}

/**
 * Get influence radius based on structure size
 */
function getStructureInfluenceRadius(size: Structure['size']): number {
  const radiusMap = {
    tiny: 15,
    small: 25,
    medium: 40,
    large: 60,
    huge: 100,
  };
  return radiusMap[size];
}

/**
 * Get preferred elevation for structure type
 */
function getStructureElevation(type: Structure['type']): number {
  const elevationMap = {
    settlement: 0.15, // Slightly elevated for drainage
    dungeon: 0.3, // Hills/mountains
    landmark: 0.4, // Prominent high ground
    ruin: 0.1, // Can be anywhere, slightly elevated
    natural: 0.2, // Natural features vary
  };
  return elevationMap[type];
}

/**
 * Get road width based on quality
 */
function getRoadWidth(quality: Road['quality']): number {
  const widthMap = {
    trail: 3,
    path: 5,
    road: 8,
    highway: 12,
  };
  return widthMap[quality];
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Distance from point to line segment
 */
function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Segment is a point
    return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
  }

  // Project point onto line segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt(Math.pow(px - projX, 2) + Math.pow(py - projY, 2));
}
