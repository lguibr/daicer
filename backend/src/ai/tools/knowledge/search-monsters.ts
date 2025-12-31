import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const searchMonstersSchema = z.object({
  query: z.string().describe('The name or partial name of the monster to search for (e.g. "Dragon", "Goblin").'),
  type: z.string().optional().describe('Optional filter for monster type (e.g. "Beast", "Humanoid").'),
});

export const searchMonstersTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'search_monsters',
      description: 'Search for monsters/creatures in the database by name. Returns stats and details.',
      schema: searchMonstersSchema,
      outputSchema: z.string(), // Returns formatted markup
      func: async ({ query, type }, { strapi }) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {
          name: { $containsi: query },
        };
        if (type) {
          filters.type = { $containsi: type };
        }

        const monsters = await strapi.documents('api::monster.monster').findMany({
          filters,
          limit: 5,
        });

        if (!monsters || monsters.length === 0) {
          return `No monsters found matching "${query}".`;
        }

        return monsters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => {
            const stats = m.stats ? JSON.stringify(m.stats) : 'N/A';
            return `### ${m.name} (${m.size} ${m.type}, CR ${m.challenge_rating})\n- HP: ${m.hp}\n- AC: ${m.armor_class}\n- Speed: ${JSON.stringify(m.speed)}\n- Stats: ${stats}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
