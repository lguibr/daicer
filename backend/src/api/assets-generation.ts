/**
 * Asset Management API endpoints
 *
 * Handles asset collections, assets, and generation
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import {
  createCollection,
  getUserCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  createAsset,
  getCollectionAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  uploadAssetFile,
  saveCollectionBaseImage,
  updateAssetStatus,
  saveGeneratedModel,
} from '@/services/assets/assetService';
import {
  generateModel,
  generateImageVariation,
  generateImageFromText,
  transformImage,
} from '@/services/generation/gemini';
import { generateWorld, getWorldMap, getUserWorlds, deleteWorldMap } from '@/services/world-gen/worldGenService';
import { generateStructureGridChunks, generateMapGridChunks } from '@/services/asset-grid-generator';
import { getWorkerPool } from '@/workers/workerPool';
import { ApiError } from '@/middleware/error';
import { logger } from '@/utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper to ensure route parameter exists
 */
function requireParam(params: Record<string, string | undefined>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${key}`);
  }
  return value;
}

// Collection schemas
const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  assetType: z.enum(['2d', '3d', 'map', 'structures', 'character-sheet']),
  mode: z.enum(['variations', 'text-to-image', 'batch-transform', 'batch-create']).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  masterDescription: z.string().optional(),
});

// Asset schemas
const createAssetSchema = z.object({
  collectionId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string(),
  generationPrompt: z.string().optional(),
});

const generateModelSchema = z.object({
  assetType: z.enum(['Creature', 'Tree', 'Terrain', 'Humanoid', 'POI', 'Object']),
  name: z.string().min(1).max(100),
  description: z.string().min(1),
});

const generateImageSchema = z.object({
  prompt: z.string().min(1),
});

const generateVariationSchema = z.object({
  masterDescription: z.string().min(1),
  variationDescription: z.string().min(1),
});

const transformImageSchema = z.object({
  transformPrompt: z.string().min(1),
});

const batchVariationsSchema = z.object({
  baseAssetId: z.string(),
  count: z.number().int().min(2).max(8),
  variationPrompt: z.string().optional(),
});

// World generation schemas
const createWorldSchema = z.object({
  name: z.string().min(1).max(100),
  seed: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  depth: z.number().int().positive().default(21), // Default to 21 levels
  waterLevel: z.number().min(-1).max(1).optional().default(-0.1),
  mountainousness: z.number().min(0).max(2).optional().default(1.0),
  jaggedness: z.number().min(0).max(2).optional().default(1.0),
  temperature: z.number().min(-1).max(1).optional().default(0),
  moisture: z.number().min(-1).max(1).optional().default(0),
  continentalness: z.number().min(-1).max(1).optional().default(0),
  erosion: z.number().min(-1).max(1).optional().default(0),
  weirdness: z.number().min(-1).max(1).optional().default(0),
  caveFrequency: z.number().min(0).max(1).optional().default(0.5),
  oreDistribution: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

/**
 * Create a new asset collection
 * @route POST /api/assets/collections
 */
router.post('/collections', authenticate, async (req: AuthRequest, res: Response) => {
  logger.info(`[Assets-API] POST /collections called by user: ${req.user?.uid}`);
  logger.info(`[Assets-API] Request body:`, req.body);

  const validation = createCollectionSchema.safeParse(req.body);
  if (!validation.success) {
    logger.error(`[Assets-API] Validation failed:`, validation.error);
    throw new ApiError(400, validation.error.message);
  }

  const { name, assetType, mode, description, color } = validation.data;
  logger.info(`[Assets-API] Creating collection: ${name} (${assetType})`);

  const collectionId = await createCollection(req.user!.uid, name, assetType, mode, description, color);

  logger.info(`[Assets-API] Collection created with ID: ${collectionId}`);
  res.status(201).json({ success: true, data: { id: collectionId } });
});

/**
 * Get all collections for current user
 * @route GET /api/assets/collections
 */
router.get('/collections', authenticate, async (req: AuthRequest, res: Response) => {
  const assetType = req.query.assetType as '2d' | '3d' | 'map' | 'structures' | 'character-sheet' | undefined;
  const collections = await getUserCollections(req.user!.uid, assetType);

  res.json({ success: true, data: collections });
});

/**
 * Get a single collection
 * @route GET /api/assets/collections/:collectionId
 */
router.get('/collections/:collectionId', authenticate, async (req: AuthRequest, res: Response) => {
  const collectionId = requireParam(req.params, 'collectionId');
  const collection = await getCollection(collectionId);

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: collection });
});

/**
 * Update a collection
 * @route PATCH /api/assets/collections/:collectionId
 */
router.patch('/collections/:collectionId', authenticate, async (req: AuthRequest, res: Response) => {
  const collectionId = requireParam(req.params, 'collectionId');
  const validation = updateCollectionSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const collection = await getCollection(collectionId);
  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  await updateCollection(collectionId, validation.data);

  res.json({ success: true });
});

/**
 * Delete a collection
 * @route DELETE /api/assets/collections/:collectionId
 */
router.delete('/collections/:collectionId', authenticate, async (req: AuthRequest, res: Response) => {
  const collectionId = requireParam(req.params, 'collectionId');
  const collection = await getCollection(collectionId);

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  // Check asset count before deletion
  const assets = await getCollectionAssets(collectionId);
  if (assets.length > 0) {
    throw new ApiError(400, `Cannot delete collection with ${assets.length} asset(s). Delete all assets first.`);
  }

  await deleteCollection(collectionId);

  res.json({ success: true });
});

/**
 * Upload base image for a collection
 * @route POST /api/assets/collections/:collectionId/base-image
 */
router.post(
  '/collections/:collectionId/base-image',
  authenticate,
  upload.single('image') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  async (req: AuthRequest, res: Response) => {
    const collectionId = requireParam(req.params, 'collectionId');

    if (!req.file) {
      throw new ApiError(400, 'Image file is required');
    }

    const collection = await getCollection(collectionId);
    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }

    if (collection.createdBy !== req.user!.uid) {
      throw new ApiError(403, 'Access denied');
    }

    const imageUrl = await saveCollectionBaseImage(collectionId, req.user!.uid, req.file.buffer);

    res.json({ success: true, data: { imageUrl } });
  }
);

/**
 * Create a new asset
 * @route POST /api/assets
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = createAssetSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const { collectionId, name, description, generationPrompt } = validation.data;

  // Verify collection ownership
  const collection = await getCollection(collectionId);
  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  const assetId = await createAsset(collectionId, name, description, collection.assetType, generationPrompt);

  res.status(201).json({ success: true, data: { id: assetId } });
});

/**
 * Create asset in a specific collection
 * @route POST /api/assets-gen/collections/:collectionId/assets
 */
router.post('/collections/:collectionId/assets', authenticate, async (req: AuthRequest, res: Response) => {
  const collectionId = requireParam(req.params, 'collectionId');

  const { name, description, generationPrompt } = req.body;

  if (!name || !description) {
    throw new ApiError(400, 'Name and description are required');
  }

  // Verify collection ownership
  const collection = await getCollection(collectionId);
  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  const assetId = await createAsset(collectionId, name, description, collection.assetType, generationPrompt);

  res.status(201).json({ success: true, data: { id: assetId } });
});

/**
 * Get all assets for a collection
 * @route GET /api/assets/collections/:collectionId/assets
 */
router.get('/collections/:collectionId/assets', authenticate, async (req: AuthRequest, res: Response) => {
  const collectionId = requireParam(req.params, 'collectionId');

  const collection = await getCollection(collectionId);
  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  if (collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  const assets = await getCollectionAssets(collectionId);

  res.json({ success: true, data: assets });
});

// ============================================================================
// World Management Routes (MUST be before /:assetId to avoid conflicts)
// ============================================================================

/**
 * Create a new procedural world
 * @route POST /api/assets-gen/worlds
 */
router.post('/worlds', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = createWorldSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const { name, ...params } = validation.data;
  const worldId = await generateWorld(req.user!.uid, name, params);

  res.status(201).json({ success: true, data: { id: worldId } });
});

/**
 * Get all worlds for current user
 * @route GET /api/assets-gen/worlds
 */
router.get('/worlds', authenticate, async (req: AuthRequest, res: Response) => {
  const worlds = await getUserWorlds(req.user!.uid);

  res.json({ success: true, data: worlds });
});

/**
 * Get a single world
 * @route GET /api/assets-gen/worlds/:worldId
 */
router.get('/worlds/:worldId', authenticate, async (req: AuthRequest, res: Response) => {
  const worldId = requireParam(req.params, 'worldId');
  const world = await getWorldMap(worldId);

  if (!world) {
    throw new ApiError(404, 'World not found');
  }

  if (world.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: world });
});

/**
 * Delete a world
 * @route DELETE /api/assets-gen/worlds/:worldId
 */
router.delete('/worlds/:worldId', authenticate, async (req: AuthRequest, res: Response) => {
  const worldId = requireParam(req.params, 'worldId');
  const world = await getWorldMap(worldId);

  if (!world) {
    throw new ApiError(404, 'World not found');
  }

  if (world.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  await deleteWorldMap(worldId);

  res.json({ success: true });
});

/**
 * Generate a world chunk
 * @route GET /api/assets-gen/worlds/:worldId/chunks/:chunkX/:chunkY/:chunkZ
 */
router.get('/worlds/:worldId/chunks/:chunkX/:chunkY/:chunkZ', authenticate, async (req: AuthRequest, res: Response) => {
  const worldId = requireParam(req.params, 'worldId');
  const chunkX = requireParam(req.params, 'chunkX');
  const chunkY = requireParam(req.params, 'chunkY');
  const chunkZ = requireParam(req.params, 'chunkZ');
  const world = await getWorldMap(worldId);

  if (!world) {
    throw new ApiError(404, 'World not found');
  }

  if (world.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  // Use worker pool for chunk generation
  const workerPool = getWorkerPool();

  try {
    const chunk = await workerPool.run({
      seed: world.seed,
      chunkX: parseInt(chunkX, 10),
      chunkY: parseInt(chunkY, 10),
      chunkZ: parseInt(chunkZ, 10),
      params: world.parameters,
    });

    // Validate chunk structure
    if (!chunk || !chunk.tiles || !Array.isArray(chunk.tiles)) {
      logger.error('[AssetsAPI] Invalid chunk structure returned from worker', { chunk });
      throw new ApiError(500, 'Invalid chunk data generated');
    }

    // Compress response - only send surface tiles for 2D map
    // Filter out underground/sky tiles and minimize data
    const surfaceTiles = chunk.tiles
      .filter((tile: { z: number; elevation: number }) => Math.abs(tile.z - tile.elevation) <= 2) // Only near-surface tiles
      .map((tile: { x: number; y: number; z: number; biome: string; elevation: number }) => ({
        x: tile.x,
        y: tile.y,
        z: tile.z,
        biome: tile.biome,
        elevation: tile.elevation,
        // Omit detailed climate, isCave, isOre, lightLevel for 2D rendering
      }));

    const compressedChunk = {
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      chunkZ: chunk.chunkZ,
      tiles: surfaceTiles,
      biomes: chunk.biomes ? Array.from(chunk.biomes) : [], // Convert Set to Array for JSON
    };

    res.json({ success: true, data: compressedChunk });
  } catch (error) {
    logger.error('[AssetsAPI] Chunk generation failed:', error);
    throw new ApiError(500, error instanceof Error ? error.message : 'Chunk generation failed');
  }
});

// ============================================================================
// Asset Management Routes (Generic routes MUST be last)
// ============================================================================

/**
 * Get a single asset
 * @route GET /api/assets-gen/:assetId
 */
router.get('/:assetId', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const asset = await getAsset(assetId);

  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: asset });
});

/**
 * Delete an asset
 * @route DELETE /api/assets/:assetId
 */
router.delete('/:assetId', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const asset = await getAsset(assetId);

  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  await deleteAsset(assetId);

  res.json({ success: true });
});

/**
 * Update an asset
 * @route PATCH /api/assets-gen/:assetId
 */
router.patch('/:assetId', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const asset = await getAsset(assetId);

  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  // Update asset with provided fields
  await updateAsset(assetId, req.body);

  res.json({ success: true });
});

/**
 * Move an asset to another collection
 * @route POST /api/assets-gen/:assetId/move
 */
router.post('/:assetId/move', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const { targetCollectionId } = req.body;

  if (!targetCollectionId) {
    throw new ApiError(400, 'Target collection ID is required');
  }

  // Get the asset
  const asset = await getAsset(assetId);
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  // Get source collection
  const sourceCollection = await getCollection(asset.collectionId);
  if (!sourceCollection || sourceCollection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied to source collection');
  }

  // Get target collection
  const targetCollection = await getCollection(targetCollectionId);
  if (!targetCollection) {
    throw new ApiError(404, 'Target collection not found');
  }

  if (targetCollection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied to target collection');
  }

  // Validate asset type matches collection type
  if (asset.assetType !== targetCollection.assetType) {
    throw new ApiError(
      400,
      `Cannot move ${asset.assetType} asset to ${targetCollection.assetType} collection. Asset types must match.`
    );
  }

  // Update asset's collection
  await updateAsset(assetId, { collectionId: targetCollectionId });

  logger.info(`[AssetsAPI] Asset ${assetId} moved from ${asset.collectionId} to ${targetCollectionId}`);

  res.json({ success: true });
});

/**
 * Generate a 3D model for an asset
 * @route POST /api/assets/:assetId/generate-model
 */
router.post('/:assetId/generate-model', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const validation = generateModelSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const asset = await getAsset(assetId);
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  // Update status to loading
  await updateAssetStatus(assetId, 'loading');

  try {
    const modelData = await generateModel(validation.data);
    await saveGeneratedModel(assetId, modelData);

    res.json({ success: true, data: modelData });
  } catch (error) {
    logger.error('[AssetsAPI] Model generation failed:', error);
    await updateAssetStatus(assetId, 'error');
    throw new ApiError(500, 'Model generation failed');
  }
});

/**
 * Generate grid chunks for structure/map asset
 * @route POST /api/assets-gen/assets/:assetId/generate-grid
 */
router.post('/assets/:assetId/generate-grid', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');

  const asset = await getAsset(assetId);
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  logger.info('[AssetsAPI] 🎲 Generating grid chunks for asset', { assetId, assetType: collection.assetType });

  try {
    if (collection.assetType === 'structures') {
      // Generate structure grid (WFC + BSP)
      const result = await generateStructureGridChunks(assetId, {
        name: asset.name,
        structureType: 'house', // TODO: Get from asset metadata
        width: 5, // TODO: Get from request body
        height: 5,
        zLayers: [0, 1], // Ground + first floor
      });

      // Update asset with grid metadata
      await updateAsset(assetId, {
        gridMetadata: {
          ...result.metadata,
          totalChunks: result.chunks.length,
          generatedAt: Date.now(),
        },
        hasGridChunks: true,
        status: 'done',
      } as any);

      res.json({ success: true, chunks: result.chunks.length, metadata: result.metadata });
    } else if (collection.assetType === 'map') {
      // Generate map grid (noise + biomes)
      const result = await generateMapGridChunks(assetId, {
        name: asset.name,
        width: 16, // TODO: Get from request body
        height: 16,
        seed: `map-${assetId}`,
      });

      await updateAsset(assetId, {
        gridMetadata: {
          ...result.metadata,
          totalChunks: result.chunks.length,
          generatedAt: Date.now(),
        },
        hasGridChunks: true,
        status: 'done',
      } as any);

      res.json({ success: true, chunks: result.chunks.length, metadata: result.metadata });
    } else {
      throw new ApiError(400, 'Asset type does not support grid generation');
    }
  } catch (error) {
    logger.error('[AssetsAPI] Grid generation failed:', error);
    throw new ApiError(500, 'Grid generation failed');
  }
});

/**
 * Generate a 2D image from text for an asset
 * @route POST /api/assets/:assetId/generate-image
 */
router.post('/:assetId/generate-image', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'assetId');
  const validation = generateImageSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const asset = await getAsset(assetId);
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  await updateAssetStatus(assetId, 'loading');

  try {
    const imageBuffer = await generateImageFromText(validation.data.prompt);
    const imageUrl = await uploadAssetFile(req.user!.uid, assetId, imageBuffer, 'generated-image.png', 'image/png');

    await updateAsset(assetId, {
      storageUrl: imageUrl,
      status: 'done',
    });

    res.json({ success: true, data: { imageUrl } });
  } catch (error) {
    logger.error('[AssetsAPI] Image generation failed:', error);
    await updateAssetStatus(assetId, 'error');
    throw new ApiError(500, 'Image generation failed');
  }
});

/**
 * Generate an image variation for an asset
 * @route POST /api/assets/:assetId/generate-variation
 */
router.post(
  '/:assetId/generate-variation',
  authenticate,
  upload.single('baseImage') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  async (req: AuthRequest, res: Response) => {
    const assetId = requireParam(req.params, 'assetId');
    const validation = generateVariationSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ApiError(400, validation.error.message);
    }

    if (!req.file) {
      throw new ApiError(400, 'Base image is required');
    }

    const asset = await getAsset(assetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    const collection = await getCollection(asset.collectionId);
    if (!collection || collection.createdBy !== req.user!.uid) {
      throw new ApiError(403, 'Access denied');
    }

    await updateAssetStatus(assetId, 'loading');

    try {
      const imageBuffer = await generateImageVariation({
        prompt: `${validation.data.masterDescription} - ${validation.data.variationDescription}`,
        baseImage: req.file.buffer,
        masterDescription: validation.data.masterDescription,
        variationDescription: validation.data.variationDescription,
      });

      const imageUrl = await uploadAssetFile(req.user!.uid, assetId, imageBuffer, 'variation.png', 'image/png');

      await updateAsset(assetId, {
        storageUrl: imageUrl,
        status: 'done',
      });

      res.json({ success: true, data: { imageUrl } });
    } catch (error) {
      logger.error('[AssetsAPI] Variation generation failed:', error);
      await updateAssetStatus(assetId, 'error');
      throw new ApiError(500, 'Variation generation failed');
    }
  }
);

/**
 * Transform an image for an asset
 * @route POST /api/assets/:assetId/transform-image
 */
router.post(
  '/:assetId/transform-image',
  authenticate,
  upload.single('baseImage') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  async (req: AuthRequest, res: Response) => {
    const assetId = requireParam(req.params, 'assetId');
    const validation = transformImageSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ApiError(400, validation.error.message);
    }

    if (!req.file) {
      throw new ApiError(400, 'Base image is required');
    }

    const asset = await getAsset(assetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    const collection = await getCollection(asset.collectionId);
    if (!collection || collection.createdBy !== req.user!.uid) {
      throw new ApiError(403, 'Access denied');
    }

    await updateAssetStatus(assetId, 'loading');

    try {
      const imageBuffer = await transformImage(req.file.buffer, validation.data.transformPrompt);

      const imageUrl = await uploadAssetFile(req.user!.uid, assetId, imageBuffer, 'transformed.png', 'image/png');

      await updateAsset(assetId, {
        storageUrl: imageUrl,
        status: 'done',
      });

      res.json({ success: true, data: { imageUrl } });
    } catch (error) {
      logger.error('[AssetsAPI] Image transformation failed:', error);
      await updateAssetStatus(assetId, 'error');
      throw new ApiError(500, 'Image transformation failed');
    }
  }
);

/**
 * Trigger asset generation (fire-and-forget)
 * @route POST /api/assets-gen/assets/:id/generate
 */
router.post('/assets/:id/generate', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'id');

  const asset = await getAsset(assetId);
  if (!asset) {
    throw new ApiError(404, 'Asset not found');
  }

  const collection = await getCollection(asset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  if (asset.status !== 'pending') {
    throw new ApiError(400, 'Asset has already been generated or is currently generating');
  }

  // Set status to loading
  await updateAssetStatus(assetId, 'loading');

  // Fire-and-forget: queue the generation job
  setImmediate(async () => {
    try {
      if (asset.assetType === '2d') {
        const prompt = asset.generationPrompt || asset.description;
        const imageBuffer = await generateImageFromText(prompt);
        const imageUrl = await uploadAssetFile(
          collection.createdBy,
          assetId,
          imageBuffer,
          'generated.png',
          'image/png'
        );
        await updateAsset(assetId, { storageUrl: imageUrl, status: 'done' });
      } else if (asset.assetType === '3d') {
        const modelType = asset.description.toLowerCase().includes('tree')
          ? 'Tree'
          : asset.description.toLowerCase().includes('creature')
            ? 'Creature'
            : 'Object';
        const modelData = await generateModel({
          assetType: modelType as any,
          name: asset.name,
          description: asset.description,
        });
        await saveGeneratedModel(assetId, modelData);
      } else if (asset.assetType === 'structures') {
        // Parse structure params from generationPrompt (stored as JSON)
        const params = asset.generationPrompt ? JSON.parse(asset.generationPrompt) : {};
        const result = await generateStructureGridChunks(assetId, {
          name: asset.name,
          structureType: params.structureType || 'house',
          width: params.width || 2,
          height: params.height || 2,
          zLayers: Array.from({ length: params.floors || 1 }, (_, i) => i),
        });
        await updateAsset(assetId, {
          gridMetadata: {
            ...result.metadata,
            totalChunks: result.chunks.length,
            generatedAt: Date.now(),
          },
          hasGridChunks: true,
          status: 'done',
        } as any);
      } else if (asset.assetType === 'map') {
        // Parse map params from generationPrompt (stored as JSON)
        const params = asset.generationPrompt ? JSON.parse(asset.generationPrompt) : {};
        const result = await generateMapGridChunks(assetId, {
          name: asset.name,
          width: params.width || 16,
          height: params.height || 16,
          seed: params.seed || `map-${assetId}`,
        });
        await updateAsset(assetId, {
          gridMetadata: {
            ...result.metadata,
            totalChunks: result.chunks.length,
            generatedAt: Date.now(),
          },
          hasGridChunks: true,
          status: 'done',
        } as any);
      }
      logger.info(`[AssetsAPI] Asset ${assetId} generation completed successfully`);
    } catch (error) {
      logger.error(`[AssetsAPI] Asset ${assetId} generation failed:`, error);
      await updateAssetStatus(assetId, 'error');
    }
  });

  res.json({ success: true, message: 'Generation started' });
});

/**
 * Create N variations of an asset
 * @route POST /api/assets-gen/assets/:id/variations
 */
router.post('/assets/:id/variations', authenticate, async (req: AuthRequest, res: Response) => {
  const assetId = requireParam(req.params, 'id');
  const { count, variationPrompt } = req.body;

  if (!count || count < 1 || count > 8) {
    throw new ApiError(400, 'Count must be between 1 and 8');
  }

  // Get base asset
  const baseAsset = await getAsset(assetId);
  if (!baseAsset) {
    throw new ApiError(404, 'Asset not found');
  }

  // Verify collection ownership
  const collection = await getCollection(baseAsset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  const createdAssetIds: string[] = [];

  // Create N sibling assets
  for (let i = 0; i < count; i++) {
    const variationName = `${baseAsset.name} - Variation ${i + 1}`;
    const modifierText = variationPrompt ? ` ${variationPrompt}` : '';
    const variationDescription = `${baseAsset.description}${modifierText}, variation ${i + 1}`;

    const newAssetId = await createAsset(
      baseAsset.collectionId,
      variationName,
      variationDescription,
      baseAsset.assetType,
      variationDescription
    );

    createdAssetIds.push(newAssetId);
  }

  logger.info(`[AssetsAPI] Created ${count} variation assets for base asset ${assetId}`);
  res.status(201).json({ success: true, data: { assetIds: createdAssetIds } });
});

/**
 * Generate batch variations from a base asset
 * @route POST /api/assets-gen/batch-variations
 */
router.post('/batch-variations', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = batchVariationsSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ApiError(400, validation.error.message);
  }

  const { baseAssetId, count, variationPrompt } = validation.data;

  // Get base asset
  const baseAsset = await getAsset(baseAssetId);
  if (!baseAsset) {
    throw new ApiError(404, 'Base asset not found');
  }

  // Verify collection ownership
  const collection = await getCollection(baseAsset.collectionId);
  if (!collection || collection.createdBy !== req.user!.uid) {
    throw new ApiError(403, 'Access denied');
  }

  const createdAssetIds: string[] = [];

  try {
    // Generate variations based on asset type
    for (let i = 0; i < count; i++) {
      const variationName = `${baseAsset.name} - Variation ${i + 1}`;
      const modifierText = variationPrompt ? ` ${variationPrompt}` : '';
      const variationDescription = `${baseAsset.description}${modifierText}, variation ${i + 1}`;

      // Create the new asset
      const newAssetId = await createAsset(
        baseAsset.collectionId,
        variationName,
        variationDescription,
        baseAsset.assetType,
        variationDescription
      );

      createdAssetIds.push(newAssetId);

      // Generate content based on type
      if (baseAsset.assetType === '2d') {
        // Generate image for 2D asset
        await updateAssetStatus(newAssetId, 'loading');
        try {
          const imageBuffer = await generateImageFromText(variationDescription);
          const imageUrl = await uploadAssetFile(
            req.user!.uid,
            newAssetId,
            imageBuffer,
            `variation-${i + 1}.png`,
            'image/png'
          );

          await updateAsset(newAssetId, {
            storageUrl: imageUrl,
            status: 'done',
          });
        } catch (error) {
          logger.error(`[AssetsAPI] Variation ${i + 1} generation failed:`, error);
          await updateAssetStatus(newAssetId, 'error');
        }
      } else if (baseAsset.assetType === '3d' && baseAsset.modelData) {
        // Generate 3D model variation
        await updateAssetStatus(newAssetId, 'loading');
        try {
          // Extract model type from description or use a default
          const modelType = baseAsset.description.toLowerCase().includes('tree')
            ? 'Tree'
            : baseAsset.description.toLowerCase().includes('creature')
              ? 'Creature'
              : 'Object';

          const modelData = await generateModel({
            assetType: modelType as any,
            name: variationName,
            description: variationDescription,
          });

          await saveGeneratedModel(newAssetId, modelData);
        } catch (error) {
          logger.error(`[AssetsAPI] Model variation ${i + 1} generation failed:`, error);
          await updateAssetStatus(newAssetId, 'error');
        }
      }
    }

    logger.info(`[AssetsAPI] Generated ${count} variations for asset ${baseAssetId}`);
    res.json({ success: true, data: { assetIds: createdAssetIds } });
  } catch (error) {
    logger.error('[AssetsAPI] Batch variations generation failed:', error);
    throw new ApiError(500, 'Batch variations generation failed');
  }
});

export default router;
