/**
 * Asset Schema with Grid Support
 * Assets (structures/maps) can have their own grid chunks
 */

import { z } from 'zod';

/**
 * Grid metadata for assets
 */
export const AssetGridMetadataSchema = z.object({
  width: z.number().int().positive(), // Width in chunks
  height: z.number().int().positive(), // Height in chunks
  zLayers: z.array(z.number().int()), // Which z-layers have chunks (e.g., [0, 1, 2])
  seed: z.string(),
  totalChunks: z.number().int().default(0),
  generatedAt: z.number().optional(),
});

export type AssetGridMetadata = z.infer<typeof AssetGridMetadataSchema>;

/**
 * Asset schema with grid chunk support
 */
export const AssetWithGridSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['structures', 'maps', '2d', '3d', 'character_sheets']),
  description: z.string(),
  collectionId: z.string(),
  userId: z.string(),
  status: z.enum(['pending', 'generating', 'complete', 'failed']),

  // Grid-specific fields (for structures and maps)
  gridMetadata: AssetGridMetadataSchema.optional(),
  hasGridChunks: z.boolean().default(false),

  // Legacy fields
  storageUrl: z.string().optional(),
  publicUrl: z.string().optional(),
  modelData: z.unknown().optional(),
  generationPrompt: z.string().optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type AssetWithGrid = z.infer<typeof AssetWithGridSchema>;
