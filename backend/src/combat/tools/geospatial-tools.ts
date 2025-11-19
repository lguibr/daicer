/**
 * Geospatial Tools
 * Map awareness and vision queries
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// TODO: Implement geospatial context queries with proper 2D map integration

/**
 * Tool: Query Geospatial Context
 */
export const queryGeospatialContextTool = tool(
  async () =>
    JSON.stringify({
      success: false,
      message: 'Geospatial queries not yet implemented',
    }),
  {
    name: 'query_geospatial_context',
    description:
      'Query map around character position - get biomes, features, structures, entities within radius (respects z-layer)',
    schema: z.object({
      characterName: z.string(),
      radius: z.number().int().positive().default(60),
      includeAbove: z.boolean().default(false),
      includeBelow: z.boolean().default(false),
    }),
  }
);
