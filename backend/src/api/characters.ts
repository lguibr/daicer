import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { ApiError } from '@/middleware/error';
import { getRoom, getPlayers, getPlayer, updatePlayerCharacter } from '@/services/firestore';
import { characterSheetSchema, characterSheetUpdateSchema } from '@/schemas/character';
import type { CharacterSheet } from '@/types/index';
import { mergeCharacterSheet } from '@/utils/character';

const router = Router();

const updateSchema = characterSheetUpdateSchema.refine(
  (data) => Object.keys(data).length > 0,
  'At least one character field must be provided'
);

router.get('/:roomId', authenticate, async (req: AuthRequest, res: Response) => {
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
});

router.get('/:roomId/:playerId', authenticate, async (req: AuthRequest, res: Response) => {
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
});

router.put('/:roomId/:playerId', authenticate, async (req: AuthRequest, res: Response) => {
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

  const updates = updateSchema.parse(req.body) as Partial<CharacterSheet>;
  const mergedCharacter = mergeCharacterSheet(player.character, updates);

  const updatedPlayer = await updatePlayerCharacter(roomId, playerId, mergedCharacter);
  res.json({ success: true, data: updatedPlayer });
});

router.post('/:roomId/:playerId/import', authenticate, async (req: AuthRequest, res: Response) => {
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

  const sheet = characterSheetSchema.parse(req.body);
  const updatedPlayer = await updatePlayerCharacter(roomId, playerId, sheet);

  res.status(201).json({ success: true, data: updatedPlayer });
});

export default router;
