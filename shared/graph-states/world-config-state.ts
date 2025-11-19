/**
 * World Config State Schema (Section 2: World Configuration)
 *
 * Purpose: Generate physical world (structures, roads, terrain, chunks)
 * Graph: world_config_graph (7 nodes)
 * Dependencies: Requires Section 1 output (historyPeriods, conditions, worldHistory)
 */

import { z } from 'zod';
import { StructureSchema } from '../world/structure-schema';
import { RoadSchema } from '../world/road-schema';
import { HistoricalPeriodSchema } from '../world/history-schema';
import { WorldConditionSchema } from '../world/condition-schema';

/**
 * World Config State Schema
 * Depends on Section 1 output (historyPeriods, conditions, worldHistory)
 */
export const WorldConfigStateSchema = z.object({
  // === REQUIRED INPUT ===
  roomId: z.string().min(1, 'Room ID required'),

  // From wizard
  settings: z.object({
    structureDensity: z.number().int().min(1).max(20).describe('Structure count multiplier'),
    structureTypes: z.array(z.string()).describe('Enabled types: settlements/ruins/dungeons/temples/fortresses/towers'),
    enableRoads: z.boolean().describe('Generate road network'),
    roadQuality: z
      .enum(['trail', 'path', 'road', 'highway'])
      .default('road')
      .describe('Quality level of generated roads'),
    terrainComplexity: z.number().int().min(1).max(5).describe('Wave Function Collapse algorithm complexity'),

    // NEW: Deterministic Generation Parameters
    seed: z.string().optional().describe('Master seed for deterministic generation'),
    generationParams: z
      .object({
        // Elevation
        elevationScale: z.number().optional(),
        elevationOctaves: z.number().optional(),
        elevationPersistence: z.number().optional(),
        // Moisture
        moistureScale: z.number().optional(),
        moistureOctaves: z.number().optional(),
        moisturePersistence: z.number().optional(),
        // Structures
        structureMinDistance: z.number().optional(),
        maxStructures: z.number().optional(),
        // Caves
        caveFillPercentage: z.number().optional(),
        caveIterations: z.number().optional(),
        // BSP
        bspSize: z.number().optional(),
        bspMinRoomSize: z.number().optional(),
        // Features
        featureMinDistance: z.number().optional(),
      })
      .optional()
      .describe('Fine-tuned generation parameters'),
  }),

  // === REQUIRED Dependencies from Section 1 ===
  historyPeriods: z
    .array(HistoricalPeriodSchema)
    .min(1, 'Section 1 must complete first')
    .describe('Required: history from Section 1'),
  conditions: z
    .array(WorldConditionSchema)
    .length(5, 'Exactly 5 conditions required')
    .describe('Required: 5 world conditions from Section 1'),
  worldHistory: z
    .string()
    .min(1, 'World history required from Section 1')
    .describe('Required: synthesized history from Section 1'),

  // === INTERNAL STATE ===
  structures: z.array(StructureSchema).default([]).describe('Placed structures with x,y coordinates'),
  roads: z.array(RoadSchema).default([]).describe('Generated road network'),
  terrainMap: z.any().optional().describe('Heightmap (Uint8Array) from WFC algorithm'),
  generatedChunks: z.array(z.any()).default([]).describe('Pre-generated 3x3 chunk grid'),
  gridState: z.any().optional().describe('Tactical grid state from grid_generation subgraph'),

  // === OUTPUT GUARANTEES ===
  worldDescription: z.string().optional().describe('Final world lore narrative (populated by generate_lore_node)'),
});

export type WorldConfigState = z.infer<typeof WorldConfigStateSchema>;

/**
 * Input Schema
 * Enforces Section 1 dependency fields must be present
 */
export const WorldConfigInputSchema = WorldConfigStateSchema.pick({
  roomId: true,
  settings: true,
  historyPeriods: true,
  conditions: true,
  worldHistory: true,
}).required({
  historyPeriods: true,
  conditions: true,
  worldHistory: true,
});

export type WorldConfigInput = z.infer<typeof WorldConfigInputSchema>;

/**
 * Output Schema
 */
export const WorldConfigOutputSchema = z.object({
  structures: z.array(StructureSchema),
  roads: z.array(RoadSchema),
  worldDescription: z.string().min(1, 'World description must be generated'),
  generatedChunks: z.array(z.any()),
  gridState: z.any().optional(),
  terrainMap: z.any().optional(),
});

export type WorldConfigOutput = z.infer<typeof WorldConfigOutputSchema>;
