/**
 * Room membership routes
 * Handles: join by code, leave room
 */

import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import {
    getRoom,
    findRoomByCode,
    getPlayer,
    removePlayer,
    markRoomInactive,
} from '@/services/firestore';
import { getPlayers } from '@/services/firestore/players';
import { ApiError } from '@/middleware/error';
import { joinCodeParamSchema, roomIdParamSchema } from '../validators';
import { emitPlayerLeft } from '@/socket/events/room-events';

const router = Router();

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
 *     responses:
 *       200:
 *         description: Successfully joined room
 */
router.post(
    '/:code/join',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { code } = joinCodeParamSchema.parse(req.params);

        const room = await findRoomByCode(code.toUpperCase());
        if (!room) {
            throw new ApiError(404, 'Room not found');
        }

        res.json({ success: true, data: room });
    })
);

/**
 * Leave room membership for current user
 * @route DELETE /api/rooms/:roomId/membership
 */
router.delete(
    '/:roomId/membership',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { roomId } = roomIdParamSchema.parse(req.params);

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
            emitPlayerLeft(roomId, player.id);
        }

        if (!isOwner) {
            const remainingPlayers = await getPlayers(roomId);
            if (remainingPlayers.length === 0) {
                await markRoomInactive(roomId);
            }
        }

        res.json({ success: true, data: null });
    })
);

export default router;
