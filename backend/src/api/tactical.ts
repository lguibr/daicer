/**
 * Tactical Combat API Routes
 * Routes for tactical map generation and combat editor
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { generateTacticalMap, flattenTacticalMap } from '../services/tacticalMapGenerator.js';
import {
  createEncounter,
  getEncounter,
  // updateEncounter,
  deleteEncounter,
  processAction,
  endEncounter,
} from '../services/tactical/encounters';
import { encounterSchema, actionSchema } from '@/schemas/tactical';
import { getRoom } from '@/services/firestore/rooms';
import { ApiError } from '@/middleware/error';
import { logger } from '../utils/logger.js';

const router = Router();

const generateMapSchema = z.object({
  gridSize: z.number().int().min(8).max(20),
  seed: z.number().int().optional(),
  terrainDensity: z.number().min(0).max(1).optional(),
});

/**
 * POST /api/tactical/generate-map
 * Generate a tactical combat map
 */
router.post('/generate-map', authenticate, (req: any, res: Response) => {
  // const authReq = req as AuthRequest;
  try {
    const validation = generateMapSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.issues,
      });
    }

    const { gridSize, seed, terrainDensity } = validation.data;

    const map = generateTacticalMap({
      gridSize,
      seed,
      terrainDensity,
    });

    logger.info('[Tactical] Generated map', {
      userId: req.user?.uid,
      gridSize,
      seed: map.seed,
    });

    return res.json({
      id: map.id,
      gridSize: map.gridSize,
      seed: map.seed,
      tiles: flattenTacticalMap(map),
      createdAt: map.createdAt,
    });
  } catch (error) {
    logger.error('[Tactical] Map generation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate map',
    });
  }
});

// === Encounter Management Routes ===

/**
 * POST /api/tactical/:roomId/encounter
 * Create a new tactical encounter (owner only)
 */
router.post('/:roomId/encounter', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const validation = encounterSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ApiError(400, 'Invalid structure data', validation.error.issues);
    }

    // Check if user is room owner
    const room = await getRoom(roomId || '');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.ownerId !== req.user!.uid) {
      return res.status(403).json({ success: false, error: 'Only room owner can create encounters' });
    }

    const encounter = await createEncounter(roomId || '', validation.data);

    logger.info('[Tactical] Created encounter', {
      userId: req.user?.uid,
      roomId,
      encounterId: encounter.id,
    });

    return res.status(201).json({ success: true, data: encounter });
  } catch (error) {
    logger.error('[Tactical] Create encounter error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create encounter',
    });
  }
});

/**
 * GET /api/tactical/:roomId/encounter/:encounterId
 * Get encounter details
 */
router.get('/:roomId/encounter/:encounterId', authenticate, async (req: any, res: Response) => {
  // const authReq = req as AuthRequest;
  try {
    const { roomId, encounterId } = req.params;

    const encounter = await getEncounter(roomId || '', encounterId || '');

    return res.json({ success: true, data: encounter });
  } catch (error) {
    logger.error('[Tactical] Get encounter error:', error);
    if (error instanceof Error && error.message === 'Encounter not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get encounter',
    });
  }
});

/**
 * POST /api/tactical/:roomId/encounter/:encounterId/action
 * Submit a combat action
 */
router.post('/:roomId/encounter/:encounterId/action', authenticate, async (req: any, res: Response) => {
  // const authReq = req as AuthRequest;
  try {
    const { roomId, encounterId } = req.params;
    const validation = actionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action data',
        details: validation.error.issues,
      });
    }

    const encounter = await processAction(roomId || '', encounterId || '', validation.data);

    return res.json({ success: true, data: encounter });
  } catch (error) {
    logger.error('[Tactical] Process action error:', error);
    if (error instanceof Error && (error.message === 'Encounter not found' || error.message.includes('not found'))) {
      return res
        .status(error.message === 'Encounter not found' ? 404 : 400)
        .json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process action',
    });
  }
});

/**
 * POST /api/tactical/:roomId/encounter/:encounterId/end
 * End an encounter (owner only)
 */
router.post('/:roomId/encounter/:encounterId/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, encounterId } = req.params;

    // Check if user is room owner
    const room = await getRoom(roomId || '');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.ownerId !== req.user!.uid) {
      return res.status(403).json({ success: false, error: 'Only room owner can end encounters' });
    }

    const encounter = await endEncounter(roomId || '', encounterId || '');

    logger.info('[Tactical] Ended encounter', {
      userId: req.user?.uid,
      roomId,
      encounterId,
    });

    return res.json({ success: true, data: encounter });
  } catch (error) {
    logger.error('[Tactical] End encounter error:', error);
    if (error instanceof Error && error.message === 'Encounter not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end encounter',
    });
  }
});

/**
 * DELETE /api/tactical/:roomId/encounter/:encounterId
 * Delete an encounter (owner only)
 */
router.delete('/:roomId/encounter/:encounterId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, encounterId } = req.params;

    // Check if user is room owner
    const room = await getRoom(roomId || '');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.ownerId !== req.user!.uid) {
      return res.status(403).json({ success: false, error: 'Only room owner can delete encounters' });
    }

    await deleteEncounter(roomId || '', encounterId || '');

    logger.info('[Tactical] Deleted encounter', {
      userId: req.user?.uid,
      roomId,
      encounterId,
    });

    return res.json({ success: true, data: null });
  } catch (error) {
    logger.error('[Tactical] Delete encounter error:', error);
    if (error instanceof Error && error.message === 'Encounter not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete encounter',
    });
  }
});

export default router;
