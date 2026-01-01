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
          populate: ['proficiencies'],
        });

        if (!classes || classes.length === 0) {
          return `No classes found matching "${query}".`;
        }

        return classes;
        return classes
          .map((c) => {
            const profs =
              (c as { proficiencies?: { name: string }[] }).proficiencies?.map((p) => p.name).join(', ') || 'None';
            // Features are not strictly related to Class in schema currently, omitting.
            return `### ${c.name} (Hit Die: ${c.hit_die})\n- Proficiencies: ${profs}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
