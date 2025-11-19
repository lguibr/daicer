import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/async-handler';
import { ApiError } from '@/middleware/error';
import { getRoom, getPlayers, getPlayer, updatePlayerCharacter } from '@/services/firestore';
import { db } from '@/config/firebase';
import { characterSheetSchema, characterSheetUpdateSchema } from '@/schemas/character';
import type { CharacterSheet } from '@/types/index';
import { mergeCharacterSheet } from '@/utils/character';

const router = Router();

const updateSchema = characterSheetUpdateSchema.refine(
  (data) => Object.keys(data).length > 0,
  'At least one character field must be provided'
);

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
    res.json({ success: true, data: players });
  })
);

router.get(
  '/:roomId/:playerId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId, playerId } = req.params;

    if (!roomId || !playerId) {
      throw new ApiError(400, 'Room ID and player ID are required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    const player = await getPlayer(roomId, playerId);
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    res.json({ success: true, data: player });
  })
);

router.put(
  '/:roomId/:playerId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId, playerId } = req.params;

    if (!roomId || !playerId) {
      throw new ApiError(400, 'Room ID and player ID are required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    const player = await getPlayer(roomId, playerId);
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    let updates: Partial<CharacterSheet>;
    try {
      updates = updateSchema.parse(req.body) as Partial<CharacterSheet>;
    } catch (error) {
      throw new ApiError(400, 'Invalid character data', { cause: error });
    }

    const mergedCharacter = mergeCharacterSheet(player.character, updates);

    const updatedPlayer = await updatePlayerCharacter(roomId, playerId, mergedCharacter);
    res.json({ success: true, data: updatedPlayer });
  })
);

router.post(
  '/:roomId/:playerId/import',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId, playerId } = req.params;

    if (!roomId || !playerId) {
      throw new ApiError(400, 'Room ID and player ID are required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    const player = await getPlayer(roomId, playerId);
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    let sheet: CharacterSheet;
    try {
      sheet = characterSheetSchema.parse(req.body);
    } catch (error) {
      throw new ApiError(400, 'Invalid character data', { cause: error });
    }

    const updatedPlayer = await updatePlayerCharacter(roomId, playerId, sheet);

    res.json({ success: true, data: updatedPlayer });
  })
);

/**
 * GET /api/characters/user/:userId
 * Get all characters created by a specific user across all rooms
 */
router.get(
  '/user/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    // Ensure user can only get their own characters
    if (req.user?.uid !== userId) {
      throw new ApiError(403, 'Forbidden: Can only access your own characters');
    }

    // Query all rooms and get players where userId matches
    const roomsSnapshot = await db().collection('rooms').get();
    const characters: Array<{
      id: string;
      roomId: string;
      character: CharacterSheet;
      createdAt: number;
    }> = [];

    for (const roomDoc of roomsSnapshot.docs) {
      const roomId = roomDoc.id;
      const playersSnapshot = await db()
        .collection('rooms')
        .doc(roomId)
        .collection('players')
        .where('userId', '==', userId)
        .get();

      for (const playerDoc of playersSnapshot.docs) {
        const player = playerDoc.data();
        if (player.character) {
          characters.push({
            id: playerDoc.id,
            roomId,
            character: player.character as CharacterSheet,
            createdAt: player.createdAt || Date.now(),
          });
        }
      }
    }

    // Sort by most recent
    characters.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, data: characters });
  })
);

/**
 * DELETE /api/characters/:roomId/:playerId
 * Delete a character (player can only delete their own)
 */
router.delete(
  '/:roomId/:playerId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { roomId, playerId } = req.params;

    if (!roomId || !playerId) {
      throw new ApiError(400, 'Room ID and player ID are required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    const player = await getPlayer(roomId, playerId);
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    // Ensure user can only delete their own character
    if (player.userId !== req.user?.uid) {
      throw new ApiError(403, 'Forbidden: Can only delete your own character');
    }

    // Delete the player document
    await db().collection('rooms').doc(roomId).collection('players').doc(playerId).delete();

    res.json({ success: true, message: 'Character deleted successfully' });
  })
);

export default router;
