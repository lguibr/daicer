/**
 * Terrain Generation State Schema (Shared)
 * For terrain generation subgraph - generates 3D voxel world
 */

import { z } from 'zod';

export const TerrainGenerationStateSchema = z.object({
  roomId: z.string(),
  structures: z.array(z.any()),
  roads: z.array(z.any()),
  worldHistory: z.string(),
  settings: z.object({
    gridWidth: z.number().min(256).max(16384).describe('Minimum 256x256 grid for fast testing'),
    gridHeight: z.number().min(256).max(16384).describe('Minimum 256x256 grid for fast testing'),
    gridDepth: z.number().min(3).max(3).default(3).describe('3 levels: -1 (underground), 0 (surface), 1 (sky)'),
    roomSize: z.number().min(4).max(64).default(32).describe('Room size in voxels (32x32 default)'),
    seed: z.string().optional().describe('Seed for deterministic generation'),
    generationParams: z.record(z.string(), z.any()).optional(),
  }),
  // Output fields
  biomeMap: z.any().optional(),
  voxelGrid: z.any().optional(),
  terrainChunks: z.array(z.any()).optional(),
});

export type TerrainGenerationState = z.infer<typeof TerrainGenerationStateSchema>;

// Input schema for API
export const TerrainGenerationInputSchema = TerrainGenerationStateSchema.pick({
  roomId: true,
  structures: true,
  roads: true,
  worldHistory: true,
  settings: true,
});

export type TerrainGenerationInput = z.infer<typeof TerrainGenerationInputSchema>;

// Output schema for API
export const TerrainGenerationOutputSchema = TerrainGenerationStateSchema.pick({
  biomeMap: true,
  voxelGrid: true,
  terrainChunks: true,
});

export type TerrainGenerationOutput = z.infer<typeof TerrainGenerationOutputSchema>;
