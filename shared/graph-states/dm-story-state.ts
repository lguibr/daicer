/**
 * DM Story State Schema (Section 1: DM Personality, Scope & Story)
 *
 * Purpose: Generate world history, conditions, and narrative seed
 * Graph: dm_story_graph (4 nodes)
 * Dependencies: None (first section)
 */

import { z } from 'zod';
import { HistoricalPeriodSchema } from '../world/history-schema';
import { WorldConditionSchema } from '../world/condition-schema';

/**
 * DM Style subsection defining narrative preferences
 */
const DMStyleSchema = z.object({
  verbosity: z.number().int().min(0).max(6).describe('Narrative verbosity: 0=Whisper, 3=Storied, 6=Operatic'),
  detail: z.number().int().min(0).max(6).describe('Detail level: 0=Minimal, 3=Balanced, 6=Cinematic'),
  engagement: z.number().int().min(0).max(6).describe('Player engagement: 0=Observer, 3=Collaborator, 6=Immersive'),
  narrative: z.number().int().min(0).max(6).describe('Narrative control: 0=Player-driven, 3=Balanced, 6=Authored'),
  specialMode: z
    .enum(['Classic', 'Courtly', 'Grimdark', 'Corsair', 'Shakespearean', 'Noir', 'Storybook'])
    .nullable()
    .describe('DM performance mode'),
  customDirectives: z.string().optional().describe('Custom DM instructions'),
});

/**
 * DM Story State Schema
 * Isolated state for history and narrative seed generation
 */
export const DMStoryStateSchema = z.object({
  // === REQUIRED INPUT (from wizard) ===
  roomId: z.string().min(1, 'Room ID required'),
  streamId: z.string().optional().describe('Socket.IO stream ID for real-time updates'),
  language: z.enum(['en', 'es', 'pt-BR']).default('en'),

  settings: z.object({
    // Story Frame
    theme: z.string().min(1, 'Theme required').describe('World theme (e.g., "High Fantasy")'),
    tone: z.string().min(1, 'Tone required').describe('Narrative tone (e.g., "Heroic with gathering dusk")'),
    setting: z
      .string()
      .min(1, 'Setting required')
      .describe('Primary setting (e.g., "Verdant kingdoms crowned by ruined keeps")'),
    worldBackground: z.string().optional().describe('Additional lore and context'),
    worldType: z.enum(['terra', 'water', 'desert', 'ice', 'volcanic', 'forest', 'sky', 'underground']),

    // DM Personality
    dmStyle: DMStyleSchema,

    // Campaign Scope
    worldSize: z.enum(['intimate', 'small', 'medium', 'large', 'vast', 'mythic']),
    adventureLength: z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']),
    difficulty: z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']),

    // History Configuration
    historyDepth: z.number().int().min(0).max(2000).describe('Years of recorded history (0 = no history generation)'),
    eraCount: z.number().int().min(1).max(10).describe('Number of distinct historical eras'),
  }),

  // === INTERNAL STATE (managed by graph nodes) ===
  historyPeriods: z.array(HistoricalPeriodSchema).default([]).describe('Generated 50-year historical periods'),
  currentPeriod: z.number().int().default(0).describe('Current period being generated (0-indexed)'),
  totalPeriods: z.number().int().default(0).describe('Total periods to generate (calculated from historyDepth)'),

  // === OUTPUT GUARANTEES (populated by final nodes) ===
  worldHistory: z.string().optional().describe('Complete synthesized world history'),
  conditions: z.array(WorldConditionSchema).default([]).describe('5 world conditions'),
});

export type DMStoryState = z.infer<typeof DMStoryStateSchema>;

/**
 * Input Schema (what API receives from frontend)
 * Only includes required fields for graph invocation
 */
export const DMStoryInputSchema = DMStoryStateSchema.pick({
  roomId: true,
  streamId: true,
  language: true,
  settings: true,
});

export type DMStoryInput = z.infer<typeof DMStoryInputSchema>;

/**
 * Output Schema (what API returns to frontend)
 * Guarantees these fields will be populated
 */
export const DMStoryOutputSchema = z.object({
  roomId: z.string().min(1),
  worldHistory: z.string().min(1, 'World history must be generated'),
  conditions: z.array(WorldConditionSchema).min(1, 'Conditions must be generated'),
  historyPeriods: z.array(HistoricalPeriodSchema),
});

export type DMStoryOutput = z.infer<typeof DMStoryOutputSchema>;
