/**
 * World Condition Schema
 * Represents a dynamic aspect of the world (e.g., "Aetheric Tides", "Political Climate")
 */

import { z } from 'zod';

export const WorldConditionSchema = z.object({
  type: z.literal('World Condition'),
  key: z.string(),
  values: z.array(z.string()),
  currentValue: z.string(),
  description: z.string(),
  lastUpdatedTurn: z.number().int().min(0),
  ordered: z.boolean().optional(),
});

export type WorldCondition = z.infer<typeof WorldConditionSchema>;
