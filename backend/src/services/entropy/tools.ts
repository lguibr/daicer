/**
 * Entropy System Tools for LLM Function Calling
 * Allows DM agent to query and manipulate world conditions
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import type { WorldCondition, RandomEvent } from './types';
import { randomEventsPool } from './engine';

/**
 * Query world conditions tool
 * Allows DM to read current world state
 */
export const queryWorldConditionsTool = new DynamicStructuredTool({
  name: 'query_world_conditions',
  description:
    'Query the current state of world conditions (e.g., Aetheric Tides, Political Climate). Use this to understand the dynamic state of the world when generating narrative.',
  schema: z.object({
    reason: z.string().describe('Why you are querying world conditions'),
  }),
  func: async ({ reason }: { reason: string }) => {
    logger.info(`[Entropy Tool] Querying world conditions: ${reason}`);
    // Note: Actual state is injected via tool context at runtime
    // This is a placeholder that will be replaced by the node
    return JSON.stringify({
      success: true,
      message: 'World conditions retrieved (state injected at runtime)',
      reason,
    });
  },
});

/**
 * Mutate world condition tool
 * Allows DM to manually change a world condition value
 */
export const mutateWorldConditionTool = new DynamicStructuredTool({
  name: 'mutate_world_condition',
  description:
    'Manually change the value of a world condition (e.g., shift Political Climate from Peaceful to Tense). Use this when narrative events should cause a world state change.',
  schema: z.object({
    conditionKey: z.string().describe('The key of the condition to change (e.g., "Political Climate")'),
    newValue: z.string().describe('The new value for this condition (e.g., "Tense")'),
    reason: z.string().describe('Narrative reason for this change'),
  }),
  func: async ({ conditionKey, newValue, reason }: { conditionKey: string; newValue: string; reason: string }) => {
    logger.info(`[Entropy Tool] Mutating condition: ${conditionKey} -> ${newValue} (${reason})`);
    return JSON.stringify({
      success: true,
      conditionKey,
      newValue,
      reason,
    });
  },
});

/**
 * Trigger entropy event tool
 * Allows DM to manually trigger a random event
 */
export const triggerEntropyEventTool = new DynamicStructuredTool({
  name: 'trigger_entropy_event',
  description:
    'Manually trigger a random world event (e.g., Ghostly Procession, Wild Magic Surge). Use this when the narrative calls for an unexpected occurrence.',
  schema: z.object({
    eventName: z
      .string()
      .optional()
      .describe('Optional: specific event name from the pool. If omitted, a random event is selected.'),
    reason: z.string().describe('Narrative reason for triggering this event'),
  }),
  func: async ({ eventName, reason }: { eventName?: string; reason: string }) => {
    logger.info(`[Entropy Tool] Triggering event: ${eventName || 'random'} (${reason})`);

    let selectedEvent;
    if (eventName) {
      selectedEvent = randomEventsPool.find((e) => e.name === eventName);
      if (!selectedEvent) {
        return JSON.stringify({
          success: false,
          error: `Event "${eventName}" not found in pool`,
        });
      }
    } else {
      // Random event
      selectedEvent = randomEventsPool[Math.floor(Math.random() * randomEventsPool.length)];
    }

    return JSON.stringify({
      success: true,
      event: selectedEvent,
      reason,
    });
  },
});

/**
 * Get all entropy tools
 */
export function getEntropyTools() {
  return [queryWorldConditionsTool, mutateWorldConditionTool, triggerEntropyEventTool];
}
