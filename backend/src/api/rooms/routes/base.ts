/**
 * Base room CRUD routes
 * Handles: create, list, get, update, delete
 */

import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import {
    createRoom,
    getRoom,
    updateRoomSettings,
    deleteRoom,
    getRoomMembershipsForUser,
} from '@/services/firestore';
import { ApiError } from '@/middleware/error';
import { worldSettingsSchema, roomIdParamSchema } from '../validators';
import type { WorldSettings } from '@/types/index';
import { getDb } from '@/config/firebase';

const router = Router();

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     description: Creates a new multiplayer room with the authenticated user as owner
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
 *                 description: Optional world settings
 *     responses:
 *       201:
 *         description: Room created successfully
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
 */
router.get(
    '/',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberships = await getRoomMembershipsForUser(req.user!.uid);
        res.json({ success: true, data: memberships });
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
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
 */
router.get(
    '/:roomId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { roomId } = roomIdParamSchema.parse(req.params);

        const room = await getRoom(roomId);
        if (!room) {
            throw new ApiError(404, 'Room not found');
        }

        const db = getDb();
        const playersSnapshot = await db.collection('rooms').doc(roomId).collection('players').get();
        const players = playersSnapshot.docs.map((doc) => doc.data());

        res.json({
            success: true,
            data: { room, players },
        });
    })
);

/**
 * Update room settings (owner only)
 * @route PATCH /api/rooms/:roomId/settings
 */
router.patch(
    '/:roomId/settings',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { roomId } = roomIdParamSchema.parse(req.params);

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
 * Update room data (owner only)
 * @route PATCH /api/rooms/:roomId
 */
router.patch(
    '/:roomId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { roomId } = roomIdParamSchema.parse(req.params);

        const room = await getRoom(roomId);
        if (!room) {
            throw new ApiError(404, 'Room not found');
        }

        if (room.ownerId !== req.user?.uid) {
            throw new ApiError(403, 'Only room owner can update room');
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
        res.json({ success: true, data: updatedRoom });
    })
);

/**
 * Delete room (owner only)
 * @route DELETE /api/rooms/:roomId
 */
router.delete(
    '/:roomId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { roomId } = roomIdParamSchema.parse(req.params);

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

export default router;
