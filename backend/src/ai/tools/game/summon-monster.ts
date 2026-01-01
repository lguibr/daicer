import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { formatStrapiError, logStrapiError } from '../../../utils/error-handling';

const summonMonsterSchema = z.object({
  templateId: z.string().describe('The documentId of the monster template to summon (e.g. from search_monsters)'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export const summonMonsterTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'summon_monster',
      description: 'Summons a monster instance into the world using a specific Monster Template ID.',
      schema: summonMonsterSchema,
      outputSchema: z.string(),
      func: async ({ templateId, x, y, z }, { strapi, roomDocumentId }) => {
        const spawnService = strapi.service('api::game.spawn-service');

        // 1. Verify Template Existence
        const monster = await strapi.documents('api::monster.monster').findOne({
          documentId: templateId,
        });

        if (!monster) {
          return `Error: Monster template with ID "${templateId}" not found. Please use search_monsters to find the correct ID.`;
        }

        // 2. Spawn Logic
        try {
          const instance = await spawnService.spawnMonster(roomDocumentId, templateId, { x, y, z });

          // Broadcast update
          await strapi.service('api::game.game-broadcaster').broadcastRoomEntities(roomDocumentId);

          return `Successfully summoned "${instance.name}" (Instance: ${instance.documentId}) at ${x},${y},${z}.`;
        } catch (error) {
          // Standardized Validation Error Logging
          const errorMessage = formatStrapiError(error);
          logStrapiError(strapi.log, 'Tool:SummonMonster', error);

          return `Failed to summon monster: ${errorMessage}`;
        }
      },
    },
    context
  );
