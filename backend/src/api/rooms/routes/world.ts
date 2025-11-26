/**
 * World and terrain query routes
 * Handles: history, structures, placement maps
 */

import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import { getRoom } from '@/services/firestore';
import { ApiError } from '@/middleware/error';
import { roomIdParamSchema, structuresNearQuerySchema } from '../validators';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @openapi
 * /api/rooms/{roomId}/history:
 *   get:
 *     summary: Get world history
 *     description: Returns generated  historical periods for the room's world
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: World history retrieved successfully
 */
router.get(
  '/:roomId/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = roomIdParamSchema.parse(req.params);

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    res.json({ success: true, data: room.worldHistory || null });
  })
);

/**
 * @openapi
 * /api/rooms/{roomId}/structures:
 *   get:
 *     summary: Get structures
 *     description: Returns placed structures on the room's world map
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Structures retrieved successfully
 */
router.get(
  '/:roomId/structures',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = roomIdParamSchema.parse(req.params);

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    res.json({ success: true, data: room.structures || [] });
  })
);

/**
 * @openapi
 * /api/rooms/{roomId}/world-placement:
 *   get:
 *     summary: Get or generate global structure placement map
 *     description: Returns complete placement map (structures and roads)
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Placement map retrieved successfully
 */
router.get(
  '/:roomId/world-placement',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = roomIdParamSchema.parse(req.params);

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Get or create placement map
    const { getOrCreatePlacementMap } = await import('@/services/world-placement-service');

    // Use room's world seed, or fallback to roomId
    const worldSeed = (room as any).seed || roomId;

    // World size mapping
    const worldSizeMap: Record<string, number> = {
      intimate: 64000,
      small: 128000,
      medium: 256000,
      large: 512000,
      vast: 512000,
      epic: 512000,
    };
    const worldSize = worldSizeMap[(room as any).worldSize || 'medium'] || 256000;

    const placementMap = await getOrCreatePlacementMap(roomId, worldSeed, worldSize, {
      minDistance: 30,
      maxStructures: 50,
      generateRoads: (room as any).enableRoads ?? true,
      roadMaterial: 'stone',
    });

    logger.info('[Rooms] Placement map retrieved', {
      roomId,
      structureCount: placementMap.structures.length,
      roadCount: placementMap.roads.length,
    });

    res.json({ success: true, data: placementMap });
  })
);

/**
 * @openapi
 * /api/rooms/{roomId}/structures-near:
 *   get:
 *     summary: Get structures near a location
 *     description: Returns structures within radius of world coordinates
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: x
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: y
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 96
 *     responses:
 *       200:
 *         description: Nearby structures retrieved
 */
router.get(
  '/:roomId/structures-near',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = roomIdParamSchema.parse(req.params);
    const { x, y, radius } = structuresNearQuerySchema.parse(req.query);

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Get placement map
    const { getOrCreatePlacementMap } = await import('@/services/world-placement-service');
    const { getStructuresNearLocation: getStructuresNear } = await import('@daicer/shared/world-gen/structures');

    const worldSeed = (room as any).seed || roomId;
    const worldSizeMap: Record<string, number> = {
      intimate: 64000,
      small: 128000,
      medium: 256000,
      large: 512000,
      vast: 512000,
      epic: 512000,
    };
    const worldSize = worldSizeMap[(room as any).worldSize || 'medium'] || 256000;

    const placementMap = await getOrCreatePlacementMap(roomId, worldSeed, worldSize, {
      minDistance: 30,
      maxStructures: 50,
      generateRoads: (room as any).enableRoads ?? true,
      roadMaterial: 'stone',
    });

    // Query structures near location
    const nearbyStructures = getStructuresNear(placementMap.structures, x, y, radius);

    logger.info('[Rooms] Nearby structures queried', {
      roomId,
      x,
      y,
      radius,
      resultCount: nearbyStructures.length,
    });

    res.json({ success: true, data: nearbyStructures });
  })
);

export default router;
