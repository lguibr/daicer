import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const moveSchema = z.object({
  entityId: z
    .string()
    .describe('The Instance ID (Character Sheet ID) of the entity in the room to move. DO NOT use template IDs.'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export const moveEntityTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'move_entity',
      description: 'Moves an instantiated entity (player/npc/monster) to a new coordinate within the room.',
      schema: moveSchema,
      outputSchema: z.string(),
      func: async ({ entityId, x, y, z }, { strapi, roomDocumentId }) => {
        const gameEventService = strapi.service('api::game-event.game-event');

        // Wrap in Try-Catch for safety
        try {
          // 1. Get current state to verify entity exists in room
          const gameState = await gameEventService.getGameState(roomDocumentId);

          // Check if entity is in the state
          if (!gameState.entities[entityId]) {
            strapi.log.warn(`[Tool:MoveEntity] Entity ${entityId} not found in state for room ${roomDocumentId}`);
            strapi.log.warn(`[Tool:MoveEntity] Available IDs: ${Object.keys(gameState.entities).join(', ')}`);
            return `Error: Entity "${entityId}" not found active in this room. Make sure you are using the Instance ID.`;
          }

          const currentPos = gameState.entities[entityId];

          // 2. Validate
          const result = await gameEventService.validateMove(roomDocumentId, currentPos, { x, y, z });
          if (result.valid) {
            // 3. Update DB State (Persistence)
            await strapi.documents('api::entity-sheet.entity-sheet').update({
              documentId: entityId,
              data: {
                position: { x, y, z },
              },
            });

            // 4. Log event (History)
            await gameEventService.logEvent(roomDocumentId, 'MOVE', {
              entityId,
              from: currentPos,
              to: { x, y, z },
            });

            // 5. Broadcast Update
            await strapi.service('api::game.game-broadcaster').broadcastRoomEntities(roomDocumentId);

            return `Moved entity ${entityId} to ${x},${y},${z}.`;
          } else {
            strapi.log.warn(`[Tool:MoveEntity] Validation Failed: ${result.reason}`);
            return `Failed to move: ${result.reason}`;
          }
        } catch (error) {
          strapi.log.error(`[Tool:MoveEntity] Critical Error:`, error);
          return `Internal Error moving entity: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    },
    context
  );
