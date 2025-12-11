/**
 * Entropy System Types
 * Defines world conditions and random events that evolve over time
 */

import * as z from 'zod';

// Import WorldConditionSchema from shared package
import { WorldConditionSchema, type WorldCondition } from '@daicer/shared/world/condition-schema';
export { WorldConditionSchema, type WorldCondition };

/**
 * Random Event Schema
 * Represents a one-time event that occurred in the world
 */
export const RandomEventSchema = z.object({
  type: z.literal('Random Event'),
  name: z.string(),
  description: z.string(),
  impact: z.string(),
  turnTriggered: z.number().int().min(0),
});

export type RandomEvent = z.infer<typeof RandomEventSchema>;

/**
 * Union type for entropy items
 */
export type EntropyItem = WorldCondition | RandomEvent;

/**
 * Turn Update Schema
 * Represents changes that occurred during entropy advancement
 */
export const TurnUpdateSchema = z.object({
  mutation: z
    .object({
      key: z.string(),
      newValue: z.string(),
      reason: z.string(),
    })
    .optional(),
  newEvent: z
    .object({
      name: z.string(),
      description: z.string(),
      impact: z.string(),
    })
    .optional(),
});

export type TurnUpdate = z.infer<typeof TurnUpdateSchema>;
