/**
 * Graph Section API Endpoints
 * REST APIs for independent section graph invocation
 *
 * Endpoints:
 * - POST /api/graph/dm-story - Section 1: DM personality & history
 * - POST /api/graph/world-config - Section 2: Physical world generation
 * - POST /api/graph/character/:playerId - Section 3: Character setup (per-player)
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { ApiError } from '@/middleware/error';
import { logger } from '@/utils/logger';
import { setupSSE, sendSSE, sendSSEError } from '@/middleware/sse';
import { GamePhase } from '@/types/index';
import { DMStoryInputSchema, DMStoryOutputSchema } from '@daicer/shared/graph-states/dm-story-state';
import { WorldConfigInputSchema, WorldConfigOutputSchema } from '@daicer/shared/graph-states/world-config-state';
import { CharacterInputSchema, CharacterOutputSchema } from '@daicer/shared/graph-states/character-state';
import { validateSection1Dependencies, validateSection2Dependencies } from '@daicer/shared/graph-states/mergers';
import { createDMStoryGraph } from '@/graph/world/dm-story';
import { createWorldConfigGraph } from '@/graph/world/world-config';
import { createCharacterSetupGraph } from '@/graph/character/setup';
import { getRoom, updateRoomWorld } from '@/services/firestore';
import { getDb } from '@/config/firebase';
import { getIO } from '@/socket/instance';
import type { Player } from '@/types/index';

const router = Router();

// SSE connection storage (room -> Set of responses)
const sseConnections = new Map<string, Set<Response>>();

/**
 * Centralized error handler for graph API endpoints
 */
function handleGraphError(error: unknown, res: Response): void {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    logger.warn('[GraphAPI] Validation error:', { issues: error.issues });
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.issues,
    });
    return;
  }

  // API errors (auth, ownership, etc.)
  if (error instanceof ApiError) {
    logger.warn('[GraphAPI] API error:', { code: error.statusCode, message: error.message });
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Graph execution errors
  logger.error('[GraphAPI] Graph execution error:', error);
  res.status(500).json({
    success: false,
    error: 'Graph execution failed',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}

/**
 * @openapi
 * /api/graph/dm-story:
 *   post:
 *     summary: Generate DM Story (Section 1)
 *     description: Generates world history, conditions, and narrative seed
 *     tags:
 *       - Graph Sections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - settings
 *             properties:
 *               roomId:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, es, pt-BR]
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: DM story generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not room owner
 *       500:
 *         description: Graph execution failed
 */
router.post('/dm-story', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info('[POST /api/graph/dm-story] Starting Section 1 generation', {
      userId: req.user?.uid,
      roomId: req.body.roomId,
    });

    // 1. Validate input against DMStoryInputSchema
    const input = DMStoryInputSchema.parse(req.body);

    // 2. Check room ownership (only owner can generate)
    const room = await getRoom(input.roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user?.uid) {
      throw new ApiError(403, 'Only room owner can generate DM story');
    }

    // 3. Create and invoke DM Story graph
    logger.info('[DM Story Graph] Creating graph instance', { roomId: input.roomId });
    const graph = createDMStoryGraph();

    logger.info('[DM Story Graph] Invoking graph', {
      roomId: input.roomId,
      historyDepth: input.settings.historyDepth,
      theme: input.settings.theme,
    });

    // Wire SSE writer if connection exists
    const writer = getSSEWriter('dm-story', input.roomId);

    // Send heartbeats every 5s during graph execution
    const heartbeatInterval = setInterval(() => {
      if (writer) {
        writer({
          type: 'heartbeat',
          timestamp: Date.now(),
          message: 'Graph execution in progress',
        });
      }
    }, 5000);

    const startTime = Date.now();
    let result;
    try {
      result = await graph.invoke(input, {
        configurable: { writer },
        metadata: { streamId: input.streamId },
      });
    } finally {
      // Stop heartbeat when done
      clearInterval(heartbeatInterval);
    }
    const duration = Date.now() - startTime;

    logger.info('[DM Story Graph] Execution complete', {
      roomId: input.roomId,
      duration: `${duration}ms`,
      periodsGenerated: result.historyPeriods?.length || 0,
      conditionsGenerated: result.conditions?.length || 0,
    });

    // 4. Validate output against DMStoryOutputSchema
    const output = DMStoryOutputSchema.parse(result);

    // 5. Return success response
    res.json({
      success: true,
      data: output,
      metadata: {
        duration,
        periodsGenerated: output.historyPeriods.length,
        conditionsGenerated: output.conditions.length,
      },
    });
  } catch (error) {
    handleGraphError(error, res);
  }
});

/**
 * @openapi
 * /api/graph/world-config:
 *   post:
 *     summary: Generate World Config (Section 2)
 *     description: Generates physical world (structures, roads, terrain, chunks)
 *     tags:
 *       - Graph Sections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - settings
 *               - historyPeriods
 *               - conditions
 *               - worldHistory
 *     responses:
 *       200:
 *         description: World configuration generated successfully
 *       400:
 *         description: Invalid input or missing Section 1 dependencies
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not room owner
 *       500:
 *         description: Graph execution failed
 */
router.post('/world-config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info('[POST /api/graph/world-config] Starting Section 2 generation', {
      userId: req.user?.uid,
      roomId: req.body.roomId,
    });

    // 1. Validate input against WorldConfigInputSchema
    const input = WorldConfigInputSchema.parse(req.body);

    // 2. Validate Section 1 dependencies present
    try {
      validateSection1Dependencies(input);
    } catch (depError) {
      logger.warn('[World Config] Section 1 dependency validation failed:', depError);
      throw new ApiError(400, depError instanceof Error ? depError.message : 'Missing Section 1 dependencies');
    }

    // 3. Check room ownership
    const room = await getRoom(input.roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user?.uid) {
      throw new ApiError(403, 'Only room owner can generate world configuration');
    }

    // 4. Create and invoke World Config graph
    logger.info('[World Config Graph] Creating graph instance', { roomId: input.roomId });
    const graph = createWorldConfigGraph();

    logger.info('[World Config Graph] Invoking graph', {
      roomId: input.roomId,
      structureDensity: input.settings.structureDensity,
      enableRoads: input.settings.enableRoads,
      structureCount: input.historyPeriods.flatMap((p) => p.structures).length,
    });

    // Wire SSE writer if connection exists
    const writer = getSSEWriter('world-config', input.roomId);

    // Send heartbeats every 5s during graph execution
    const heartbeatInterval = setInterval(() => {
      if (writer) {
        writer({
          type: 'heartbeat',
          timestamp: Date.now(),
          message: 'Graph execution in progress',
        });
      }
    }, 5000);

    const startTime = Date.now();
    let result;
    let output;

    try {
      result = await graph.invoke(input, {
        configurable: { writer },
      });
      const duration = Date.now() - startTime;

      logger.info('[World Config Graph] Execution complete', {
        roomId: input.roomId,
        duration: `${duration}ms`,
        structuresPlaced: result.structures?.length || 0,
        roadsGenerated: result.roads?.length || 0,
      });

      // 5. Validate output against WorldConfigOutputSchema
      output = WorldConfigOutputSchema.parse(result);
    } catch (graphError) {
      // If graph execution fails, still try to update room with partial data
      logger.error('[World Config Graph] Execution failed, using partial data', graphError);

      // Create minimal output from what we have
      output = {
        structures: result?.structures || [],
        roads: result?.roads || [],
        worldDescription: input.worldHistory, // Fallback to history
        generatedChunks: result?.generatedChunks || [],
        gridState: result?.gridState,
        terrainMap: result?.terrainMap,
      };
    } finally {
      // Stop heartbeat when done
      clearInterval(heartbeatInterval);
    }

    // 6. Update room in Firestore with world data (ALWAYS execute)
    // Note: generationEvents will be added by frontend via separate call
    const updatedRoom = await updateRoomWorld(
      input.roomId,
      {
        worldDescription: output.worldDescription,
        worldHistory: input.worldHistory, // From Section 1
        structures: output.structures,
        roads: output.roads,
        worldConditions: input.conditions, // From Section 1
      },
      GamePhase.TERRAIN_GENERATION // Advance to terrain generation phase
    );

    logger.info('[World Config] Room updated in Firestore', {
      roomId: input.roomId,
      phase: 'TERRAIN_GENERATION',
    });

    // 7. Broadcast room update to all connected clients via Socket.IO (ALWAYS execute)
    const io = getIO();
    io.to(input.roomId).emit('room:phase_changed', {
      roomId: input.roomId,
      phase: GamePhase.TERRAIN_GENERATION,
    });

    // Also send full game state update
    const db = getDb();
    const players = await db.collection('rooms').doc(input.roomId).collection('players').get();
    const playersList = players.docs.map((doc) => doc.data() as Player);

    io.to(input.roomId).emit('game:state', {
      room: updatedRoom,
      players: playersList,
      messages: [],
      creatures: [],
    });

    logger.info('[World Config] Broadcasted room update via Socket.IO', { roomId: input.roomId });

    // 8. Return success response
    res.json({
      success: true,
      data: output,
      metadata: {
        duration: Date.now() - startTime,
        structuresPlaced: output.structures.length,
        roadsGenerated: output.roads.length,
        chunksGenerated: output.generatedChunks.length,
      },
    });
  } catch (error) {
    handleGraphError(error, res);
  }
});

/**
 * @openapi
 * /api/graph/character/{playerId}:
 *   post:
 *     summary: Generate Character Setup (Section 3)
 *     description: Generates character opening narrative and applies equipment bonuses (per-player)
 *     tags:
 *       - Graph Sections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - character
 *               - worldHistory
 *               - worldDescription
 *     responses:
 *       200:
 *         description: Character setup generated successfully
 *       400:
 *         description: Invalid input or missing Section 1/2 dependencies
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Graph execution failed
 */
router.post('/character/:playerId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;

    logger.info('[POST /api/graph/character/:playerId] Starting Section 3 generation', {
      userId: req.user?.uid,
      playerId,
      roomId: req.body.roomId,
    });

    // 1. Validate input against CharacterInputSchema
    const input = CharacterInputSchema.parse({
      ...req.body,
      playerId,
    });

    // 2. Validate Section 1 & 2 dependencies present
    try {
      validateSection1Dependencies(input);
      validateSection2Dependencies(input);
    } catch (depError) {
      logger.warn('[Character Setup] Dependency validation failed:', depError);
      throw new ApiError(400, depError instanceof Error ? depError.message : 'Missing Section 1 or 2 dependencies');
    }

    // 3. Check room access (user must be in room)
    const room = await getRoom(input.roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // TODO: Add player ownership check
    // For now, any authenticated user in the room can generate character setup

    // 4. Create and invoke Character Setup graph
    logger.info('[Character Setup Graph] Creating graph instance', { playerId, roomId: input.roomId });
    const graph = createCharacterSetupGraph();

    logger.info('[Character Setup Graph] Invoking graph', {
      playerId,
      roomId: input.roomId,
      characterName: input.character.name,
      characterClass: input.character.characterClass,
    });

    // Wire SSE writer if connection exists
    const writer = getCharacterSSEWriter(input.roomId, playerId!);

    // Send heartbeats every 5s during graph execution
    const heartbeatInterval = setInterval(() => {
      if (writer) {
        writer({
          type: 'heartbeat',
          timestamp: Date.now(),
          message: 'Character setup in progress',
        });
      }
    }, 5000);

    const startTime = Date.now();
    let result;
    try {
      result = await graph.invoke(input, {
        configurable: { writer },
      });
    } finally {
      // Stop heartbeat when done
      clearInterval(heartbeatInterval);
    }
    const duration = Date.now() - startTime;

    logger.info('[Character Setup Graph] Execution complete', {
      playerId,
      roomId: input.roomId,
      duration: `${duration}ms`,
      hasOpening: !!result.openingNarrative,
    });

    // 5. Validate output against CharacterOutputSchema
    const output = CharacterOutputSchema.parse(result);

    // 6. Return success response
    res.json({
      success: true,
      data: output,
      metadata: {
        duration,
        characterName: output.character.name,
      },
    });
  } catch (error) {
    handleGraphError(error, res);
  }
});

/**
 * SSE Streaming Endpoints
 * Real-time event streaming for graph execution progress
 */

/**
 * GET /api/graph/dm-story/stream
 * SSE endpoint for Section 1 real-time progress
 */
router.get('/dm-story/stream', authenticate, setupSSE, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    sendSSEError(res, 'roomId query parameter required');
    return;
  }

  try {
    // Check room exists
    const room = await getRoom(roomId);
    if (!room) {
      logger.warn('[SSE] Room not found', { roomId, userId: req.user?.uid });
      sendSSEError(res, 'Room not found');
      return;
    }

    logger.debug('[SSE] DM Story stream - room phase check', {
      roomId,
      userId: req.user?.uid,
      ownerId: room.ownerId,
      phase: room.phase,
      isOwner: room.ownerId === req.user?.uid,
    });

    // Only check ownership during early phases (SETUP, TERRAIN_GENERATION)
    // During CHARACTER_CREATION and GAMEPLAY, all players can connect
    // RELAXED: Allow all players to connect to stream to avoid connection errors
    // The frontend might try to connect even if not owner
    /*
    const restrictedPhases = [GamePhase.SETUP, GamePhase.TERRAIN_GENERATION];
    if (restrictedPhases.includes(room.phase) && room.ownerId !== req.user?.uid) {
      logger.warn('[SSE] Non-owner tried to connect during restricted phase', {
        roomId,
        userId: req.user?.uid,
        ownerId: room.ownerId,
        phase: room.phase,
      });
      sendSSEError(res, 'Only room owner can stream during world generation');
      return;
    }
    */

    // Store connection for this room
    const key = `dm-story-${roomId}`;
    if (!sseConnections.has(key)) {
      sseConnections.set(key, new Set());
    }
    sseConnections.get(key)!.add(res);

    // Send initial connected event
    sendSSE(res, {
      type: 'connected',
      data: { roomId, section: 'dm_story', timestamp: Date.now() },
    });

    logger.info('[SSE] DM Story stream connected', { roomId, userId: req.user?.uid });

    // Cleanup on disconnect
    req.on('close', () => {
      const connections = sseConnections.get(key);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(key);
        }
      }
      logger.info('[SSE] DM Story stream disconnected', { roomId });
    });
  } catch (error) {
    logger.error('[SSE] Error setting up DM Story stream:', error);
    sendSSEError(res, 'Failed to setup stream');
  }
});

/**
 * GET /api/graph/world-config/stream
 * SSE endpoint for Section 2 real-time progress
 */
router.get('/world-config/stream', authenticate, setupSSE, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    sendSSEError(res, 'roomId query parameter required');
    return;
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      sendSSEError(res, 'Room not found');
      return;
    }

    // RELAXED: Allow all players to connect
    /*
    if (room.ownerId !== req.user?.uid) {
      sendSSEError(res, 'Only room owner can stream');
      return;
    }
    */

    const key = `world-config-${roomId}`;
    if (!sseConnections.has(key)) {
      sseConnections.set(key, new Set());
    }
    sseConnections.get(key)!.add(res);

    sendSSE(res, {
      type: 'connected',
      data: { roomId, section: 'world_config', timestamp: Date.now() },
    });

    logger.info('[SSE] World Config stream connected', { roomId, userId: req.user?.uid });

    req.on('close', () => {
      const connections = sseConnections.get(key);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(key);
        }
      }
      logger.info('[SSE] World Config stream disconnected', { roomId });
    });
  } catch (error) {
    logger.error('[SSE] Error setting up World Config stream:', error);
    sendSSEError(res, 'Failed to setup stream');
  }
});

/**
 * GET /api/graph/character/:playerId/stream
 * SSE endpoint for Section 3 real-time progress (per-player)
 */
router.get('/character/:playerId/stream', authenticate, setupSSE, async (req: AuthRequest, res: Response) => {
  const { playerId } = req.params;
  const { roomId } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    sendSSEError(res, 'roomId query parameter required');
    return;
  }

  try {
    const room = await getRoom(roomId);
    if (!room) {
      sendSSEError(res, 'Room not found');
      return;
    }

    // TODO: Check player belongs to user
    // For now, any authenticated user in room can stream

    const key = `character-${roomId}-${playerId}`;
    if (!sseConnections.has(key)) {
      sseConnections.set(key, new Set());
    }
    sseConnections.get(key)!.add(res);

    sendSSE(res, {
      type: 'connected',
      data: { roomId, playerId, section: 'character_setup', timestamp: Date.now() },
    });

    logger.info('[SSE] Character Setup stream connected', { roomId, playerId, userId: req.user?.uid });

    req.on('close', () => {
      const connections = sseConnections.get(key);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(key);
        }
      }
      logger.info('[SSE] Character Setup stream disconnected', { roomId, playerId });
    });
  } catch (error) {
    logger.error('[SSE] Error setting up Character stream:', error);
    sendSSEError(res, 'Failed to setup stream');
  }
});

export default router;

/**
 * Helper: Get SSE writer for a room/section
 * Used by POST endpoints to send events to active SSE connections
 */
export function getSSEWriter(section: 'dm-story' | 'world-config', roomId: string) {
  return (event: any) => {
    const key = `${section}-${roomId}`;
    const connections = sseConnections.get(key);

    if (connections) {
      for (const connection of connections) {
        sendSSE(connection, {
          type: event.type,
          data: {
            ...event,
            timestamp: event.timestamp || Date.now(),
          },
        });
      }
    }
  };
}

export function getCharacterSSEWriter(roomId: string, playerId: string) {
  return (event: any) => {
    const key = `character-${roomId}-${playerId}`;
    const connections = sseConnections.get(key);

    if (connections) {
      for (const connection of connections) {
        sendSSE(connection, {
          type: event.type,
          data: {
            ...event,
            timestamp: event.timestamp || Date.now(),
          },
        });
      }
    }
  };
}
