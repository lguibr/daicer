/* eslint-disable no-use-before-define */
/**
 * Asset Management Service
 *
 * Handles CRUD operations for asset collections and assets
 * Integrates with Firestore and Firebase Storage
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from '../../utils/logger';
import { Collection, Asset, AssetCategory, GenerationStatus, ModelData } from '../generation/types';
import { saveAsset } from '../asset-storage';

// Lazy getters to avoid initialization before Firebase is ready
const getFirestoreInstance = () => getFirestore();
const getStorageInstance = () => getStorage();

/**
 * Create a new asset collection
 */
export async function createCollection(
  userId: string,
  name: string,
  assetType: AssetCategory,
  mode?: string,
  description?: string,
  color?: string
): Promise<string> {
  try {
    const collectionData: Partial<Collection> = {
      name,
      assetType,
      createdAt: new Date(),
      createdBy: userId,
      ...(description && { description }),
      ...(mode && { mode }),
      ...(color && { color }),
    };

    const docRef = await getFirestoreInstance().collection('assetCollections').add(collectionData);

    logger.info(`[AssetService] Collection created: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('[AssetService] Error creating collection:', error);
    throw new Error('Failed to create collection');
  }
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(userId: string, assetType?: AssetCategory): Promise<Collection[]> {
  try {
    logger.info(`[AssetService] Getting collections for user: ${userId}, type: ${assetType || 'all'}`);

    let query = getFirestoreInstance().collection('assetCollections').where('createdBy', '==', userId);

    if (assetType) {
      query = query.where('assetType', '==', assetType);
    }

    logger.info(`[AssetService] Executing Firestore query...`);
    const snapshot = await query.orderBy('createdAt', 'desc').get();

    logger.info(`[AssetService] Query returned ${snapshot.docs.length} documents`);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Collection[];
  } catch (error) {
    logger.error('[AssetService] Error getting collections:', error);
    throw new Error('Failed to get collections');
  }
}

/**
 * Get a single collection
 */
export async function getCollection(collectionId: string): Promise<Collection | null> {
  try {
    const doc = await getFirestoreInstance().collection('assetCollections').doc(collectionId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Collection;
  } catch (error) {
    logger.error('[AssetService] Error getting collection:', error);
    throw new Error('Failed to get collection');
  }
}

/**
 * Update a collection
 */
export async function updateCollection(collectionId: string, updates: Partial<Collection>): Promise<void> {
  try {
    await getFirestoreInstance().collection('assetCollections').doc(collectionId).update(updates);

    logger.info(`[AssetService] Collection updated: ${collectionId}`);
  } catch (error) {
    logger.error('[AssetService] Error updating collection:', error);
    throw new Error('Failed to update collection');
  }
}

/**
 * Delete a collection and its assets
 */
export async function deleteCollection(collectionId: string, deleteAssets = true): Promise<void> {
  try {
    if (deleteAssets) {
      // Delete all assets in the collection
      const assetsSnapshot = await getFirestoreInstance()
        .collection('assets')
        .where('collectionId', '==', collectionId)
        .get();

      const deletePromises = assetsSnapshot.docs.map((doc) => deleteAsset(doc.id));
      await Promise.all(deletePromises);
    }

    await getFirestoreInstance().collection('assetCollections').doc(collectionId).delete();

    logger.info(`[AssetService] Collection deleted: ${collectionId}`);
  } catch (error) {
    logger.error('[AssetService] Error deleting collection:', error);
    throw new Error('Failed to delete collection');
  }
}

/**
 * Helper: Save avatar images from character sheet data to storage
 */
async function saveAvatarImages(
  assetId: string,
  userId: string,
  characterSheetData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const avatarPreview = characterSheetData.avatarPreview as Record<string, unknown> | undefined;

  if (!avatarPreview) {
    return characterSheetData;
  }

  const updatedAvatarPreview: Record<string, unknown> = {};
  const avatarVariants = ['portrait', 'upperBody', 'fullBody'] as const;

  for (const variant of avatarVariants) {
    const variantData = avatarPreview[variant] as { data?: string; mimeType?: string } | undefined;

    if (variantData?.data) {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(variantData.data, 'base64');
        const mimeType = variantData.mimeType || 'image/png';

        // Save to storage
        const result = await saveAsset({
          buffer,
          contentType: mimeType,
          filename: `${variant}.png`,
          folder: `assets/${userId}/${assetId}/avatar`,
          metadata: {
            userId,
            assetId,
            variant,
          },
        });

        // Store public URL instead of base64 data
        const { data, ...variantWithoutData } = variantData;
        updatedAvatarPreview[variant] = {
          ...variantWithoutData,
          publicUrl: result.url,
          storagePath: result.path,
          // data field omitted to save space
        };

        logger.info(`[AssetService] Avatar ${variant} saved: ${result.url}`);
      } catch (error) {
        logger.error(`[AssetService] Failed to save avatar ${variant}:`, error);
        // Keep original data if save fails
        updatedAvatarPreview[variant] = variantData;
      }
    } else if (avatarPreview[variant]) {
      // Preserve existing data if no base64 data
      updatedAvatarPreview[variant] = avatarPreview[variant];
    }
  }

  return {
    ...characterSheetData,
    avatarPreview: updatedAvatarPreview,
  };
}

/**
 * Create a new asset
 */
export async function createAsset(
  collectionId: string,
  name: string,
  description: string,
  assetType: AssetCategory,
  generationPrompt?: string,
  characterSheetData?: Record<string, unknown>
): Promise<string> {
  try {
    // For character sheets, save avatar images to storage first
    let processedCharacterData = characterSheetData;
    if (characterSheetData && assetType === 'character-sheet') {
      // We need the userId - get it from the collection
      const collection = await getCollection(collectionId);
      if (collection?.createdBy) {
        // Create asset document first to get an ID
        const tempAssetData: Record<string, unknown> = {
          collectionId,
          name,
          description,
          assetType,
          status: 'processing',
          createdAt: new Date(),
        };

        const docRef = await getFirestoreInstance().collection('assets').add(tempAssetData);
        const assetId = docRef.id;

        // Save avatar images and get updated data with URLs
        processedCharacterData = await saveAvatarImages(assetId, collection.createdBy, characterSheetData);

        // Update the asset with processed data
        await getFirestoreInstance().collection('assets').doc(assetId).update({
          characterSheetData: processedCharacterData,
          status: 'done',
        });

        logger.info(`[AssetService] Character sheet asset created with avatars: ${assetId}`);
        return assetId;
      }
    }

    // Standard asset creation (non-character-sheet or no avatar data)
    const assetData: Record<string, unknown> = {
      collectionId,
      name,
      description,
      assetType,
      status: processedCharacterData ? 'done' : 'pending',
      createdAt: new Date(),
    };

    // Only add generationPrompt if defined
    if (generationPrompt !== undefined) {
      assetData.generationPrompt = generationPrompt;
    }

    // Only add characterSheetData if defined
    if (processedCharacterData !== undefined) {
      assetData.characterSheetData = processedCharacterData;
    }

    const docRef = await getFirestoreInstance().collection('assets').add(assetData);

    logger.info(`[AssetService] Asset created: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('[AssetService] Error creating asset:', error);
    throw new Error('Failed to create asset');
  }
}

/**
 * Get all assets for a collection
 */
export async function getCollectionAssets(collectionId: string): Promise<Asset[]> {
  try {
    const snapshot = await getFirestoreInstance()
      .collection('assets')
      .where('collectionId', '==', collectionId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
  } catch (error) {
    logger.error('[AssetService] Error getting assets:', error);
    throw new Error('Failed to get assets');
  }
}

/**
 * Get a single asset
 */
export async function getAsset(assetId: string): Promise<Asset | null> {
  try {
    const doc = await getFirestoreInstance().collection('assets').doc(assetId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Asset;
  } catch (error) {
    logger.error('[AssetService] Error getting asset:', error);
    throw new Error('Failed to get asset');
  }
}

/**
 * Update an asset
 */
export async function updateAsset(assetId: string, updates: Partial<Asset>): Promise<void> {
  try {
    await getFirestoreInstance().collection('assets').doc(assetId).update(updates);

    logger.info(`[AssetService] Asset updated: ${assetId}`);
  } catch (error) {
    logger.error('[AssetService] Error updating asset:', error);
    throw new Error('Failed to update asset');
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  try {
    const asset = await getAsset(assetId);

    // Delete associated storage file if it exists
    if (asset?.storageUrl) {
      try {
        const bucket = getStorageInstance().bucket();
        const file = bucket.file(asset.storageUrl);
        await file.delete();
      } catch (storageError) {
        logger.warn('[AssetService] Could not delete storage file:', storageError);
      }
    }

    await getFirestoreInstance().collection('assets').doc(assetId).delete();

    logger.info(`[AssetService] Asset deleted: ${assetId}`);
  } catch (error) {
    logger.error('[AssetService] Error deleting asset:', error);
    throw new Error('Failed to delete asset');
  }
}

/**
 * Upload asset file to Firebase Storage
 */
export async function uploadAssetFile(
  userId: string,
  assetId: string,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const result = await saveAsset({
      buffer: fileBuffer,
      contentType,
      filename: fileName,
      folder: `assets/${userId}/${assetId}`,
      metadata: {
        userId,
        assetId,
      },
    });

    logger.info(`[AssetService] File uploaded: ${result.path}`);
    return result.url;
  } catch (error) {
    logger.error('[AssetService] Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Update asset status
 */
export async function updateAssetStatus(assetId: string, status: GenerationStatus): Promise<void> {
  await updateAsset(assetId, { status });
}

/**
 * Save generated model data to asset
 */
export async function saveGeneratedModel(assetId: string, modelData: ModelData): Promise<void> {
  await updateAsset(assetId, {
    modelData,
    status: 'done',
  });
}

/**
 * Save base image to collection
 */
export async function saveCollectionBaseImage(
  collectionId: string,
  userId: string,
  imageBuffer: Buffer
): Promise<string> {
  const bucket = getStorageInstance().bucket();
  const filePath = `assets/${userId}/collections/${collectionId}/base-image.png`;
  const file = bucket.file(filePath);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/png',
    },
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  await updateCollection(collectionId, { baseImageId: publicUrl });

  return publicUrl;
}
