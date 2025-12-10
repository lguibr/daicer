/**
 * World Placement Service
 *
 * Manages the global structure placement map for rooms.
 * Generates and caches placement maps in Firestore for persistence.
 */

import { db } from '../config/firebase';
import {
  generateGlobalPlacementMap,
  type GlobalPlacementMap,
  type StructurePlacement,
  type PlacementMapParams,
} from '@daicer/shared/world-gen/structures/placement-map';
import type { RoadSegment } from '@daicer/shared/world-gen/structures/types';
import { logger } from '../utils/logger';

/**
 * In-memory cache of placement maps (per backend instance)
 * Key: roomId, Value: GlobalPlacementMap
 */
const placementMapCache = new Map<string, GlobalPlacementMap>();

/**
 * Firestore collection paths
 */
const PLACEMENT_COLLECTION = 'worldPlacement';
const STRUCTURES_SUBCOLLECTION = 'structures';
const ROADS_SUBCOLLECTION = 'roads';

/**
 * Firestore document size limit is 1MB
 * We batch structures and roads into grid cells to stay under this limit
 * Grid cell size: 64k x 64k (for a 512k world, this creates 8x8 = 64 docs)
 */
const GRID_CELL_SIZE = 64000;

/**
 * Get or create the placement map for a room
 *
 * Flow:
 * 1. Check in-memory cache
 * 2. If not cached, check Firestore
 * 3. If not in Firestore, generate and save
 *
 * @param roomId - Room identifier
 * @param seed - World generation seed
 * @param worldSize - World dimensions (e.g., 512000)
 * @param params - Placement parameters
 * @returns Complete placement map
 */
export async function getOrCreatePlacementMap(
  roomId: string,
  seed: string,
  worldSize: number,
  params: PlacementMapParams
): Promise<GlobalPlacementMap> {
  // Check in-memory cache
  if (placementMapCache.has(roomId)) {
    logger.info(`[PlacementService] Cache hit for room ${roomId}`);
    return placementMapCache.get(roomId)!;
  }

  // Check Firestore
  try {
    const placementDoc = await db
      .collection('rooms')
      .doc(roomId)
      .collection(PLACEMENT_COLLECTION)
      .doc('metadata')
      .get();

    if (placementDoc.exists) {
      logger.info(`[PlacementService] Loading from Firestore for room ${roomId}`);
      const metadata = placementDoc.data() as {
        worldSize: number;
        seed: string;
        generatedAt: number;
        structureCount: number;
        roadCount: number;
      };

      // Load structures from grid cells
      const structures = await loadStructuresFromFirestore(roomId, worldSize);

      // Load roads from grid cells
      const roads = await loadRoadsFromFirestore(roomId, worldSize);

      const placementMap: GlobalPlacementMap = {
        structures,
        roads,
        worldSize: metadata.worldSize,
        seed: metadata.seed,
        generatedAt: metadata.generatedAt,
      };

      // Cache in memory
      placementMapCache.set(roomId, placementMap);
      return placementMap;
    }
  } catch (error) {
    logger.error(`[PlacementService] Error loading from Firestore: ${error}`);
    // Fall through to generation
  }

  // Generate new placement map
  logger.info(`[PlacementService] Generating new placement map for room ${roomId}`);
  const placementMap = generateGlobalPlacementMap(seed, worldSize, params);

  // Save to Firestore asynchronously (don't block return)
  savePlacementMapToFirestore(roomId, placementMap).catch((error) => {
    logger.error(`[PlacementService] Failed to save placement map: ${error}`);
  });

  // Cache in memory
  placementMapCache.set(roomId, placementMap);

  return placementMap;
}

/**
 * Save placement map to Firestore in batched grid cells
 */
async function savePlacementMapToFirestore(roomId: string, placementMap: GlobalPlacementMap): Promise<void> {
  logger.info(`[PlacementService] Saving placement map to Firestore for room ${roomId}`);

  const batch = db.batch();
  const baseRef = db.collection('rooms').doc(roomId).collection(PLACEMENT_COLLECTION);

  // Save metadata
  const metadataRef = baseRef.doc('metadata');
  batch.set(metadataRef, {
    worldSize: placementMap.worldSize,
    seed: placementMap.seed,
    generatedAt: placementMap.generatedAt,
    structureCount: placementMap.structures.length,
    roadCount: placementMap.roads.length,
  });

  // Batch structures into grid cells
  const structureGrids = batchIntoGridCells(placementMap.structures, placementMap.worldSize, GRID_CELL_SIZE);

  for (const [cellKey, structures] of Object.entries(structureGrids)) {
    const docRef = baseRef.doc(`structures-${cellKey}`);
    batch.set(docRef, { structures });
  }

  // Batch roads into grid cells (based on start position)
  const roadGrids = batchRoadsIntoGridCells(placementMap.roads, placementMap.worldSize, GRID_CELL_SIZE);

  for (const [cellKey, roads] of Object.entries(roadGrids)) {
    const docRef = baseRef.doc(`roads-${cellKey}`);
    batch.set(docRef, { roads });
  }

  await batch.commit();
  logger.info(
    `[PlacementService] ✅ Saved placement map with ${placementMap.structures.length} structures and ${placementMap.roads.length} roads`
  );
}

/**
 * Load structures from Firestore grid cells
 */
async function loadStructuresFromFirestore(roomId: string, worldSize: number): Promise<StructurePlacement[]> {
  const baseRef = db.collection('rooms').doc(roomId).collection(PLACEMENT_COLLECTION);
  const numCells = Math.ceil(worldSize / GRID_CELL_SIZE);

  const structures: StructurePlacement[] = [];

  // Load all structure grid docs
  const structureDocs = await baseRef
    .where('__name__', '>=', 'structures-')
    .where('__name__', '<', 'structures-~')
    .get();

  for (const doc of structureDocs.docs) {
    const data = doc.data();
    if (data.structures) {
      structures.push(...data.structures);
    }
  }

  return structures;
}

/**
 * Load roads from Firestore grid cells
 */
async function loadRoadsFromFirestore(roomId: string, worldSize: number): Promise<RoadSegment[]> {
  const baseRef = db.collection('rooms').doc(roomId).collection(PLACEMENT_COLLECTION);

  const roads: RoadSegment[] = [];

  // Load all road grid docs
  const roadDocs = await baseRef.where('__name__', '>=', 'roads-').where('__name__', '<', 'roads-~').get();

  for (const doc of roadDocs.docs) {
    const data = doc.data();
    if (data.roads) {
      roads.push(...data.roads);
    }
  }

  return roads;
}

/**
 * Batch structures into grid cells for Firestore storage
 * Returns a map of cellKey -> structures[]
 */
function batchIntoGridCells<T extends { worldX: number; worldY: number }>(
  items: T[],
  worldSize: number,
  cellSize: number
): Record<string, T[]> {
  const grids: Record<string, T[]> = {};

  for (const item of items) {
    const cellX = Math.floor(item.worldX / cellSize);
    const cellY = Math.floor(item.worldY / cellSize);
    const cellKey = `${cellX}-${cellY}`;

    if (!grids[cellKey]) {
      grids[cellKey] = [];
    }
    grids[cellKey].push(item);
  }

  return grids;
}

/**
 * Batch roads into grid cells (based on start position)
 */
function batchRoadsIntoGridCells(
  roads: RoadSegment[],
  worldSize: number,
  cellSize: number
): Record<string, RoadSegment[]> {
  const grids: Record<string, RoadSegment[]> = {};

  for (const road of roads) {
    // Assign road to grid cell based on start position
    const cellX = Math.floor(road.startX / cellSize);
    const cellY = Math.floor(road.startY / cellSize);
    const cellKey = `${cellX}-${cellY}`;

    if (!grids[cellKey]) {
      grids[cellKey] = [];
    }
    grids[cellKey].push(road);
  }

  return grids;
}

/**
 * Clear placement map cache for a room (useful for testing/debugging)
 */
export function clearPlacementMapCache(roomId: string): void {
  placementMapCache.delete(roomId);
  logger.info(`[PlacementService] Cleared cache for room ${roomId}`);
}

/**
 * Delete placement map from Firestore (useful for regeneration)
 */
export async function deletePlacementMap(roomId: string): Promise<void> {
  logger.info(`[PlacementService] Deleting placement map for room ${roomId}`);

  const baseRef = db.collection('rooms').doc(roomId).collection(PLACEMENT_COLLECTION);
  const docs = await baseRef.get();

  const batch = db.batch();
  for (const doc of docs.docs) {
    batch.delete(doc.ref);
  }

  await batch.commit();
  clearPlacementMapCache(roomId);

  logger.info(`[PlacementService] ✅ Deleted placement map for room ${roomId}`);
}
