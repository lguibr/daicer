import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { formatStrapiError, logStrapiError } from '../../../utils/error-handling';

const summonCharacterSchema = z.object({
  templateId: z
    .string()
    .describe('The documentId of the character template to summon (e.g. from search_characters if available, or list)'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export const summonCharacterTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'summon_character',
      description: 'Summons a character (NPC) instance into the world using a specific Character Template ID.',
      schema: summonCharacterSchema,
      outputSchema: z.string(),
      func: async ({ templateId, x, y, z }, { strapi, roomDocumentId }) => {
        const spawnService = strapi.service('api::game.spawn-service');

        // 1. Verify Template Existence
        const character = await strapi.documents('api::character.character').findOne({
          documentId: templateId,
        });

        if (!character) {
          return `Error: Character template with ID "${templateId}" not found.`;
        }

        // 2. Spawn Logic
        try {
          const instance = await spawnService.spawnCharacter(roomDocumentId, templateId, { x, y, z });

          // Broadcast update
          await strapi.service('api::game.game-broadcaster').broadcastRoomEntities(roomDocumentId);

          return `Successfully summoned "${instance.name}" (Instance: ${instance.documentId}) at ${x},${y},${z}.`;
        } catch (error) {
          // Standardized Validation Error Logging
          const errorMessage = formatStrapiError(error);
          logStrapiError(strapi.log, 'Tool:SummonCharacter', error);

          return `Failed to summon character: ${errorMessage}`;
        }
      },
    },
    context
  );
