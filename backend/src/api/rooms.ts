/**
 * Room management API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import {
  createRoom,
  findRoomByCode,
  getRoom,
  updateRoomSettings,
  deleteRoom,
  getPlayers,
  getPlayer,
  removePlayer,
  getRoomMembershipsForUser,
  markRoomInactive,
} from '@/services/firestore';
import { getDb } from '@/config/firebase';
import { getIO } from '@/socket/instance';
import { ApiError } from '@/middleware/error';
import { logger } from '@/utils/logger';
import { createRoomManagementGraph } from '@/graph/room';
import type { WorldSettings, Player } from '@/types/index';

const router = Router();

/**
 * Create world settings schema
 */
const worldSettingsSchema = z.object({
  worldType: z.enum(['terra', 'water', 'desert', 'ice', 'volcanic', 'forest', 'sky', 'underground', 'custom']),
  worldSize: z.enum(['intimate', 'small', 'medium', 'large', 'vast', 'epic']),
  theme: z.string(),
  setting: z.string(),
  tone: z.string(),
  worldBackground: z.string(),
  dmStyle: z.object({
    verbosity: z.number().min(0).max(6),
    detail: z.number().min(0).max(6),
    engagement: z.number().min(0).max(6),
    narrative: z.number().min(0).max(6),
    specialMode: z.enum(['pirate', 'shakespearean', 'noir', 'courtly', 'grimdark', 'storybook']).nullable().optional(),
    customDirectives: z.string(),
  }),
  dmSystemPrompt: z.string(),
  playerCount: z.number().min(1).max(8),
  adventureLength: z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']),
  difficulty: z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']),
  startingLevel: z.number().min(1).max(20),
  attributePointBudget: z.number().min(0),
  language: z.enum(['en', 'es', 'pt-BR']),
  historyDepth: z.number().optional(),
  eraCount: z.number().optional(),
  structureDensity: z.number().optional(),
  structureTypes: z.array(z.string()).optional(),
  enableRoads: z.boolean().optional(),
  roadQuality: z.string().optional(),
  terrainComplexity: z.number().optional(),
});

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     description: Creates a new multiplayer room with the authenticated user as owner, optionally with full world settings
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *                 description: Optional world settings to initialize room with
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = req.body.settings ? worldSettingsSchema.parse(req.body.settings) : undefined;
    const room = await createRoom(req.user!.uid, settings as WorldSettings | undefined);
    res.status(201).json({ success: true, data: room });
  })
);

export const listRoomsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberships = await getRoomMembershipsForUser(req.user!.uid);
  res.json({ success: true, data: memberships });
});

/**
 * @openapi
 * /api/rooms:
 *   get:
 *     summary: List user's rooms
 *     description: Returns all rooms where the current user is owner or player
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', authenticate, listRoomsHandler);

/**
 * @openapi
 * /api/rooms/{code}/join:
 *   post:
 *     summary: Join room by code
 *     description: Join an existing room using its short code (e.g. ABC123)
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *           example: ABC123
 *         description: 6-character room code
 *     responses:
 *       200:
 *         description: Successfully joined room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/:code/join',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.params;
    if (!code) {
      throw new ApiError(400, 'Room code is required');
    }

    const room = await findRoomByCode(code.toUpperCase());

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    res.json({ success: true, data: room });
  })
);

/**
 * @openapi
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room details
 *     description: Returns room information including settings and player list
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
 *         description: Unique room ID
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     room:
 *                       $ref: '#/components/schemas/Room'
 *                     players:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Player'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:roomId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ApiError(400, 'Room ID is required');
    }

    const room = await getRoom(roomId);

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    const players = await getPlayers(roomId);

    res.json({
      success: true,
      data: {
        room,
        players,
      },
    });
  })
);

/**
 * Update room settings
 * @route PATCH /api/rooms/:roomId/settings
 */
router.patch(
  '/:roomId/settings',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ApiError(400, 'Room ID is required');
    }

    const room = await getRoom(roomId);

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user!.uid) {
      throw new ApiError(403, 'Only room owner can update settings');
    }

    const settings = worldSettingsSchema.parse(req.body) as WorldSettings;
    const updatedRoom = await updateRoomSettings(roomId, settings);

    res.json({ success: true, data: updatedRoom });
  })
);

/**
 * Delete room
 * @route DELETE /api/rooms/:roomId
 */
router.delete(
  '/:roomId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ApiError(400, 'Room ID is required');
    }

    const room = await getRoom(roomId);

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user!.uid) {
      throw new ApiError(403, 'Only room owner can delete room');
    }

    await deleteRoom(roomId);

    res.json({ success: true, data: null });
  })
);

export const leaveRoomMembershipHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  const userId = req.user!.uid;
  const player = await getPlayer(roomId, userId);
  const isOwner = room.ownerId === userId;

  if (!player && !isOwner) {
    throw new ApiError(403, 'You are not a member of this room');
  }

  if (player) {
    await removePlayer(roomId, player.id);
  }

  if (!isOwner) {
    const remainingPlayers = await getPlayers(roomId);
    if (remainingPlayers.length === 0) {
      await markRoomInactive(roomId);
    }
  }

  res.json({ success: true, data: null });
});

/**
 * Leave room membership for current user
 * @route DELETE /api/rooms/:roomId/membership
 */
router.delete('/:roomId/membership', authenticate, leaveRoomMembershipHandler);

/**
 * @openapi
 * /api/rooms/{roomId}/history:
 *   get:
 *     summary: Get world history for room
 *     description: Returns the generated historical periods for the room's world
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
 *         description: Room ID
 *     responses:
 *       200:
 *         description: World history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:roomId/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;

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
 *     summary: Get structures for room
 *     description: Returns the placed structures on the room's world map
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
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Structures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:roomId/structures',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    res.json({ success: true, data: room.structures || [] });
  })
);

/**
 * @openapi
 * /api/rooms/{roomId}:
 *   patch:
 *     summary: Update room data (owner only)
 *     description: Updates room fields like generationEvents
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               generationEvents:
 *                 type: array
 *     responses:
 *       200:
 *         description: Room updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only room owner can update
 *       404:
 *         description: Room not found
 */
router.patch('/:roomId', authenticate, async (req: AuthRequest, res) => {
  const { roomId } = req.params;

  const room = await getRoom(roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  if (room.ownerId !== req.user?.uid) {
    res.status(403).json({ success: false, error: 'Only room owner can update room' });
    return;
  }

  // Allow updating generationEvents
  const updateData: any = {};
  if (req.body.generationEvents) {
    updateData.generationEvents = req.body.generationEvents;
  }
  updateData.updatedAt = Date.now();

  const db = getDb();
  await db.collection('rooms').doc(roomId).update(updateData);

  const updatedRoom = await getRoom(roomId);

  logger.info('[Rooms] Room updated', { roomId, fields: Object.keys(updateData) });

  res.json({ success: true, data: updatedRoom });
});

/**
 * @openapi
 * /api/rooms/{roomId}/unlock-characters:
 *   post:
 *     summary: Unlock character creation (owner only)
 *     description: Allows room owner to unlock character creation after reviewing world
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
 *         description: Character creation unlocked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only room owner can unlock
 *       404:
 *         description: Room not found
 */
router.post('/:roomId/unlock-characters', authenticate, async (req: AuthRequest, res) => {
  const { roomId } = req.params;

  const room = await getRoom(roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }

  if (room.ownerId !== req.user?.uid) {
    res.status(403).json({ success: false, error: 'Only room owner can unlock character creation' });
    return;
  }

  // Create and invoke room management graph (Rule 4: All state transitions through graph)
  logger.info('[Room Management Graph] Creating graph instance', { roomId });
  const graph = createRoomManagementGraph();

  const input = {
    roomId,
    characterCreationLocked: true, // Current state
    phase: room.phase,
    updatedAt: room.updatedAt,
  };

  const startTime = Date.now();
  const result = await graph.invoke(input);
  const duration = Date.now() - startTime;

  logger.info('[Room Management Graph] Execution complete', { roomId, duration: `${duration}ms` });

  // Get updated room from Firestore
  const updatedRoom = await getRoom(roomId);

  // Broadcast update to all players
  const io = getIO();
  const db = getDb();
  const playersSnapshot = await db.collection('rooms').doc(roomId).collection('players').get();
  const playersList = playersSnapshot.docs.map((doc) => doc.data() as Player);

  io.to(roomId).emit('game:state', {
    room: updatedRoom,
    players: playersList,
    messages: [],
    creatures: [],
  });

  logger.info('[Rooms] Character creation unlocked via graph', { roomId, ownerId: req.user?.uid });

  res.json({ success: true, data: updatedRoom });
});

/**
 * @openapi
 * /api/rooms/{roomId}/world-placement:
 *   get:
 *     summary: Get or generate the global structure placement map for a room
 *     description: Returns the complete placement map (structures and roads) for the room's world. Generates on first access.
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
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Placement map retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     structures:
 *                       type: array
 *                       items:
 *                         type: object
 *                     roads:
 *                       type: array
 *                       items:
 *                         type: object
 *                     worldSize:
 *                       type: number
 *                     seed:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:roomId/world-placement',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    const room = await getRoom(roomId);

    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Get or create placement map
    const { getOrCreatePlacementMap } = await import('@/services/world-placement-service');

    // Use room's world seed, or fallback to roomId
    const worldSeed = room.seed || roomId;

    // World size: map worldSize enum to actual tile dimensions
    const worldSizeMap: Record<string, number> = {
      intimate: 64000,
      small: 128000,
      medium: 256000,
      large: 512000,
      vast: 512000,
      epic: 512000,
    };
    const worldSize = worldSizeMap[room.worldSize || 'medium'] || 256000;

    const placementMap = await getOrCreatePlacementMap(roomId, worldSeed, worldSize, {
      minDistance: 30,
      maxStructures: 50,
      generateRoads: room.enableRoads ?? true,
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
 *     summary: Get structures near a specific location
 *     description: Returns structure placements within a specified radius of world coordinates
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
 *         description: Room ID
 *       - in: query
 *         name: x
 *         required: true
 *         schema:
 *           type: number
 *         description: World X coordinate
 *       - in: query
 *         name: y
 *         required: true
 *         schema:
 *           type: number
 *         description: World Y coordinate
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           default: 96
 *         description: Search radius (default 96 tiles = 3 chunks)
 *     responses:
 *       200:
 *         description: Nearby structures retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:roomId/structures-near',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    const x = parseFloat(req.query.x as string);
    const y = parseFloat(req.query.y as string);
    const radius = parseFloat(req.query.radius as string) || 96;

    if (isNaN(x) || isNaN(y)) {
      throw new ApiError(400, 'Invalid coordinates: x and y must be numbers');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Get placement map
    const { getOrCreatePlacementMap, getStructuresNearLocation } = await import('@/services/world-placement-service');
    const { getStructuresNearLocation: getStructuresNear } = await import('@daicer/shared/world-gen/structures');

    const worldSeed = room.seed || roomId;
    const worldSizeMap: Record<string, number> = {
      intimate: 64000,
      small: 128000,
      medium: 256000,
      large: 512000,
      vast: 512000,
      epic: 512000,
    };
    const worldSize = worldSizeMap[room.worldSize || 'medium'] || 256000;

    const placementMap = await getOrCreatePlacementMap(roomId, worldSeed, worldSize, {
      minDistance: 30,
      maxStructures: 50,
      generateRoads: room.enableRoads ?? true,
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
