/**
 * Stream Event Types for Graph Execution
 * Provides type-safe event emission during LangGraph execution
 */

import { z } from 'zod';

/**
 * World generation phase enum
 */
export const WorldGenPhase = z.enum([
  'init',
  'conditions',
  'history',
  'structures',
  'roads',
  'terrain',
  'chunks',
  'biomes',
  'wfc',
  'caverns',
  'bsp',
  'features',
  'lore',
  'complete',
]);

export type WorldGenPhase = z.infer<typeof WorldGenPhase>;

/**
 * Base stream event schema
 */
const BaseStreamEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  phase: WorldGenPhase.optional(),
});

/**
 * Phase start event
 */
export const PhaseStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('phase_start'),
  phase: WorldGenPhase,
  message: z.string().optional(),
});

/**
 * Phase complete event
 */
export const PhaseCompleteEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('phase_complete'),
  phase: WorldGenPhase,
  message: z.string().optional(),
});

/**
 * Period progress event (for history generation)
 */
export const PeriodProgressEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('period_progress'),
  periodNumber: z.number().int(),
  totalPeriods: z.number().int(),
  periodName: z.string().optional(),
  structuresAdded: z.number().int().optional(),
});

/**
 * Period text streaming events
 */
export const PeriodTextStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('period_text_start'),
  periodNumber: z.number().int(),
});

export const PeriodTextCompleteEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('period_text_complete'),
  periodNumber: z.number().int(),
  narrative: z.string(),
});

/**
 * Error event
 */
export const ErrorEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('error'),
  error: z.string(),
  retryCount: z.number().int(),
  phase: WorldGenPhase,
});

/**
 * Retry event
 */
export const RetryEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('retry'),
  phase: WorldGenPhase,
  attempt: z.number().int(),
  maxAttempts: z.number().int(),
});

/**
 * Structure placement event
 */
export const StructurePlacementEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('structure_placement'),
  totalStructures: z.number().int(),
});

/**
 * Road generation event
 */
export const RoadGenerationEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('road_generation'),
  totalRoads: z.number().int(),
});

/**
 * Terrain collapse event
 */
export const TerrainCollapseEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('terrain_collapse'),
  influences: z.number().int(),
});

/**
 * Chunk generation event
 */
export const ChunkGenerationEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('chunk_generation'),
  totalChunks: z.number().int(),
  cachedChunks: z.number().int().optional(),
});

/**
 * World lore chunk event
 */
export const WorldLoreChunkEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('world_lore_chunk'),
  content: z.string(),
  accumulated: z.string(),
});

/**
 * Generic progress event
 */
export const ProgressEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('progress'),
  message: z.string(),
  percentage: z.number().min(0).max(100).optional(),
});

/**
 * Union of all stream event types
 */
export const StreamEventSchema = z.discriminatedUnion('type', [
  PhaseStartEventSchema,
  PhaseCompleteEventSchema,
  PeriodProgressEventSchema,
  PeriodTextStartEventSchema,
  PeriodTextCompleteEventSchema,
  ErrorEventSchema,
  RetryEventSchema,
  StructurePlacementEventSchema,
  RoadGenerationEventSchema,
  TerrainCollapseEventSchema,
  ChunkGenerationEventSchema,
  WorldLoreChunkEventSchema,
  ProgressEventSchema,
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;
export type PhaseStartEvent = z.infer<typeof PhaseStartEventSchema>;
export type PhaseCompleteEvent = z.infer<typeof PhaseCompleteEventSchema>;
export type PeriodProgressEvent = z.infer<typeof PeriodProgressEventSchema>;
export type PeriodTextStartEvent = z.infer<typeof PeriodTextStartEventSchema>;
export type PeriodTextCompleteEvent = z.infer<typeof PeriodTextCompleteEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type RetryEvent = z.infer<typeof RetryEventSchema>;
export type StructurePlacementEvent = z.infer<typeof StructurePlacementEventSchema>;
export type RoadGenerationEvent = z.infer<typeof RoadGenerationEventSchema>;
export type TerrainCollapseEvent = z.infer<typeof TerrainCollapseEventSchema>;
export type ChunkGenerationEvent = z.infer<typeof ChunkGenerationEventSchema>;
export type WorldLoreChunkEvent = z.infer<typeof WorldLoreChunkEventSchema>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/**
 * Helper to create a stream event with automatic timestamp
 */
export function createStreamEvent<T extends StreamEvent>(event: Omit<T, 'timestamp'>): T {
  return {
    ...event,
    timestamp: Date.now(),
  } as T;
}
