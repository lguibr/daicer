/**
 * Memory Tools
 * TODO: Re-implement semantic memory service
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Tool: Store Memory
 * TODO: Requires semantic-memory service implementation
 */
export const storeMemoryTool = tool(
  async () =>
    JSON.stringify({
      success: false,
      message: 'Memory storage not yet implemented',
    }),
  {
    name: 'store_memory',
    description: 'Store an important fact, event, or detail in semantic memory for future recall',
    schema: z.object({
      content: z.string().describe('The memory content to store'),
      memoryType: z.enum(['character', 'location', 'event', 'lore', 'quest']),
      source: z.string().optional().describe('Where this memory came from'),
      importance: z.number().min(0).max(1).default(0.5),
    }),
  }
);

/**
 * Tool: Recall Memory
 * TODO: Requires semantic-memory service implementation
 */
export const recallMemoryTool = tool(
  async () =>
    JSON.stringify({
      success: false,
      message: 'Memory recall not yet implemented',
    }),
  {
    name: 'recall_memory',
    description: 'Query semantic memory for relevant facts, events, character details, or locations',
    schema: z.object({
      query: z.string().describe('What to search for'),
      memoryType: z.enum(['character', 'location', 'event', 'lore', 'quest']).optional(),
      limit: z.number().int().positive().default(5),
    }),
  }
);
