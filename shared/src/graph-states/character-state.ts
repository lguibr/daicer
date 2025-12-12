/**
 * Character State Schema (Section 3: Character Setup)
 *
 * Purpose: Generate personalized character opening narratives and apply equipment bonuses
 * Graph: character_setup_graph (2 nodes)
 * Dependencies: Requires Section 1 output (worldHistory) and Section 2 output (worldDescription)
 * Pattern: Per-player invocation (not per-room)
 */

import { z } from 'zod';
// import { characterSheetSchema } from '../character/schema';

/**
 * Character State Schema
 * Per-player isolated state
 */
export const CharacterStateSchema = z.object({
  // === REQUIRED INPUT ===
  playerId: z.string().min(1, 'Player ID required'),
  roomId: z.string().min(1, 'Room ID required'),
  character: z.record(z.string(), z.any()).describe('Complete character sheet from player'),

  // === REQUIRED Dependencies from Section 1 & 2 ===
  worldHistory: z
    .string()
    .min(1, 'World history required from Section 1')
    .describe('Synthesized world history for context'),
  worldDescription: z
    .string()
    .min(1, 'World description required from Section 2')
    .describe('Final world lore for context'),

  // === OPTIONAL CONTEXT ===
  spawnPoint: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional()
    .describe('Character spawn coordinates'),

  // === OUTPUT GUARANTEES ===
  openingNarrative: z
    .string()
    .optional()
    .describe('Personalized character introduction (populated by character_openings_node)'),
});

export type CharacterState = z.infer<typeof CharacterStateSchema>;

/**
 * Input Schema (what API receives from frontend)
 * Enforces Section 1 & 2 dependencies must be present
 */
export const CharacterInputSchema = CharacterStateSchema.pick({
  playerId: true,
  roomId: true,
  character: true,
  worldHistory: true,
  worldDescription: true,
  spawnPoint: true,
}).required({
  playerId: true,
  roomId: true,
  character: true,
  worldHistory: true,
  worldDescription: true,
});

export type CharacterInput = z.infer<typeof CharacterInputSchema>;

/**
 * Output Schema (what API returns to frontend)
 */
export const CharacterOutputSchema = z.object({
  playerId: z.string().min(1),
  openingNarrative: z.string().min(1, 'Opening narrative must be generated'),
  character: z.record(z.string(), z.any()).describe('Complete character sheet from player'),
});

export type CharacterOutput = z.infer<typeof CharacterOutputSchema>;
