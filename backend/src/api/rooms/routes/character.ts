/**
 * Character creation routes
 * Handles: unlock character creation
 */

import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import { getRoom } from '@/services/firestore';
import { ApiError } from '@/middleware/error';
import { roomIdParamSchema } from '../validators';
import { createRoomManagementGraph } from '@/graph/room';
import { logger } from '@/utils/logger';
import { RoomManager } from '../room-manager';
import { GamePhase } from '@/types/index';

const router = Router();

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
 *       403:
 *         description: Only room owner can unlock
 *       404:
 *         description: Room not found
 */
router.post(
  '/:roomId/unlock-characters',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId } = roomIdParamSchema.parse(req.params);

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user?.uid) {
      throw new ApiError(403, 'Only room owner can unlock character creation');
    }

    // Create and invoke room management graph
    logger.info('[Room Management Graph] Creating graph instance', { roomId });
    const graph = createRoomManagementGraph();

    const input = {
      roomId,
      characterCreationLocked: true, // Current state
      phase: room.phase,
      updatedAt: room.updatedAt,
    };

    const startTime = Date.now();
    await graph.invoke(input);
    const duration = Date.now() - startTime;

    logger.info('[Room Management Graph] Execution complete', { roomId, duration: `${duration}ms` });

    // Get updated room from Firestore
    const updatedRoom = await getRoom(roomId);

    // Broadcast game state to all players
    await RoomManager.broadcastGameState(roomId);

    // Broadcast phase change
    await RoomManager.broadcastPhaseChange(roomId, GamePhase.CHARACTER_CREATION);

    logger.info('[Rooms] Character creation unlocked via graph', { roomId, ownerId: req.user?.uid });

    res.json({ success: true, data: updatedRoom });
  })
);

export default router;
