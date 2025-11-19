/* eslint-disable @typescript-eslint/no-explicit-any, no-continue */
/**
 * Socket.IO handlers for real-time asset generation progress
 */

import type { Socket, Server } from 'socket.io';
import { logger } from '@/utils/logger';
import {
  getAsset,
  getCollection,
  updateAssetStatus,
  saveGeneratedModel,
  uploadAssetFile,
} from '@/services/assets/assetService';
import { generateModel, generateImageFromText } from '@/services/generation/gemini';
import type { ModelGenerationRequest } from '@/services/generation/types';

interface GenerateModelData {
  assetId: string;
  request: ModelGenerationRequest;
}

interface GenerateImageData {
  assetId: string;
  prompt: string;
}

// Unused interface - kept for future implementation
// interface GenerateVariationData {
//   assetId: string;
//   baseImageUrl: string;
//   masterDescription: string;
//   variationDescription: string;
// }

// Unused interface - kept for future implementation
// interface TransformImageData {
//   assetId: string;
//   baseImageUrl: string;
//   transformPrompt: string;
// }

/**
 * Handle 3D model generation with progress updates
 */
export async function handleGenerateModel(socket: Socket, userId: string, data: GenerateModelData): Promise<void> {
  const { assetId, request } = data;

  try {
    logger.info(`[AssetSocket] Generate model request for asset: ${assetId}`);

    const asset = await getAsset(assetId);
    if (!asset) {
      socket.emit('asset:generation:error', {
        assetId,
        error: 'Asset not found',
      });
      return;
    }

    const collection = await getCollection(asset.collectionId);
    if (!collection || collection.createdBy !== userId) {
      socket.emit('asset:generation:error', {
        assetId,
        error: 'Access denied',
      });
      return;
    }

    socket.emit('asset:generation:started', { assetId });
    await updateAssetStatus(assetId, 'loading');

    const modelData = await generateModel(request);

    await saveGeneratedModel(assetId, modelData);

    socket.emit('asset:generation:completed', {
      assetId,
      modelData,
    });

    logger.info(`[AssetSocket] Model generated for asset: ${assetId}`);
  } catch (error: any) {
    logger.error(`[AssetSocket] Model generation failed:`, error);
    await updateAssetStatus(assetId, 'error');
    socket.emit('asset:generation:error', {
      assetId,
      error: error.message || 'Generation failed',
    });
  }
}

/**
 * Handle 2D image generation with progress updates
 */
export async function handleGenerateImage(socket: Socket, userId: string, data: GenerateImageData): Promise<void> {
  const { assetId, prompt } = data;

  try {
    logger.info(`[AssetSocket] Generate image request for asset: ${assetId}`);

    const asset = await getAsset(assetId);
    if (!asset) {
      socket.emit('asset:generation:error', {
        assetId,
        error: 'Asset not found',
      });
      return;
    }

    const collection = await getCollection(asset.collectionId);
    if (!collection || collection.createdBy !== userId) {
      socket.emit('asset:generation:error', {
        assetId,
        error: 'Access denied',
      });
      return;
    }

    socket.emit('asset:generation:started', { assetId });
    await updateAssetStatus(assetId, 'loading');

    const imageBuffer = await generateImageFromText(prompt);

    const imageUrl = await uploadAssetFile(userId, assetId, imageBuffer, 'generated-image.png', 'image/png');

    await updateAssetStatus(assetId, 'done');

    socket.emit('asset:generation:completed', {
      assetId,
      imageUrl,
    });

    logger.info(`[AssetSocket] Image generated for asset: ${assetId}`);
  } catch (error: any) {
    logger.error(`[AssetSocket] Image generation failed:`, error);
    await updateAssetStatus(assetId, 'error');
    socket.emit('asset:generation:error', {
      assetId,
      error: error.message || 'Generation failed',
    });
  }
}

/**
 * Handle batch model generation
 */
export async function handleBatchGenerateModels(
  _io: Server,
  socket: Socket,
  userId: string,
  data: { assetIds: string[]; requests: Record<string, ModelGenerationRequest> }
): Promise<void> {
  const { assetIds, requests } = data;

  logger.info(`[AssetSocket] Batch generate ${assetIds.length} models`);

  socket.emit('asset:batch:started', { assetIds });

  let completed = 0;
  const results: Record<string, any> = {};

  for (const assetId of assetIds) {
    try {
      const request = requests[assetId];
      if (!request) {
        continue;
      }

      const asset = await getAsset(assetId);
      if (!asset) {
        continue;
      }

      const collection = await getCollection(asset.collectionId);
      if (!collection || collection.createdBy !== userId) {
        continue;
      }

      await updateAssetStatus(assetId, 'loading');
      socket.emit('asset:batch:progress', {
        assetId,
        completed,
        total: assetIds.length,
      });

      const modelData = await generateModel(request);
      await saveGeneratedModel(assetId, modelData);

      results[assetId] = { success: true, modelData };
      completed += 1;

      socket.emit('asset:batch:progress', {
        assetId,
        completed,
        total: assetIds.length,
      });
    } catch (error: any) {
      logger.error(`[AssetSocket] Batch item failed:`, error);
      await updateAssetStatus(assetId, 'error');
      results[assetId] = { success: false, error: error.message };
    }
  }

  socket.emit('asset:batch:completed', { results });

  logger.info(`[AssetSocket] Batch generation completed: ${completed}/${assetIds.length}`);
}

/**
 * Register asset socket handlers
 */
export function registerAssetHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on('asset:generate:model', (data) => handleGenerateModel(socket, userId, data));

  socket.on('asset:generate:image', (data) => handleGenerateImage(socket, userId, data));

  socket.on('asset:batch:generate', (data) => handleBatchGenerateModels(io, socket, userId, data));
}
