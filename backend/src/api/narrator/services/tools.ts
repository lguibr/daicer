import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const moveSchema = z.object({
  entityId: z.string().describe('The ID of the character/entity to move'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

const inspectSchema = z.object({
  x: z.number(),
  y: z.number(),
  radius: z.number().default(5),
});

export const createGameTools = (strapi, roomId) => {
  return [
    // @ts-expect-error - Langchain tool typing mismatch
    new DynamicStructuredTool({
      name: 'move_entity',
      description: 'Moves an entity (player/npc) to a new coordinate. Returns success or failure.',
      schema: moveSchema,
      func: async ({ entityId, x, y, z }) => {
        const gameEventService = strapi.service('api::game-event.game-event');

        // 1. Get current state to find 'from' position
        const gameState = await gameEventService.getGameState(roomId);
        const currentPos = gameState.entities[entityId] || { x: 0, y: 0, z: 0 };

        // 2. Validate
        const result = await gameEventService.validateMove(roomId, currentPos, { x, y, z });

        if (result.valid) {
          // 3. Log event
          await gameEventService.logEvent(roomId, 'MOVE', {
            entityId,
            from: currentPos,
            to: { x, y, z },
          });
          return `Moved ${entityId} to ${x},${y},${z}.`;
        } else {
          return `Failed to move: ${result.reason}`;
        }
      },
    }),
    // @ts-expect-error - Langchain tool typing mismatch
    new DynamicStructuredTool({
      name: 'inspect_map',
      description: 'Inspects the terrain at a specific location.',
      schema: inspectSchema,
      func: async ({ x, y, radius }) => {
        const gameEventService = strapi.service('api::game-event.game-event');
        const description = await gameEventService.inspectTerrain(roomId, x, y, radius);
        return description;
      },
    }),
  ];
};
