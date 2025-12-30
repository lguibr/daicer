import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const searchRacesSchema = z.object({
  query: z.string().describe('The name of the race to search for.'),
});

export const searchRacesTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'search_races',
      description: 'Search for playable races and their traits.',
      schema: searchRacesSchema,
      outputSchema: z.string(),
      func: async ({ query }, { strapi }) => {
        const races = await strapi.documents('api::race.race').findMany({
          filters: { name: { $containsi: query } },
          limit: 5,
          populate: ['traits'],
        });

        if (!races || races.length === 0) {
          return `No races found matching "${query}".`;
        }

        return races
          .map((r: any) => {
            const traits = r.traits ? r.traits.map((t: any) => t.name).join(', ') : 'None';
            return `### ${r.name}\n- Speed: ${JSON.stringify(r.speed)}\n- Size: ${r.size}\n- Traits: ${traits}\n- Description: ${r.desc}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
