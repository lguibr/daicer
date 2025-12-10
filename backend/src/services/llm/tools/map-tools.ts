import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { mapService } from '@/services/map-service';
import { logger } from '@/utils/logger';

/**
 * Query Map Tool
 * allows the LLM to inspect the world grid
 */
export const queryMapTool = new DynamicStructuredTool({
  name: 'query_map',
  description: 'Query the map for terrain and features at specific coordinates',
  schema: z.object({
    roomId: z.string().describe('The room ID'),
    x: z.number().describe('X coordinate'),
    y: z.number().describe('Y coordinate'),
    radius: z.number().optional().describe('Search radius in tiles (default 1)'),
  }),
  func: async ({
    roomId,
    x,
    y,
    radius = 5,
  }: {
    roomId: string;
    x: number;
    y: number;
    radius?: number;
  }): Promise<string> => {
    try {
      logger.info(`[MapTool] Querying map at ${roomId} ${x},${y} r=${radius}`);

      const { chunkX, chunkY } = mapService.worldToChunkCoords(x, y);
      const chunk = await mapService.getChunk(roomId, chunkX, chunkY);

      if (!chunk) return 'No chunk found at these coordinates.';

      // Simple implementation: just return specific tile info
      // We manually map to avoid returning the massive GridChunk object which might confuse LLM or TS
      const results = chunk.tiles
        .filter((t) => Math.abs(t.x - x) <= (radius || 5) && Math.abs(t.y - y) <= (radius || 5))
        .map((t) => ({
          x: t.x,
          y: t.y,
          biome: t.biome,
          height: t.height,
          feature: 'none', // simplified
        }));

      return JSON.stringify({
        center: { x, y },
        tiles: results,
      });
    } catch (error) {
      logger.error('Error querying map', error);
      return 'Error querying map data';
    }
  },
});
