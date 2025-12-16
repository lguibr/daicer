import { z } from 'zod';

export const ToolCallSchema = z.object({
  tool: z.enum(['roll_dice', 'move_entity', 'apply_damage', 'deduct_resource']),
  args: z
    .array(z.union([z.string(), z.number()]))
    .describe('Arguments for the tool. Ensure types match tool expectation.'),
  reasoning: z.string().optional().describe('Why this tool is being called (e.g. "Goblin attacks Player")'),
});

export const DMTurnSchema = z.object({
  narrative: z.string().describe('The markdown descriptions of what happens in the turn. Be vivid and immersive.'),
  tool_calls: z.array(ToolCallSchema).describe('List of mechanical actions to execute sequentially.'),
  pacing_notes: z.string().optional().describe('Internal notes on pacing or tension for the next turn.'),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;
export type DMTurnOutput = z.infer<typeof DMTurnSchema>;
