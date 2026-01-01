import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const searchSpellsSchema = z.object({
  query: z.string().describe('The name or partial name of the spell.'),
  level: z.number().optional().describe('Optional spell level filter.'),
});

export const searchSpellsTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'search_spells',
      description: 'Search for spells by name and level.',
      schema: searchSpellsSchema,
      outputSchema: z.string(),
      func: async ({ query, level }, { strapi }) => {
        const filters: Record<string, unknown> = {
          name: { $containsi: query },
        };
        if (level !== undefined) {
          filters.level = level;
        }

        const spells = await strapi.documents('api::spell.spell').findMany({
          filters,
          limit: 5,
        });

        if (!spells || spells.length === 0) {
          return `No spells found matching "${query}".`;
        }

        return spells
          .map((s) => {
            return `### ${s.name} (Level ${s.level} ${s.school})\n- Range: ${s.range}\n- Components: ${s.components}\n- Duration: ${s.duration}\n- Description: ${s.description}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
