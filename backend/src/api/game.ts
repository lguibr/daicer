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
  addCreature,
  updatePlayerAction,
} from '@/services/firestore';
import { saveWorldData, getMapContext } from '@/services/firestore/worlds';
import { getStructures } from '@/services/firestore/structures';
import { processTurn } from '@/services/game';
import { generateCharacter } from '@/services/character-generator';
import { ApiError } from '@/middleware/error';
import { NEW_CHARACTER_TEMPLATE } from '@/constants';
import { GamePhase, type Player, type Message, type CharacterSheet } from '@/types/index';
// import { type CharacterEquipment } from '@daicer/shared/types/character'; // types/index likely exports it
import { getIO } from '@/socket/instance';
import { mergeCharacterSheet } from '@/utils/character';
import { storeCharacterAvatarPreviews } from '@/services/character-assets';
import { logger } from '@/utils/logger';
import { getSystemMessage } from '@/i18n/messages';
import { v4 as uuidv4 } from 'uuid';

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
  width: z.number().int().positive(),
  height: z.number().int().positive(),
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
  sheet: z.record(z.string(), z.unknown()).optional(),
  avatarPreview: avatarPreviewSchema.optional(),
});

/**
 * @openapi
 * /api/game/{roomId}/world:
 *   post:
 *     summary: Generate world description
 *     description: Generates the initial world setting and narrative seed for a room (owner only)
 *     tags:
 *       - Game
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
 *         description: World generated successfully
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
 *       403:
 *         description: Only room owner can generate world
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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

  // Check if streaming is available (sockets connected)
  const io = getIO();
  const hasConnections = io ? (await io.in(roomId).fetchSockets()).length > 0 : false;

  const initialState = {
    roomId,
    ownerId: room.ownerId,
    code: room.code,
    settings: room.settings,
    players: [],
    messages: [],
    worldDescription: '',
    createdAt: room.createdAt,
    updatedAt: Date.now(),
    historyPeriods: [],
    streamEvents: [],
  };

  let result;

  if (hasConnections) {
    // Use streaming when sockets available (user in room)
    logger.info(`World generation with streaming for room ${roomId}`);

    // TODO: Replace with new section graph APIs
    // Old monolithic graph removed - use section graphs instead:
    // 1. POST /api/graph/dm-story (Section 1)
    // 2. POST /api/graph/world-config (Section 2)
    // 3. POST /api/graph/character/:playerId (Section 3)
    throw new ApiError(501, 'Old world generation endpoint deprecated. Use section graph APIs.');
  } else {
    // Fallback to non-streaming for room creation wizard (no connections yet)
    logger.info(`World generation without streaming for room ${roomId} (no connections)`);

    const { invokeSessionInitializationGraph } = await import('@/graph');

    try {
      result = (await invokeSessionInitializationGraph(initialState as any)) as any;
    } catch (error) {
      logger.error('Session initialization graph failed', error);
      throw new ApiError(500, 'Failed to initialize session', { cause: error });
    }
  }

  // Extract generated data and save to Firestore
  const updatedRoom = await updateRoomWorld(
    roomId,
    {
      worldDescription: result.worldDescription,
      worldHistory: result.worldHistory,
      structures: result.structures,
      roads: result.roads,
      worldConditions: result.worldConditions,
    },
    GamePhase.CHARACTER_CREATION
  );

  // Fetch actual structures from the room's subcollection
  // The graph returns a structure list, but sometimes it might be empty if not strictly passed through
  // Fetching from persistence ensures we get what was materialized
  const savedStructures = await getStructures(roomId);

  // Cache world data for AssetsMaps viewing
  await saveWorldData(roomId, {
    name: room.settings?.theme || 'Generated World',
    roomId,
    worldDescription: result.worldDescription,
    worldHistory: result.worldHistory,
    structures: savedStructures.length > 0 ? savedStructures : result.structures || [],
    roads: result.roads || [],
    terrain: {
      width: 512,
      height: 512,
    },
    settings: room.settings,
    createdAt: Date.now(),
    createdBy: req.user!.uid,
  });

  res.json({ success: true, data: updatedRoom });
});

/**
 * @openapi
 * /api/game/rooms/{roomId}/generate-world:
 *   get:
 *     summary: Generate world with streaming progress
 *     description: Triggers world generation with Server-Sent Events for real-time progress updates
 *     tags:
 *       - Game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique room ID
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, es, pt-BR]
 *         description: Optional language for generation
 *     responses:
 *       200:
 *         description: Streaming world generation progress
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only room owner can generate world
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * Helper: Calculate progress from node name
 */

router.get('/rooms/:roomId/generate-world', authenticate, async (req: AuthRequest, res: Response) => {
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

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', progress: 0, step: 'Initializing...' })}\n\n`);

  try {
    const initialState = {
      roomId,
      ownerId: room.ownerId,
      code: room.code,
      settings: room.settings,
      players: [],
      messages: [],
      worldDescription: '',
      createdAt: room.createdAt,
      updatedAt: Date.now(),
      historyPeriods: [],
      streamEvents: [],
    };

    // Import graph with streaming
    const { invokeSessionInitializationGraphWithStreaming } = await import('@/graph');

    // Create SSE writer function
    const sseWriter = (event: any) => {
      try {
        // Forward all graph stream events directly to frontend
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Note: Removed legacy duplicate event handling
        // All events are now forwarded as-is from the graph
      } catch (writeError) {
        logger.error('Error writing SSE event:', writeError);
      }
    };

    // Invoke graph with streaming
    const result = (await invokeSessionInitializationGraphWithStreaming(initialState as any, sseWriter)) as any;

    // Extract generated data and save to Firestore
    res.write(`data: ${JSON.stringify({ type: 'progress', progress: 95, step: 'Saving world data...' })}\n\n`);

    const updatedRoom = await updateRoomWorld(
      roomId,
      {
        worldDescription: result.worldDescription,
        worldHistory: result.worldHistory,
        structures: result.structures,
        roads: result.roads,
        worldConditions: result.worldConditions,
      },
      GamePhase.CHARACTER_CREATION
    );

    // Fetch actual structures from persistence
    const savedStructures = await getStructures(roomId);

    // Cache world data
    await saveWorldData(roomId, {
      name: room.settings?.theme || 'Generated World',
      roomId,
      worldDescription: result.worldDescription,
      worldHistory: result.worldHistory,
      structures: savedStructures.length > 0 ? savedStructures : result.structures || [],
      roads: result.roads || [],
      terrain: {
        width: 512,
        height: 512,
      },
      settings: room.settings,
      createdAt: Date.now(),
      createdBy: req.user!.uid,
    });

    res.write(`data: ${JSON.stringify({ type: 'progress', progress: 100, step: 'Complete!' })}\n\n`);

    // Send final completion event
    res.write(`data: ${JSON.stringify({ type: 'done', room: updatedRoom })}\n\n`);
    res.end();
  } catch (error) {
    logger.error(`Streaming world generation failed for room ${roomId}:`, error);
    res.write(
      `data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Generation failed' })}\n\n`
    );
    res.end();
  }
});

/**
 * @openapi
 * /api/game/{roomId}/character:
 *   post:
 *     summary: Add character to room
 *     description: Submit a D&D 5e character sheet and join the game
 *     tags:
 *       - Game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - race
 *               - characterClass
 *               - alignment
 *               - attributes
 *               - armorClass
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thorin Ironforge
 *               race:
 *                 type: string
 *                 example: Dwarf
 *               characterClass:
 *                 type: string
 *                 example: Fighter
 *               alignment:
 *                 type: string
 *                 example: Lawful Good
 *               background:
 *                 type: string
 *                 example: Soldier
 *               attributes:
 *                 type: object
 *                 properties:
 *                   Strength:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 30
 *                   Dexterity:
 *                     type: number
 *                   Constitution:
 *                     type: number
 *                   Intelligence:
 *                     type: number
 *                   Wisdom:
 *                     type: number
 *                   Charisma:
 *                     type: number
 *               armorClass:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Character added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Player'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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

  // Allow character creation in both SETUP and CHARACTER_CREATION phases
  if (room.phase !== GamePhase.SETUP && room.phase !== GamePhase.CHARACTER_CREATION) {
    throw new ApiError(400, 'Character creation is only allowed during setup or character creation phase');
  }

  const { sheet, avatarPreview, ...coreData } = characterSchema.parse(req.body);

  const sheetOverrides = (sheet ?? {}) as Partial<CharacterSheet>;

  const overrides: Partial<CharacterSheet> = {
    ...sheetOverrides,
    ...coreData,
  };

  overrides.attributes = {
    ...NEW_CHARACTER_TEMPLATE.attributes,
    ...coreData.attributes,
    ...(sheetOverrides.attributes ?? {}),
  };

  if (sheetOverrides.savingThrows || coreData.attributes) {
    overrides.savingThrows = {
      ...NEW_CHARACTER_TEMPLATE.savingThrows,
      ...(sheetOverrides.savingThrows ?? {}),
    };
  }

  const character = mergeCharacterSheet(NEW_CHARACTER_TEMPLATE, overrides);

  // Equipment stat bonuses are now applied by the character creation graph
  // via the equipmentManagementNode after character openings are generated

  if (avatarPreview) {
    (character as any).avatarAssets = await storeCharacterAvatarPreviews(character, avatarPreview);
  }

  const player: Player = {
    id: req.user!.uid,
    userId: req.user!.uid,
    name: character.name,
    character,
    action: null,
    isReady: false,
    joinedAt: Date.now(),
    position: { x: 0, y: 0, z: 0 },
  };

  await addPlayer(roomId, player);

  // Broadcast to all players in room
  const io = getIO();
  io.to(roomId).emit('player:created', { player });

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
  const { streamId } = req.body;

  // 1. Immediate update to GAMEPLAY phase to unblock UI
  await updateRoomWorld(roomId, { worldDescription: room.worldDescription }, GamePhase.GAMEPLAY);

  // 2. Send immediate system message
  const startMsg: Message = {
    id: `msg-${Date.now()}-system`,
    sender: 'System',
    text: 'The adventure begins! The story is being written...',
    timestamp: Date.now(),
  };
  await addMessage(roomId, startMsg);

  // 3. Return success immediately
  res.json({ success: true, data: [startMsg] });

  // 4. Trigger background generation
  // We don't await this, so the response returns immediately
  (async () => {
    try {
      // Import the granular generation functions
      const { generateCharacterOpening, generateStoryDraft, extractNPCsFromDraft, generateFinalOpening } = await import(
        '@/services/game'
      );

      // A. Generate Story Draft
      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-draft`,
        sender: 'System',
        text: 'Drafting the opening scene...',
        timestamp: Date.now(),
      });

      // Get actual map context (structures, terrain)
      let mapContext = await getMapContext(roomId);

      if (mapContext === 'No map data available.') {
        // Fallback: Create default world data if missing
        const { saveWorldData } = await import('@/services/firestore/worlds');
        await saveWorldData(roomId, {
          name: room.settings?.theme || 'Generated World',
          roomId,
          worldDescription: room.worldDescription || 'A mysterious world.',

          worldHistory: { overallSummary: 'History not generated yet.', periods: [] },
          structures: await getStructures(roomId),
          roads: [],
          terrain: {
            width: 512,
            height: 512,
          },
          settings: room.settings || undefined,
          createdAt: Date.now(),
          createdBy: room.ownerId,
        });
        mapContext = await getMapContext(roomId);
      }

      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-map-context`,
        sender: 'System',
        text: `**Map Context Used:**\n\n${mapContext}`,
        timestamp: Date.now(),
      });

      const draft = await generateStoryDraft(room.worldDescription, players, mapContext, language, streamId);

      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-draft-result`,
        sender: 'System',
        text: `**Draft Generated:**\n\n${draft}`,
        timestamp: Date.now(),
      });

      // B. Extract and Create NPCs
      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-npc`,
        sender: 'System',
        text: 'Summoning NPCs...',
        timestamp: Date.now(),
      });

      const npcs = await extractNPCsFromDraft(draft, language, streamId);

      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-npc-result`,
        sender: 'System',
        text: `**NPCs Summoned:**\n${npcs.map((n) => `- ${n.name}`).join('\n')}`,
        timestamp: Date.now(),
      });
      const createdCreatures: import('@/types/index').Creature[] = [];

      for (const npc of npcs) {
        const creatureId = uuidv4();

        let sheet;
        try {
          // Try to generate based on extracted details
          sheet = await generateCharacter({
            name: npc.name,
            raceId: npc.race,
            classId: npc.class,
            level: 3, // Default to level 3 for interesting NPCs
          });
        } catch (error) {
          logger.warn(`Failed to generate specific sheet for ${npc.name}, falling back to random`, error);
          // Fallback to random
          sheet = await generateCharacter({ name: npc.name, level: 3 });
        }

        const creature: import('@/types/index').Creature = {
          id: creatureId,
          name: npc.name,
          hp: sheet.hp,
          maxHp: sheet.maxHp,
          ac: sheet.armorClass,
          position: { x: 0, y: 0, z: 0 },
          type: 'npc',
          sheet,
        };
        await addCreature(roomId, creature);
        createdCreatures.push(creature);
      }

      // Broadcast new creatures
      const io = getIO();
      if (io) {
        io.to(roomId).emit('game:state', {
          room,
          players,
          messages: await getMessages(roomId),
          creatures: await getCreatures(roomId),
        });
      }

      // C. Generate Final Opening
      await addMessage(roomId, {
        id: `msg-${Date.now()}-sys-final`,
        sender: 'System',
        text: 'Finalizing the story...',
        timestamp: Date.now(),
      });

      const mainMessage = await generateFinalOpening(draft, npcs, language, streamId);

      const publicMsg: Message = {
        id: `msg-${Date.now()}-dm-public`,
        sender: 'DM',
        text: mainMessage,
        timestamp: Date.now() + 100,
      };
      await addMessage(roomId, publicMsg);

      // D. Generate and send private messages in parallel
      await Promise.all(
        players.map(async (player) => {
          try {
            const opening = await generateCharacterOpening(
              room.worldDescription,
              player.character || ({} as any),
              mainMessage,
              language,
              streamId
            );

            const msg: Message = {
              id: `msg-${Date.now()}-${player.id}`,
              sender: 'DM',
              text: opening,
              timestamp: Date.now() + 200,
              targetPlayer: player.id,
            };
            await addMessage(roomId, msg);
          } catch (charErr) {
            logger.error(`Failed to generate opening for player ${player.id}:`, charErr);
          }
        })
      );
    } catch (err) {
      logger.error(`Background story generation failed for room ${roomId}:`, err);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'System',
        text: 'The storyteller is having trouble... but the adventure must go on!',
        timestamp: Date.now(),
      };
      await addMessage(roomId, errorMsg);
    }
  })();
});

/**
 * Process game turn
 * @route POST /api/game/:roomId/turn
 */

/**
 * Submit player action
 * @route POST /api/game/:roomId/action
 */
router.post('/:roomId/action', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const { action } = req.body;

  if (!roomId) {
    throw new ApiError(400, 'Room ID is required');
  }

  if (!action || typeof action !== 'string') {
    throw new ApiError(400, 'Action is required');
  }

  const room = await getRoom(roomId);
  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  if (room.phase !== GamePhase.GAMEPLAY) {
    throw new ApiError(400, 'Game is not in gameplay phase');
  }

  // Update player action
  await updatePlayerAction(roomId, req.user!.uid, action);

  // Check if all players have acted
  const players = await getPlayers(roomId);
  const allReady = players.every((p) => p.action || p.id === req.user!.uid); // Check current user explicitly in case DB update is slow/async

  if (allReady) {
    // Trigger turn resolution in background
    (async () => {
      try {
        await resolveTurn(roomId, room);
      } catch (err) {
        logger.error(`Turn resolution failed for room ${roomId}:`, err);
      }
    })();
  }

  res.json({ success: true, allReady });
});

/**
 * Add a creature manually (NPC or Monster)
 * @route POST /api/game/:roomId/creatures
 */
router.post('/:roomId/creatures', authenticate, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const { type, name, race, class: className, level, monsterId, cr } = req.body;

  if (!roomId) throw new ApiError(400, 'Room ID is required');

  const room = await getRoom(roomId);
  if (!room) throw new ApiError(404, 'Room not found');
  if (room.ownerId !== req.user!.uid) throw new ApiError(403, 'Only GM can add creatures');

  let sheet: CharacterSheet;
  let creatureType: 'npc' | 'monster' = 'npc';

  const { generateMonster } = await import('@/services/character-generator');

  if (type === 'monster') {
    creatureType = 'monster';
    const monster = await generateMonster({
      monsterId,
      name,
      cr,
      type: race, // optional mapping
    });

    if (!monster) {
      throw new ApiError(404, 'Monster not found');
    }

    // Convert monster to sheet-like structure or specialized sheet
    // For now, we wrap it in a pseudo-sheet or use a union type in the future
    // But since the system expects CharacterSheet, we'll generate a minimal valid one
    // or if the creature system supports raw monster data, use that.

    // NOTE: The system currently expects `sheet: CharacterSheet` property on Creature.
    // We will generate a shell sheet based on the monster stats.

    sheet = {
      name: monster.name,
      race: monster.type,
      characterClass: 'Monster',
      background: 'Monster',
      alignment: monster.alignment,
      level: parseFloat(monster.challenge) || 1, // approximate
      xp: 0,
      hp: parseInt(monster.hitPoints) || 10,
      maxHp: parseInt(monster.hitPoints) || 10,
      temporaryHp: 0,
      hitDice: { total: 1, current: 1 },
      deathSaves: { successes: 0, failures: 0 },
      armorClass: monster.armorClass,
      initiative: Math.floor((monster.abilityScores.DEX - 10) / 2),
      speed: 30, // parsing "30 ft" would be better
      proficiencyBonus: 2,
      inspiration: false,
      attributes: {
        Strength: monster.abilityScores.STR,
        Dexterity: monster.abilityScores.DEX,
        Constitution: monster.abilityScores.CON,
        Intelligence: monster.abilityScores.INT,
        Wisdom: monster.abilityScores.WIS,
        Charisma: monster.abilityScores.CHA,
      },
      savingThrows: { fortitude: 0, reflex: 0, will: 0 },
      skills: {},
      skillDetails: [],
      expertises: [],
      baseAttackBonus: 0,
      attacks: monster.actions.map((a) => ({ name: a.name, bonus: '+0', damageType: 'physical' })),
      equipment: null as any /* Legacy override */,
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      proficienciesAndLanguages: monster.languages.join(', '),
      features: monster.specialAbilities?.map((a) => `${a.name}: ${a.description}`).join('\n') || '',
      talents: [],
      appearance: {
        age: 'Unknown',
        weight: 'Unknown',
        height: monster.size,
        eyes: 'Unknown',
        skin: 'Unknown',
        hair: 'Unknown',
        description: 'A fearsome monster.',
      },
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      backstory: '',
      backgroundDetails: { origin: '', upbringing: '', motivation: '', keyEvents: [] },
      alliesAndOrganizations: '',
      treasure: '',
      resourcePools: [],
      advancementPoints: { ability: 0, skill: 0, talent: 0 },
      spellcasting: {
        class: '',
        ability: '',
        saveDC: 10,
        attackBonus: 0,
        cantrips: [],
        spellsKnown: [],
        slots: [],
      },
    };
  } else {
    // Generate NPC
    sheet = await generateCharacter({
      name,
      raceId: race,
      classId: className,
      level: level || 1,
    });
  }

  const creatureId = uuidv4();
  const creature: import('@/types/index').Creature = {
    id: creatureId,
    name: sheet.name,
    hp: sheet.hp,
    maxHp: sheet.maxHp,
    ac: sheet.armorClass,
    position: { x: 0, y: 0, z: 0 },
    type: creatureType,
    sheet,
  };

  await addCreature(roomId, creature);

  // Broadcast
  const io = getIO();
  if (io) {
    io.to(roomId).emit('creature:added' as any, { creature });
  }

  res.status(201).json({ success: true, data: creature });
});

/**
 * Helper: Resolve turn (process actions and generate narrative)
 */
async function resolveTurn(roomId: string, room: any) {
  const players = await getPlayers(roomId);
  const messages = await getMessages(roomId);
  const creatures = await getCreatures(roomId);
  // 1. Convert pending actions to messages
  for (const player of players) {
    if (player.action) {
      const msg: Message = {
        id: `msg-${Date.now()}-${player.id}`,
        sender: player.character?.name || 'Unknown',
        text: player.action,
        timestamp: Date.now(),
      };
      await addMessage(roomId, msg);
    }
  }

  // 2. Generate DM response
  const language = room.settings?.language || 'en';
  const streamId = uuidv4();

  // Fetch map context for the DM
  const mapContext = await getMapContext(roomId);

  const dmResponse = await processTurn(
    room.worldDescription,
    messages,
    players,
    creatures,
    language,
    room.settings || undefined,
    undefined, // worldConditions
    mapContext,
    streamId
  );

  // 3. Send Public Summary
  const dmMessage: Message = {
    id: `msg-${Date.now()}-dm`,
    sender: 'DM',
    text: dmResponse.overall_summary,
    timestamp: Date.now(),
    metadata: dmResponse.metadata,
  };
  await addMessage(roomId, dmMessage);

  // 4. Send Private Visions
  for (const perspective of dmResponse.player_perspectives) {
    // Match by character name (as returned by LLM)
    const player = players.find((p) => p.character?.name === perspective.playerName);
    if (player) {
      const privateMsg: Message = {
        id: `msg-${Date.now()}-${player.id}-private`,
        sender: 'DM',
        text: perspective.perspective,
        timestamp: Date.now() + 50, // Slight delay to ensure order
        targetPlayer: player.id,
      };
      await addMessage(roomId, privateMsg);
    }
  }

  // 5. Clear player actions
  for (const player of players) {
    await updatePlayerAction(roomId, player.id, null);
  }
}

/**
 * Process game turn (Manual Trigger)
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

  // Trigger resolution
  await resolveTurn(roomId, room);

  res.json({ success: true });
});

export default router;
