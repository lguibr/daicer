/**
 * Grid Chunk API
 * Endpoints for infinite grid chunk loading and feature management
 */

import { Router } from 'express';
import type { Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { GridFeatureSchema, type GridChunk, type GridFeature } from '@daicer/shared';
import { generateGridChunk } from '../services/world-gen/grid-chunk-generator.js';
import { getStructuresForChunk, stampStructureOnChunk } from '../services/world-gen/structure-stamper.js';
import { CHUNK_SIZE } from '@daicer/shared';
import { getRoom } from '../services/firestore/rooms.js';

const router = Router();

/**
 * GET /api/grid/chunk/:entityId/:chunkX/:chunkY/:z
 * Get a chunk (from cache or generate on-demand)
 * entityId can be roomId or assetId
 */
router.get('/chunk/:entityId/:chunkX/:chunkY/:z', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { entityId: roomId, chunkX, chunkY, z } = req.params;

    logger.info('[API:GridChunk] 📥 Chunk request received', {
      url: req.url,
      params: req.params,
      userId: req.user?.uid,
    });

    if (!roomId || !chunkX || !chunkY || !z) {
      logger.error('[API:GridChunk] ❌ Missing parameters', { roomId, chunkX, chunkY, z });
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const chunkXNum = parseInt(chunkX, 10);
    const chunkYNum = parseInt(chunkY, 10);
    const zNum = parseInt(z, 10);

    logger.info('[API:GridChunk] 🔍 Fetching chunk', {
      roomId,
      chunkX: chunkXNum,
      chunkY: chunkYNum,
      z: zNum,
      userId: req.user?.uid,
    });

    // Validate z-layer range
    if (zNum < -6 || zNum > 5) {
      return res.status(400).json({
        error: 'Invalid z-layer',
        message: 'Z-layer must be between -6 and 5',
      });
    }

    const db = getFirestore();
    const chunkId = `${chunkXNum}_${chunkYNum}_${zNum}`;

    // Get room data first (cached) to check for structures
    const roomData = await getRoom(roomId);
    if (!roomData) {
      logger.error('[API:GridChunk] ❌ Room not found!', { roomId });
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if this chunk SHOULD have structures
    let shouldHaveStructure = false;
    if (roomData.structures && Array.isArray(roomData.structures) && roomData.structures.length > 0) {
      const structures = getStructuresForChunk(
        roomData.structures,
        chunkXNum * CHUNK_SIZE,
        chunkYNum * CHUNK_SIZE,
        CHUNK_SIZE,
        roomData.settings?.seed || roomId // Use room seed for consistency
      );
      shouldHaveStructure = structures.length > 0;
    }

    // Try to load from Firestore cache
    let chunkDoc = await db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId).get();

    // If not found in rooms, try assets collection (read-only fallback)
    if (!chunkDoc.exists) {
      const assetChunkDoc = await db.collection('assets').doc(roomId).collection('grid_chunks').doc(chunkId).get();
      if (assetChunkDoc.exists) {
        chunkDoc = assetChunkDoc;
      }
    }

    if (chunkDoc.exists) {
      const data = chunkDoc.data() as GridChunk;

      // SMART CACHE INVALIDATION:
      // If the chunk SHOULD have a structure but the cached version doesn't have the flag,
      // or if we suspect it's stale, we regenerate.
      // We only trust the cache if:
      // 1. It doesn't need a structure
      // 2. OR it needs a structure AND has the hasStructure flag

      const isStale = shouldHaveStructure && !data.hasStructure;

      if (!isStale) {
        logger.info('[API:GridChunk] ✅ Chunk found in cache (valid)', { chunkId });
        return res.json({ success: true, data });
      }

      logger.info('[API:GridChunk] 🔄 Chunk found but STALE (missing structure), regenerating...', { chunkId });
    } else {
      logger.info('[API:GridChunk] 🎲 Chunk not in cache, generating on-demand...', { chunkId });
    }

    // Get seed (already fetched roomData)
    let seed = roomData.settings?.seed || roomData.code || roomId;
    if (!seed || seed.length === 0) seed = roomId;

    logger.info('[API:GridChunk] ✅ Room found, seed:', { seed: seed.substring(0, 20) });

    // Generate chunk
    logger.info('[API:GridChunk] 🎨 Calling generateGridChunk...', {
      chunkXNum,
      chunkYNum,
      zNum,
      seed: seed.substring(0, 20),
    });

    let chunk;
    try {
      chunk = generateGridChunk(chunkXNum, chunkYNum, zNum, {
        seed,
        waterLevel: -0.1,
        mountainousness: 1.0,
        caveFrequency: 0.5,
      });
      logger.info('[API:GridChunk] ✅ generateGridChunk returned successfully!', {
        hasTiles: !!chunk.tiles,
        tileCount: chunk.tiles?.length,
      });
    } catch (genError) {
      logger.error('[API:GridChunk] ❌ Generation failed!', { error: genError });
      throw genError;
    }

    // Apply structures if any
    if (roomData.structures && Array.isArray(roomData.structures) && roomData.structures.length > 0) {
      const structures = getStructuresForChunk(
        roomData.structures,
        chunkXNum * CHUNK_SIZE,
        chunkYNum * CHUNK_SIZE,
        CHUNK_SIZE,
        seed
      );

      if (structures.length > 0) {
        logger.info(`[API:GridChunk] 🏗️ Found ${structures.length} structures overlapping chunk`, {
          chunkX: chunkXNum,
          chunkY: chunkYNum,
          structures: structures.map((s) => s.name),
        });

        for (const structure of structures) {
          chunk.tiles = stampStructureOnChunk(
            chunk.tiles,
            structure,
            chunkXNum * CHUNK_SIZE,
            chunkYNum * CHUNK_SIZE,
            CHUNK_SIZE
          );
        }

        // Update hasStructure flag
        chunk.hasStructure = true;
      }
    }

    logger.info('[API:GridChunk] 🎨 Chunk generated, saving to Firestore...', {
      chunkId,
      tiles: chunk.tiles.length,
      features: chunk.features.length,
      biomes: chunk.biomes,
      sampleTiles: chunk.tiles.slice(0, 3).map((t) => ({ x: t.x, y: t.y, type: t.blockType, biome: t.biome })),
    });

    // Save to Firestore
    logger.info('[API:GridChunk] 💾 Saving to Firestore...', { chunkId });
    try {
      await db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId).set(chunk);
      logger.info('[API:GridChunk] ✅ Firestore save complete!', { chunkId });
    } catch (saveError) {
      logger.error('[API:GridChunk] ❌ Firestore save failed!', { error: saveError });
      throw saveError;
    }

    logger.info('[API:GridChunk] 📤 Returning chunk to client...', {
      chunkId,
      path: `rooms/${roomId}/grid_chunks/${chunkId}`,
      dataSize: JSON.stringify(chunk).length,
      tiles: chunk.tiles.length,
      features: chunk.features.length,
    });

    res.json({ success: true, data: chunk });
    logger.info('[API:GridChunk] ✅ Response sent successfully!', { chunkId });
  } catch (error) {
    logger.error('[API:GridChunk] ❌❌❌ ERROR IN HANDLER!', {
      error,
      roomId: req.params.entityId,
      chunkId: `${req.params.chunkX}_${req.params.chunkY}_${req.params.z}`,
    });
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

    const db = getFirestore();
    const chunks: GridChunk[] = [];

    // Fetch all requested chunks
    for (const pos of chunkPositions) {
      const chunkId = `${pos.chunkX}_${pos.chunkY}_${pos.z}`;
      const chunkDoc = await db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId).get();

      if (chunkDoc.exists) {
        chunks.push(chunkDoc.data() as GridChunk);
      }
    }

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
