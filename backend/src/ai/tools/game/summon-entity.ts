import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const summonSchema = z.object({
  name: z.string().describe('The name of the creature or character to summon (e.g. "Orc", "Goblin")'),
  type: z
    .enum(['monster', 'character'])
    .optional()
    .describe('The type of entity to summon. If omitted, searches both.'),
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export const summonEntityTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'summon_entity',
      description: 'Summons a monster or character (NPC) into the world at a specific location.',
      schema: summonSchema,
      outputSchema: z.string(), // Strict output: result message
      func: async ({ name, type, x, y, z }, { strapi, roomDocumentId }) => {
        const spawnService = strapi.service('api::game.spawn-service');
        let monster, character;

        // Sanitize name (remove @ prefix if present)
        const cleanName = name.replace(/^@/, '').trim();

        // 1. Search Logic
        if (!type || type === 'monster') {
          const monsters = await strapi.documents('api::monster.monster').findMany({
            filters: { name: { $contains: cleanName } },
            limit: 1,
          });
          if (monsters.length > 0) monster = monsters[0];
        }

        if (!monster && (!type || type === 'character')) {
          const characters = await strapi.documents('api::character.character').findMany({
            filters: { name: { $contains: cleanName } },
            limit: 1,
          });
          if (characters.length > 0) character = characters[0];
        }

        // 2. Spawn Logic
        if (monster) {
          await spawnService.spawnMonster(roomDocumentId, monster.documentId, { x, y, z });
          return `Summoned monster "${monster.name}" at ${x},${y},${z}.`;
        } else if (character) {
          await spawnService.spawnCharacter(roomDocumentId, character.documentId, { x, y, z });
          return `Summoned character "${character.name}" at ${x},${y},${z}.`;
        } else {
          return `Could not find any monster or character named "${name}".`;
        }
      },
    },
    context
  );
