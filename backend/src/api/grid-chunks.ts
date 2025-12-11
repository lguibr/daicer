/**
 * Grid Chunk API
 * Endpoints for infinite grid chunk loading and feature management
 */

import { Router } from 'express';
import type { Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { GridFeatureSchema, type GridFeature } from '@daicer/shared/world/grid-feature-schema';
import { type GridChunk } from '@daicer/shared/world/grid-chunk-schema';
import { mapService } from '@/services/map-service';

const router = Router();

/**
 * GET /api/grid/chunk/:entityId/:chunkX/:chunkY/:z
 * Get a chunk (from cache or generate on-demand)
 * entityId can be roomId or assetId
 */
router.get('/chunk/:entityId/:chunkX/:chunkY/:z', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { entityId, chunkX, chunkY, z } = req.params;

    if (!entityId || !chunkX || !chunkY || !z) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const chunkXNum = parseInt(chunkX, 10);
    const chunkYNum = parseInt(chunkY, 10);
    const zNum = parseInt(z, 10);

    // Validate z-layer range
    if (zNum < -6 || zNum > 5) {
      return res.status(400).json({
        error: 'Invalid z-layer',
        message: 'Z-layer must be between -6 and 5',
      });
    }

    // Attempt to use MapService
    try {
      const chunk = await mapService.getChunk(entityId, chunkXNum, chunkYNum, zNum);
      return res.json({ success: true, data: chunk });
    } catch (error) {
      // Fallback or rethrow
      throw error;
    }
  } catch (error) {
    logger.error('[API:GridChunk] Error:', error);
    next(error);
    return;
  }
});

/**
 * GET /api/grid/chunks/:roomId
 * Get multiple chunks in a region (for bulk loading)
 */
router.post('/chunks/:roomId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId parameter' });
    }
    const { chunkPositions } = req.body as {
      chunkPositions: Array<{ chunkX: number; chunkY: number; z: number }>;
    };

    if (!Array.isArray(chunkPositions) || chunkPositions.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'chunkPositions array is required',
      });
    }

    if (chunkPositions.length > 100) {
      return res.status(400).json({
        error: 'Too many chunks requested',
        message: 'Maximum 100 chunks per request',
      });
    }

    logger.info('[API:GridChunk] Bulk chunk fetch', {
      roomId,
      count: chunkPositions.length,
    });

    const chunks: GridChunk[] = [];

    // Fetch all requested chunks using MapService (handles generation too)
    // Run in parallel
    const promises = chunkPositions.map((pos) =>
      mapService.getChunk(roomId, pos.chunkX, pos.chunkY, pos.z).catch((err) => {
        logger.warn(`Failed to fetch chunk ${pos.chunkX},${pos.chunkY}: ${err.message}`);
        return null;
      })
    );

    const results = await Promise.all(promises);

    // Filter out failed
    results.forEach((chunk) => {
      if (chunk) chunks.push(chunk);
    });

    return res.json({ chunks });
  } catch (error) {
    next(error);
    return;
  }
});

/**
 * POST /api/grid/feature/:roomId
 * Add a feature to a tile
 */
router.post('/feature/:roomId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId parameter' });
    }

    // Validate feature
    const parseResult = GridFeatureSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid feature data', details: parseResult.error });
    }

    const feature = parseResult.data;

    logger.info('[API:GridFeature] Adding feature', {
      roomId,
      featureId: feature.id,
      position: feature.position,
    });

    const db = getFirestore();

    // Get the chunk this feature belongs to
    const chunkX = Math.floor(feature.position.x / 8);
    const chunkY = Math.floor(feature.position.y / 8);
    const chunkId = `${chunkX}_${chunkY}_${feature.position.z}`;

    // Add feature to chunk's features array
    const chunkRef = db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId);

    await chunkRef.update({
      features: FieldValue.arrayUnion(feature),
    });

    logger.info('[API:GridFeature] Feature added', { featureId: feature.id });

    return res.status(201).json({ success: true, feature });
  } catch (error) {
    next(error);
    return;
  }
});

/**
 * GET /api/grid/features/:roomId
 * Get features in a region (for visibility queries)
 */
router.get('/features/:roomId', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId parameter' });
    }

    const { centerX, centerY, z, radius } = req.query;

    const cx = parseInt((centerX as string) || '0', 10);
    const cy = parseInt((centerY as string) || '0', 10);
    const zNum = parseInt((z as string) || '0', 10);
    const r = parseInt((radius as string) || '50', 10);

    logger.info('[API:GridFeature] Querying features in radius', {
      roomId,
      center: [cx, cy],
      radius: r,
    });

    // Calculate chunk range
    const minChunkX = Math.floor((cx - r) / 8);
    const maxChunkX = Math.ceil((cx + r) / 8);
    const minChunkY = Math.floor((cy - r) / 8);
    const maxChunkY = Math.ceil((cy + r) / 8);

    const db = getFirestore();
    const features: GridFeature[] = [];

    // Load chunks in range
    for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
      for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
        const chunkId = `${chunkX}_${chunkY}_${zNum}`;
        const chunkDoc = await db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId).get();

        if (chunkDoc.exists) {
          const chunk = chunkDoc.data() as GridChunk;
          // Filter features within radius
          const chunkFeatures = chunk.features.filter((f) => {
            const dist = Math.sqrt((f.position.x - cx) ** 2 + (f.position.y - cy) ** 2);
            return dist <= r;
          });
          features.push(...chunkFeatures);
        }
      }
    }

    logger.info('[API:GridFeature] Features found', { count: features.length });

    return res.json({ features });
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
