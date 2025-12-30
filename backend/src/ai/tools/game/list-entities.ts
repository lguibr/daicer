import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

const listEntitiesSchema = z.object({});

export const listEntitiesTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'list_entities',
      description:
        'Lists all entities (players, monsters, NPCs) currently in the room with their positions and status.',
      schema: listEntitiesSchema,
      outputSchema: z.string(), // Returns a formatted string list
      func: async ({}, { strapi, roomDocumentId }) => {
        // Fetch all character sheets in the room
        const sheets = await strapi.documents('api::character-sheet.character-sheet').findMany({
          filters: {
            room: { documentId: roomDocumentId },
          },
          populate: ['stats', 'position'], // Ensure position is loaded
        });

        if (!sheets || sheets.length === 0) {
          return 'There are no entities in this room.';
        }

        const lines = sheets.map((param) => {
          const sheet = param as any; // Cast to access fields
          const pos = sheet.position || { x: '?', y: '?', z: '?' };
          const hpStatus = `${sheet.currentHp}/${sheet.maxHp} HP`;
          return `- [${sheet.type?.toUpperCase()}] **${sheet.name}** at (${pos.x}, ${pos.y}, ${pos.z}) | ${hpStatus}`;
        });

        return `Found ${sheets.length} entities:\n${lines.join('\n')}`;
      },
    },
    context
  );
