/**
 * Game logic API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth.js';
import {
  getRoom,
  updateRoomWorld,
  getPlayers,
  addPlayer,
  addMessage,
  getMessages,
  getCreatures,
  updatePlayerAction,
} from '@/services/firestore.js';
import { generateWorld, generateCharacterOpenings, processTurn } from '@/services/game.js';
import { ApiError } from '@/middleware/error.js';
import { NEW_CHARACTER_TEMPLATE } from '@/constants.js';
import type { Player, Message, CharacterSheet } from '@/types/index.js';
import { io } from '@/server.js';

const router = Router();

/**
 * Character creation schema
 */
const characterSchema = z.object({
  name: z.string().min(1),
  race: z.string().min(1),
  characterClass: z.string().min(1),
  alignment: z.string().min(1),
  attributes: z.object({
    Strength: z.number().min(1).max(30),
    Dexterity: z.number().min(1).max(30),
    Constitution: z.number().min(1).max(30),
    Intelligence: z.number().min(1).max(30),
    Wisdom: z.number().min(1).max(30),
    Charisma: z.number().min(1).max(30),
  }),
  armorClass: z.number().min(1),
});

/**
 * Generate world description
 * @route POST /api/game/:roomId/world
 */
router.post('/:roomId/world', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.ownerId !== req.user!.uid) {
    throw new ApiError(403, 'Only room owner can generate world');
  }

  if (!room.settings) {
    throw new ApiError(400, 'Room settings not configured');
  }

  const worldDescription = await generateWorld(room.settings, req.body.language || 'en');
  const updatedRoom = await updateRoomWorld(roomId, worldDescription, 'CHARACTER_CREATION');

  res.json({ success: true, data: updatedRoom });
});

/**
 * Add character to room
 * @route POST /api/game/:roomId/character
 */
router.post('/:roomId/character', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.phase !== 'CHARACTER_CREATION') {
    throw new ApiError(400, 'Not in character creation phase');
  }

  const charData = characterSchema.parse(req.body);
  const character: CharacterSheet = {
    ...NEW_CHARACTER_TEMPLATE,
    ...charData,
  };

  const player: Player = {
    id: req.user!.uid,
    userId: req.user!.uid,
    name: character.name,
    character,
    action: null,
    isReady: false,
    joinedAt: Date.now(),
  };

  await addPlayer(roomId, player);

  // Broadcast to all players in room
  io.to(roomId).emit('player:created', player);

  res.status(201).json({ success: true, data: player });
});

/**
 * Start adventure (generate personalized openings)
 * @route POST /api/game/:roomId/start
 */
router.post('/:roomId/start', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.ownerId !== req.user!.uid) {
    throw new ApiError(403, 'Only room owner can start game');
  }

  const players = await getPlayers(roomId);

  if (players.length === 0) {
    throw new ApiError(400, 'No players in room');
  }

  const openings = await generateCharacterOpenings(room.worldDescription, players, req.body.language || 'en');

  const messages: Message[] = [];

  for (const { playerId, message: opening } of openings) {
    const msg: Message = {
      id: `msg-${Date.now()}-${playerId}`,
      sender: 'DM',
      text: opening,
      timestamp: Date.now(),
      targetPlayer: playerId,
    };

    await addMessage(roomId, msg);
    messages.push(msg);
  }

  await updateRoomWorld(roomId, room.worldDescription, 'GAMEPLAY');

  res.json({ success: true, data: messages });
});

/**
 * Process game turn
 * @route POST /api/game/:roomId/turn
 */
router.post('/:roomId/turn', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.phase !== 'GAMEPLAY') {
    throw new ApiError(400, 'Game not started');
  }

  const players = await getPlayers(roomId);
  const messages = await getMessages(roomId);
  const creatures = await getCreatures(roomId);

  // Add player action messages
  for (const player of players) {
    if (player.action) {
      const msg: Message = {
        id: `msg-${Date.now()}-${player.id}`,
        sender: player.character.name,
        text: player.action,
        timestamp: Date.now(),
      };
      await addMessage(roomId, msg);
    }
  }

  // Generate DM response
  const dmResponse = await processTurn(room.worldDescription, messages, players, creatures, req.body.language || 'en');

  const dmMessage: Message = {
    id: `msg-${Date.now()}-dm`,
    sender: 'DM',
    text: dmResponse,
    timestamp: Date.now(),
  };

  await addMessage(roomId, dmMessage);

  // Clear player actions
  for (const player of players) {
    await updatePlayerAction(roomId, player.id, '');
  }

  res.json({ success: true, data: dmMessage });
});

export default router;

