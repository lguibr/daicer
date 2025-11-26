import { DynamicStructuredTool } from 'langchain';
import { z } from 'zod';
import { mapService } from '@/services/map-service';
import { logger } from '@/utils/logger';
import { CHUNK_SIZE } from '@daicer/shared/world';

/**
 * Query Map Tool
 * Allows the LLM to ask questions about the terrain at a specific location
 */
export const queryMapTool = new DynamicStructuredTool({
  name: 'query_map',
  description: 'Get a description of the terrain at a specific location (x, y). Useful for describing the environment.',
  schema: z.object({
    roomId: z.string(),
    x: z.number().describe('World X coordinate'),
    y: z.number().describe('World Y coordinate'),
    radius: z.number().default(5).describe('Radius in tiles to describe'),
  }),
  func: async ({ roomId, x, y, radius }) => {
    try {
      // Calculate chunks needed
      const minX = x - radius;
      const maxX = x + radius;
      const minY = y - radius;
      const maxY = y + radius;

      // Simple implementation: just get the center chunk for now to avoid complexity
      // In a real implementation, we'd fetch all overlapping chunks
      const chunkX = Math.floor(x / CHUNK_SIZE);
      const chunkY = Math.floor(y / CHUNK_SIZE);

      const chunk = await mapService.getChunk(roomId, chunkX, chunkY);

      // Find the specific tile
      const localX = Math.abs(x % CHUNK_SIZE);
      const localY = Math.abs(y % CHUNK_SIZE);
      const tile = chunk.tiles.find((t) => t.x === x && t.y === y);

      if (!tile) {
        return `Location (${x}, ${y}) is uncharted void.`;
      }

      return JSON.stringify({
        location: { x, y },
        biome: tile.biome,
        blockType: tile.blockType,
        elevation: tile.elevation,
        description: `You are in a ${tile.biome} area. The ground is ${tile.blockType}.`,
      });
    } catch (error) {
      logger.error('Error querying map:', error);
      return `Failed to query map: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Move Entity Tool
 * Allows the LLM to move an entity (PC or NPC)
 */
export const moveEntityTool = new DynamicStructuredTool({
  name: 'move_entity',
  description: 'Move a character or creature to a new location.',
  schema: z.object({
    roomId: z.string(),
    entityId: z.string(),
    targetX: z.number(),
    targetY: z.number(),
  }),
  func: async ({ roomId, entityId, targetX, targetY }) => {
    try {
      const entity = await mapService.moveEntity(roomId, entityId, targetX, targetY);
      return JSON.stringify({
        success: true,
        message: `Entity ${entityId} moved to (${targetX}, ${targetY}).`,
        newPosition: { x: targetX, y: targetY },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to move entity: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});

/**
 * Scan Surroundings Tool
 * Gets a list of entities and terrain features nearby
 */
export const scanSurroundingsTool = new DynamicStructuredTool({
  name: 'scan_surroundings',
  description: 'Scan the immediate area for entities (characters, creatures) and terrain features.',
  schema: z.object({
    roomId: z.string(),
    x: z.number(),
    y: z.number(),
    radius: z.number().default(10),
  }),
  func: async ({ roomId, x, y, radius }) => {
    try {
      const entities = await mapService.getEntitiesInArea(roomId, x - radius, y - radius, x + radius, y + radius);

      return JSON.stringify({
        center: { x, y },
        radius,
        entities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          position: { x: e.x, y: e.y },
        })),
        // TODO: Add terrain features summary
      });
    } catch (error) {
      return `Failed to scan surroundings: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

export function getMapTools() {
  return [queryMapTool, moveEntityTool, scanSurroundingsTool];
}
