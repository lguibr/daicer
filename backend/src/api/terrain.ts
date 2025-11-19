/**
 * Terrain Generation API
 * Endpoints for generating and approving 3D voxel terrain
 */

import { Router } from 'express';
import type { Response } from 'express';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { ApiError } from '@/middleware/error';
import { logger } from '@/utils/logger';
import { getRoom } from '@/services/firestore';
import { getDb } from '@/config/firebase';
import { getIO } from '@/socket/instance';
import { createTerrainGenerationGraph } from '@/graph/terrain';
import { GamePhase, type Player } from '@/types/index';
import { generateTerrainChunk } from '@/services/world-gen/chunk-generator';

const router = Router();

// Track active terrain generations to prevent race conditions
const activeGenerations = new Map<string, Promise<any>>();

// Chunk bounds constant
const CHUNK_BOUNDS = 8192;

/**
 * POST /api/terrain/generate
 * Generate 3D voxel terrain for a room
 */
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      throw new ApiError(400, 'roomId required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user?.uid) {
      throw new ApiError(403, 'Only room owner can generate terrain');
    }

    // Prevent race conditions: check if generation already in progress
    if (activeGenerations.has(roomId)) {
      logger.warn('[Terrain Generation] Generation already in progress', { roomId });
      throw new ApiError(409, 'Terrain generation already in progress for this room');
    }

    logger.info('[Terrain Generation] Creating graph instance', { roomId });
    const graph = createTerrainGenerationGraph();

    // Determine grid size from room settings (minimum 256x256 for fast testing)
    const worldSize = room.settings?.worldSize || 'small';
    const gridSizes: Record<string, number> = {
      intimate: 256,
      small: 256,
      medium: 512,
      large: 1024,
      vast: 2048,
      epic: 4096,
    };

    const gridSize = gridSizes[worldSize] || 256;

    const input = {
      roomId,
      structures: room.structures || [],
      roads: room.roads || [],
      worldHistory: room.worldHistory || '',
      settings: {
        gridWidth: gridSize,
        gridHeight: gridSize,
        gridDepth: 3, // Only 3 levels: -1 (underground), 0 (surface), 1 (sky/2nd floor)
        roomSize: 32,
      },
    };

    const startTime = Date.now();

    // Wrap generation in promise and track it
    const generationPromise = graph.invoke(input);
    activeGenerations.set(roomId, generationPromise);

    let result;
    try {
      result = await generationPromise;
    } finally {
      // Always clean up tracking, even if generation fails
      activeGenerations.delete(roomId);
    }

    const duration = Date.now() - startTime;

    logger.info('[Terrain Generation] Complete', { roomId, duration: `${duration}ms` });

    // Update room with terrain data (biomeMap + voxelGrid as ONE thing)
    // NOTE: Firestore can't handle nested arrays, so we omit the grid data
    // Frontend will regenerate from room structures on demand
    const db = getDb();
    await db
      .collection('rooms')
      .doc(roomId)
      .update({
        terrainData: {
          biomeMapMetadata: {
            width: result.biomeMap.width,
            height: result.biomeMap.height,
            seed: result.biomeMap.seed,
            // grid omitted - too large for Firestore
          },
          voxelGrid: {
            width: result.voxelGrid.width,
            height: result.voxelGrid.height,
            depth: result.voxelGrid.depth,
            roomSize: result.voxelGrid.roomSize,
            roomsWide: result.voxelGrid.roomsWide,
            roomsHigh: result.voxelGrid.roomsHigh,
            occupiedRooms: result.voxelGrid.occupiedRooms,
            // layers omitted - generated on-demand
          },
          generatedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });

    logger.info('[Terrain] Saved terrain data to Firestore', { roomId });

    // Broadcast update
    const updatedRoom = await getRoom(roomId);
    const io = getIO();
    const playersSnapshot = await db.collection('rooms').doc(roomId).collection('players').get();
    const playersList = playersSnapshot.docs.map((doc) => doc.data() as Player);

    io.to(roomId).emit('game:state', {
      room: updatedRoom,
      players: playersList,
      messages: [],
      creatures: [],
    });

    res.json({
      success: true,
      data: {
        biomeMap: result.biomeMap,
        voxelGrid: result.voxelGrid,
      },
      metadata: {
        duration,
        gridSize: `${gridSize}x${gridSize}x3`,
      },
    });
  } catch (error) {
    logger.error('[Terrain Generation] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Terrain generation failed',
    });
  }
});

/**
 * POST /api/terrain/approve
 * Owner approves terrain and advances to CHARACTER_CREATION phase
 */
router.post('/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      throw new ApiError(400, 'roomId required');
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    if (room.ownerId !== req.user?.uid) {
      throw new ApiError(403, 'Only room owner can approve terrain');
    }

    // Update room phase to CHARACTER_CREATION
    const db = getDb();
    const now = Date.now();
    await db.collection('rooms').doc(roomId).update({
      phase: GamePhase.CHARACTER_CREATION,
      characterCreationLocked: false,
      updatedAt: now,
    });

    // Build updated room directly (avoid stale read)
    const updatedRoom = {
      ...room,
      phase: GamePhase.CHARACTER_CREATION,
      characterCreationLocked: false,
      updatedAt: now,
    };

    // Get players and initialize isReady if missing
    const playersSnapshot = await db.collection('rooms').doc(roomId).collection('players').get();
    const batch = db.batch();
    playersSnapshot.docs.forEach((doc) => {
      const player = doc.data() as Player;
      if (player.isReady === undefined) {
        batch.update(doc.ref, { isReady: false });
      }
    });
    await batch.commit();

    const playersList = playersSnapshot.docs.map((doc) => {
      const data = doc.data() as Player;
      return { ...data, isReady: data.isReady ?? false };
    });

    // Broadcast to all players
    const io = getIO();
    io.to(roomId).emit('game:state', {
      room: updatedRoom,
      players: playersList,
      messages: [],
      creatures: [],
    });

    logger.info('[Terrain] Approved and unlocked character creation', { roomId, phase: GamePhase.CHARACTER_CREATION });

    res.json({ success: true, data: updatedRoom });
  } catch (error) {
    logger.error('[Terrain] Approval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Terrain approval failed',
    });
  }
});

/**
 * POST /api/terrain/chunk
 * Generate a single 4x4 terrain chunk on-demand (infinite terrain)
 * Ultra-small chunks for maximum granularity and smooth loading
 */
router.post('/chunk', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, chunkX, chunkY, chunkSize } = req.body;

    if (!roomId || chunkX === undefined || chunkY === undefined) {
      throw new ApiError(400, 'roomId, chunkX, and chunkY required');
    }

    // Bounds validation: prevent infinite chunk generation
    if (Math.abs(chunkX) > CHUNK_BOUNDS || Math.abs(chunkY) > CHUNK_BOUNDS) {
      throw new ApiError(400, `Chunk coordinates out of bounds (max ±${CHUNK_BOUNDS})`);
    }

    const room = await getRoom(roomId);
    if (!room) {
      throw new ApiError(404, 'Room not found');
    }

    // Verify user is in this room
    const db = getDb();
    const playerDoc = await db.collection('rooms').doc(roomId).collection('players').doc(req.user!.uid).get();

    if (!playerDoc.exists) {
      throw new ApiError(403, 'Not a member of this room');
    }

    logger.info('[Terrain Chunk] Generating chunk', { roomId, chunkX, chunkY });

    const chunk = generateTerrainChunk({
      roomId,
      chunkX,
      chunkY,
      chunkSize: chunkSize || 4, // Default 4x4 ultra-small chunks
    });

    res.json({
      success: true,
      data: chunk,
    });
  } catch (error) {
    logger.error('[Terrain Chunk] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chunk generation failed',
    });
  }
});

export default router;
