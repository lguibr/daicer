import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const inspectSchema = z.object({
  x: z.number(),
  y: z.number(),
  radius: z.number().default(5),
});

export const inspectMapTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'inspect_map',
      description: 'Inspects the terrain at a specific location using text description.',
      schema: inspectSchema,
      outputSchema: z.string(), // Strict output: text description
      func: async ({ x, y, radius }, { strapi, roomDocumentId }) => {
        const gameEventService = strapi.service('api::game-event.game-event');
        const description = await gameEventService.inspectTerrain(roomDocumentId, x, y, radius);
        return description;
      },
    },
    context
  );
