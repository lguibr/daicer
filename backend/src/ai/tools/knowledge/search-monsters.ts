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
        const filters: Record<string, unknown> = {
          name: { $containsi: query },
        };
        if (type) {
          filters.type = { $containsi: type };
        }

          filters,
          populate: ['stats'],
        });

        if (!monsters || monsters.length === 0) {
          return `No monsters found matching "${query}".`;
        }

        return monsters
          .map((m) => {
            // Stats is mapped to component or json - need to verify schema. Assuming json "stats" attribute exists or individual fields.
            // contentTypes.d.ts will reveal. If "stats" is missing, we use explicit fields.
            const stats = `STR ${m.stats?.strength || 10} DEX ${m.stats?.dexterity || 10} CON ${m.stats?.constitution || 10} INT ${m.stats?.intelligence || 10} WIS ${m.stats?.wisdom || 10} CHA ${m.stats?.charisma || 10}`;

            return `### ${m.name} (${m.size} ${m.type}, CR ${m.challenge_rating})\n- HP: ${m.hp}\n- AC: ${m.ac}\n- Speed: ${JSON.stringify(m.speed)}\n- Stats: ${stats}\n`;
          })
          .join('\n---\n');
      },
    },
    context
  );
