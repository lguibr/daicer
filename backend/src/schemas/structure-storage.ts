/**
 * Structure Storage Schemas for Firestore
 * Triple-level storage for optimization (Answer 5: a,b,c)
 */

import { z } from 'zod';

/**
 * Level 1: Global Structure Metadata (structures/{structureId})
 * Fast lookup, minimal data
 */
export const StructureMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural']),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']),
  significance: z.number().min(1).max(10),
  era: z.number(),
  createdAt: z.number(),
  totalVoxels: z.number(),
  hasMaterialization: z.boolean(),
});

export type StructureMetadata = z.infer<typeof StructureMetadataSchema>;

/**
 * Level 2: Room-Scoped Structure (rooms/{roomId}/structures/{structureId})
 * Room-specific placement and bounds
 */
export const RoomStructureSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  description: z.string(),
  type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural']),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']),
  significance: z.number().min(1).max(10),
  era: z.number(),
  bounds: z.object({
    minX: z.number(),
    maxX: z.number(),
    minY: z.number(),
    maxY: z.number(),
    minZ: z.number(),
    maxZ: z.number(),
  }),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
  }),
  collapseInfluence: z.object({
    x: z.number(),
    y: z.number(),
    radius: z.number(),
    flatten: z.boolean(),
    targetElevation: z.number(),
    strength: z.number(),
  }),
  materializedAt: z.number().optional(),
});

export type RoomStructure = z.infer<typeof RoomStructureSchema>;

/**
 * Level 3: Chunked Voxel Data (structures/{structureId}/chunks/{chunkId})
 * Large voxel arrays split into chunks for lazy loading
 */
export const StructureChunkSchema = z.object({
  structureId: z.string(),
  chunkId: z.string(), // e.g., "chunk_0_0_0"
  chunkX: z.number(),
  chunkY: z.number(),
  chunkZ: z.number(),
  voxelData: z.string(), // Base64-encoded Uint8Array
  compressedSize: z.number(),
  originalSize: z.number(),
});

export type StructureChunk = z.infer<typeof StructureChunkSchema>;

/**
 * Helper: Convert Uint8Array to base64 for Firestore storage
 */
export function voxelsToBase64(voxels: Uint8Array): string {
  return Buffer.from(voxels).toString('base64');
}

/**
 * Helper: Convert base64 back to Uint8Array
 */
export function base64ToVoxels(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Helper: Split voxel data into chunks for storage
 * Chunks are 16x16x16 voxel cubes
 */
export function splitIntoChunks(
  voxels: Uint8Array,
  dimensions: { width: number; height: number; depth: number }
): StructureChunk[] {
  const CHUNK_SIZE = 16;
  const chunks: StructureChunk[] = [];

  const chunksX = Math.ceil(dimensions.width / CHUNK_SIZE);
  const chunksY = Math.ceil(dimensions.height / CHUNK_SIZE);
  const chunksZ = Math.ceil(dimensions.depth / CHUNK_SIZE);

  for (let cz = 0; cz < chunksZ; cz++) {
    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const chunkData = extractChunk(voxels, dimensions, cx, cy, cz, CHUNK_SIZE);
        const base64 = voxelsToBase64(chunkData);

        chunks.push({
          structureId: '', // Set by caller
          chunkId: `chunk_${cx}_${cy}_${cz}`,
          chunkX: cx,
          chunkY: cy,
          chunkZ: cz,
          voxelData: base64,
          compressedSize: base64.length,
          originalSize: chunkData.length,
        });
      }
    }
  }

  return chunks;
}

/**
 * Extract a single chunk from full voxel array
 */
function extractChunk(
  voxels: Uint8Array,
  dimensions: { width: number; height: number; depth: number },
  cx: number,
  cy: number,
  cz: number,
  chunkSize: number
): Uint8Array {
  const chunkVoxels: number[] = [];

  for (let z = 0; z < chunkSize; z++) {
    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const globalX = cx * chunkSize + x;
        const globalY = cy * chunkSize + y;
        const globalZ = cz * chunkSize + z;

        if (globalX >= dimensions.width || globalY >= dimensions.height || globalZ >= dimensions.depth) {
          chunkVoxels.push(0); // AIR for out-of-bounds
        } else {
          const index = globalX + globalY * dimensions.width + globalZ * dimensions.width * dimensions.height;
          chunkVoxels.push(voxels[index] || 0);
        }
      }
    }
  }

  return new Uint8Array(chunkVoxels);
}
