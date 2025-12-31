import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const searchClassesSchema = z.object({
  query: z.string().describe('The name of the class to search for.'),
});

export const searchClassesTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'search_classes',
      description: 'Search for classes and their features.',
      schema: searchClassesSchema,
      outputSchema: z.string(),
      func: async ({ query }, { strapi }) => {
        const classes = await strapi.documents('api::class.class').findMany({
          filters: { name: { $containsi: query } },
          limit: 5,
          populate: ['features'],
        });

        if (!classes || classes.length === 0) {
          return `No classes found matching "${query}".`;
        }

        return classes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => {
            return `### ${c.name} (Hit Die: ${c.hit_die})\n- Proficiencies: ${c.proficiencies}\n- Features: ${JSON.stringify(c.features)}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
