import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const moveSchema = z.object({
  entityId: z.string().describe('The ID of the character/entity to move'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export const moveEntityTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'move_entity',
      description: 'Moves an entity (player/npc) to a new coordinate. Returns success or failure.',
      schema: moveSchema,
      outputSchema: z.string(), // Strict output: must return a string (observation)
      func: async ({ entityId, x, y, z }, { strapi, roomDocumentId }) => {
        const gameEventService = strapi.service('api::game-event.game-event');
        // 1. Get current state to find 'from' position
        const gameState = await gameEventService.getGameState(roomDocumentId);
        const currentPos = gameState.entities[entityId] || { x: 0, y: 0, z: 0 };

        // 2. Validate
        const result = await gameEventService.validateMove(roomDocumentId, currentPos, { x, y, z });
        if (result.valid) {
          // 3. Log event
          await gameEventService.logEvent(roomDocumentId, 'MOVE', {
            entityId,
            from: currentPos,
            to: { x, y, z },
          });
          return `Moved ${entityId} to ${x},${y},${z}.`;
        } else {
          return `Failed to move: ${result.reason}`;
        }
      },
    },
    context
  );
