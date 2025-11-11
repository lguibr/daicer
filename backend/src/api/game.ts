/**
 * Game logic API endpoints
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import {
  getRoom,
  updateRoomWorld,
  getPlayers,
  addPlayer,
  addMessage,
  getMessages,
  getCreatures,
  updatePlayerAction,
} from '@/services/firestore';
import { generateWorld, generateCharacterOpenings, processTurn } from '@/services/game';
import { ApiError } from '@/middleware/error';
import { NEW_CHARACTER_TEMPLATE } from '@/constants';
import { GamePhase, type Player, type Message, type CharacterSheet } from '@/types/index';
import { io } from '@/server';
import { characterSheetSchema } from '@/schemas/character';
import { mergeCharacterSheet } from '@/utils/character';
import { storeCharacterAvatarPreviews } from '@/services/character-assets';

const router = Router();

/**
 * Character creation schema
 */
const baseAttributesSchema = z.object({
  Strength: z.number().min(1).max(30),
  Dexterity: z.number().min(1).max(30),
  Constitution: z.number().min(1).max(30),
  Intelligence: z.number().min(1).max(30),
  Wisdom: z.number().min(1).max(30),
  Charisma: z.number().min(1).max(30),
});

const avatarPreviewImageSchema = z.object({
  mimeType: z.string().min(1),
  data: z.string().min(1),
  prompt: z.string().min(1),
});

const avatarPreviewSchema = z.object({
  portrait: avatarPreviewImageSchema,
  upperBody: avatarPreviewImageSchema,
  fullBody: avatarPreviewImageSchema,
});

const characterSchema = z.object({
  name: z.string().min(1),
  race: z.string().min(1),
  characterClass: z.string().min(1),
  alignment: z.string().min(1),
  background: z.string().optional(),
  attributes: baseAttributesSchema,
  armorClass: z.number().min(1),
  sheet: characterSheetSchema.partial({ deep: true }).optional(),
  avatarPreview: avatarPreviewSchema.optional(),
});

/**
 * Generate world description
 * @route POST /api/game/:roomId/world
 */
router.post('/:roomId/world', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

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

  // Use language from room settings, NOT request body
  const language = room.settings.language || 'en';
  const worldDescription = await generateWorld(room.settings, language);
  const updatedRoom = await updateRoomWorld(roomId, worldDescription, GamePhase.CHARACTER_CREATION);

  res.json({ success: true, data: updatedRoom });
});

/**
 * Add character to room
 * @route POST /api/game/:roomId/character
 */
router.post('/:roomId/character', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.phase !== GamePhase.CHARACTER_CREATION) {
    throw new ApiError(400, 'Not in character creation phase');
  }

  const { sheet, avatarPreview, ...coreData } = characterSchema.parse(req.body);

  const overrides: Partial<CharacterSheet> = {
    ...sheet,
    ...coreData,
  };

  overrides.attributes = {
    ...NEW_CHARACTER_TEMPLATE.attributes,
    ...coreData.attributes,
    ...(sheet?.attributes ?? {}),
  };

  if (sheet?.savingThrows || coreData.attributes) {
    overrides.savingThrows = {
      ...NEW_CHARACTER_TEMPLATE.savingThrows,
      ...(sheet?.savingThrows ?? {}),
    };
  }

  const character = mergeCharacterSheet(NEW_CHARACTER_TEMPLATE, overrides);

  if (avatarPreview) {
    character.avatarAssets = await storeCharacterAvatarPreviews(character, avatarPreview);
  }

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
  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

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

  // Use language from room settings, NOT request body
  const language = room.settings?.language || 'en';
  const openings = await generateCharacterOpenings(room.worldDescription, players, language);

  const messages: Message[] = [];

  for (const { playerId, message: opening } of openings.openings) {
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

  await updateRoomWorld(roomId, room.worldDescription, GamePhase.GAMEPLAY);

  res.json({ success: true, data: messages });
});

/**
 * Process game turn
 * @route POST /api/game/:roomId/turn
 */
router.post('/:roomId/turn', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

  const room = await getRoom(roomId);

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.phase !== GamePhase.GAMEPLAY) {
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

  // Generate DM response using language and DM style from room settings
  const language = room.settings?.language || 'en';
  const dmResponse = await processTurn(
    room.worldDescription,
    messages,
    players,
    creatures,
    language,
    room.settings || undefined
  );

  const dmMessage: Message = {
    id: `msg-${Date.now()}-dm`,
    sender: 'DM',
    text: dmResponse.overall_summary,
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
