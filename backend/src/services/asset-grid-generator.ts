/**
 * Asset Grid Generator
 * Generates grid chunks for structure and map assets (independent of rooms)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '@/utils/logger';
import type { GridChunk } from '@daicer/shared/world/grid-chunk-schema';
import { generateGridChunk } from './world-gen/grid-chunk-generator';
import { collapseGrid } from './world-gen/wfc/wfc-solver';
import { getPresetTiles } from './world-gen/wfc/wfc-presets';
// import { generateBSPLayout } from './world-gen/bsp-rooms';

/**
 * Generate grid chunks for a structure asset using WFC + BSP
 */
export async function generateStructureGridChunks(
  assetId: string,
  params: {
    name: string;
    structureType: 'castle' | 'house' | 'dungeon';
    width: number; // In chunks (e.g., 5 = 5x5 chunks = 40x40 tiles)
    height: number;
    zLayers: number[]; // e.g., [0, 1] for ground + first floor
  }
): Promise<{ chunks: GridChunk[]; metadata: { width: number; height: number; zLayers: number[]; seed: string } }> {
  const { name, structureType, width, height, zLayers } = params;
  const seed = `asset-${assetId}-${Date.now()}`;

  logger.info(`[AssetGridGenerator] 🏰 Generating structure grid for "${name}"`, {
    assetId,
    structureType,
    width,
    height,
    zLayers,
    seed,
  });

  const chunks: GridChunk[] = [];

  // For each z-layer
  for (const z of zLayers) {
    logger.info(`[AssetGridGenerator] Generating z-layer ${z} (${width}x${height} chunks)`);

    // Generate WFC layout for this layer
    const tiles = getPresetTiles(structureType);
    const wfcResult = collapseGrid(width * 8, height * 8, tiles, `${seed}-z${z}`);

    if (!wfcResult.success) {
      logger.warn(`[AssetGridGenerator] WFC failed for z=${z}, using fallback`);
    }

    // Generate chunks for this layer
    for (let cy = 0; cy < height; cy++) {
      for (let cx = 0; cx < width; cx++) {
        const chunk = generateGridChunk(cx, cy, z, {
          seed: `${seed}-${cx}-${cy}-${z}`,
          waterLevel: -0.5, // No water in structures
          mountainousness: 0.1, // Flat terrain for structures
          caveFrequency: 0.0, // No caves in structures
        });

        chunk.hasStructure = true;
        chunk.isStartingArea = false;
        chunks.push(chunk);
      }
    }
  }

  logger.info(`[AssetGridGenerator] ✅ Generated ${chunks.length} chunks for structure`, {
    assetId,
    chunkCount: chunks.length,
    zLayers: zLayers.length,
  });

  // Save chunks to Firestore under assets/{assetId}/grid_chunks/
  await saveAssetChunks(assetId, chunks);

  return {
    chunks,
    metadata: {
      width,
      height,
      zLayers,
      seed,
    },
  };
}

/**
 * Generate grid chunks for a map asset using noise + biomes
 */
export async function generateMapGridChunks(
  assetId: string,
  params: {
    name: string;
    width: number; // In chunks
    height: number;
    seed?: string;
    waterLevel?: number;
    mountainousness?: number;
    temperature?: number;
    moisture?: number;
  }
): Promise<{ chunks: GridChunk[]; metadata: { width: number; height: number; zLayers: number[]; seed: string } }> {
  const { name, width, height } = params;
  const seed = params.seed || `map-asset-${assetId}-${Date.now()}`;

  logger.info(`[AssetGridGenerator] 🗺️ Generating map grid for "${name}"`, {
    assetId,
    width,
    height,
    seed,
  });

  const chunks: GridChunk[] = [];
  const z = 0; // Maps are surface-level only (for now)

  // Generate chunks using noise-based terrain
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      const chunk = generateGridChunk(cx, cy, z, {
        seed,
        waterLevel: params.waterLevel ?? -0.1,
        mountainousness: params.mountainousness ?? 1.0,
        caveFrequency: 0.0, // No underground for map assets
        temperatureBias: params.temperature ?? 0,
        moistureBias: params.moisture ?? 0,
      });

      chunk.isStartingArea = false;
      chunks.push(chunk);
    }
  }

  logger.info(`[AssetGridGenerator] ✅ Generated ${chunks.length} chunks for map`, {
    assetId,
    chunkCount: chunks.length,
  });

  // Save chunks to Firestore
  await saveAssetChunks(assetId, chunks);

  return {
    chunks,
    metadata: {
      width,
      height,
      zLayers: [0], // Surface only for maps
      seed,
    },
  };
}

/**
 * Save asset chunks to Firestore
 */
async function saveAssetChunks(assetId: string, chunks: GridChunk[]): Promise<void> {
  const db = getFirestore();
  const chunkCollection = db.collection('assets').doc(assetId).collection('grid_chunks');

  logger.info(`[AssetGridGenerator] 💾 Saving ${chunks.length} chunks to Firestore...`, { assetId });

  // Batch write (500 per batch)
  const batchSize = 500;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = db.batch();
    const batchChunks = chunks.slice(i, i + batchSize);

    for (const chunk of batchChunks) {
      const chunkId = `${chunk.chunkX}_${chunk.chunkY}_${chunk.z}`;
      const docRef = chunkCollection.doc(chunkId);
      batch.set(docRef, chunk);
    }

    await batch.commit();
    logger.debug(`[AssetGridGenerator] Saved batch ${Math.floor(i / batchSize) + 1}`, {
      count: batchChunks.length,
    });
  }

  logger.info(`[AssetGridGenerator] ✅ All chunks saved to assets/${assetId}/grid_chunks/`);
}

/**
 * Get asset chunks from Firestore
 */
export async function getAssetChunk(
  assetId: string,
  chunkX: number,
  chunkY: number,
  z: number
): Promise<GridChunk | null> {
  const db = getFirestore();
  const chunkId = `${chunkX}_${chunkY}_${z}`;

  const doc = await db.collection('assets').doc(assetId).collection('grid_chunks').doc(chunkId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as GridChunk;
}
