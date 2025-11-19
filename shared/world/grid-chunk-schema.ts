import { z } from 'zod';
import { GridTileSchema } from './grid-tile-schema';
import { GridFeatureSchema } from './grid-feature-schema';

/**
 * Grid Chunk Schema
 * Represents an 8x8 tile chunk in the infinite grid system
 */

export const CHUNK_SIZE = 8; // 8x8 tiles per chunk

export const GridChunkSchema = z.object({
  chunkX: z.number().int(),
  chunkY: z.number().int(),
  z: z.number().int().min(-6).max(5), // Z-layer index
  tiles: z.array(GridTileSchema),
  features: z.array(GridFeatureSchema).default([]),
  biomes: z.array(z.string()).default([]), // Unique biomes present in this chunk
  seed: z.string(), // Seed used to generate this chunk (for reproducibility)
  generated: z.boolean().default(false),
  generatedAt: z.number().optional(),
  // Metadata for chunk state
  hasStructure: z.boolean().default(false),
  hasCave: z.boolean().default(false),
  isStartingArea: z.boolean().default(false),
});

export type GridChunk = z.infer<typeof GridChunkSchema>;

/**
 * Helper to calculate world coordinates from chunk coordinates
 */
export function chunkToWorldCoords(chunkX: number, chunkY: number): { x: number; y: number } {
  return {
    x: chunkX * CHUNK_SIZE,
    y: chunkY * CHUNK_SIZE,
  };
}

/**
 * Helper to calculate chunk coordinates from world coordinates
 */
export function worldToChunkCoords(x: number, y: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE),
  };
}
