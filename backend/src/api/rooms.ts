/**
 * Room management API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth.js';
import {
  createRoom,
  findRoomByCode,
  getRoom,
  updateRoomSettings,
  deleteRoom,
  addPlayer,
  getPlayers,
} from '@/services/firestore.js';
import { ApiError } from '@/middleware/error.js';
import type { WorldSettings } from '@/types/index.js';

const router = Router();

/**
 * Create world settings schema
 */
const worldSettingsSchema = z.object({
  theme: z.string(),
  setting: z.string(),
  tone: z.string(),
  playerCount: z.number().min(1).max(8),
  adventureLength: z.enum(['short', 'medium', 'epic']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

/**
 * Create a new room
 * @route POST /api/rooms
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const room = await createRoom(req.user!.uid);
  res.status(201).json({ success: true, data: room });
});

/**
 * Join room by code
 * @route POST /api/rooms/:code/join
 */
router.post('/:code/join', authenticate, async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const room = await findRoomByCode(code.toUpperCase());

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ success: true, data: room });
});

/**
 * Get room state
 * @route GET /api/rooms/:roomId
 */
router.get('/:roomId', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
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
});

/**
 * Update room settings
 * @route PATCH /api/rooms/:roomId/settings
 */
router.patch('/:roomId/settings', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
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
});

/**
 * Delete room
 * @route DELETE /api/rooms/:roomId
 */
router.delete('/:roomId', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.ownerId !== req.user!.uid) {
    throw new ApiError(403, 'Only room owner can delete room');
  }

  await deleteRoom(roomId);

  res.json({ success: true, data: null });
});

export default router;

