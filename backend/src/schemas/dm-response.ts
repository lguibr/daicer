/**
 * Zod schemas for structured LLM responses
 */

import { z } from 'zod';

/**
 * Tool call result schema
 */
export const ToolCallSchema = z.object({
  tool: z.enum(['roll_dice', 'attribute_check', 'saving_throw', 'attack_roll', 'deal_damage']),
  params: z.record(z.string(), z.any()),
  result: z.any(),
});

/**
 * State change schema
 */
export const StateChangeSchema = z.object({
  type: z.enum(['hp_change', 'creature_spawn', 'item_gain', 'status_effect']),
  target: z.string().describe('Character or creature name'),
  value: z.any().describe('The change value'),
});

/**
 * DM response schema with structured output
 */
export const DMResponseSchema = z.object({
  narrative: z.string().describe('The DM narration in markdown format with rich formatting'),
  toolCalls: z.array(ToolCallSchema).optional().describe('Dice rolls and checks performed'),
  stateChanges: z.array(StateChangeSchema).optional().describe('Game state updates'),
});

export type DMResponse = z.infer<typeof DMResponseSchema>;
