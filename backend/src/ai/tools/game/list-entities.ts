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
      func: async (_input, { strapi, roomDocumentId }) => {
        // Fetch all character sheets in the room
        const entities = await strapi.documents('api::entity-sheet.entity-sheet').findMany({
          filters: {
            room: { documentId: roomDocumentId },
          },
          populate: ['stats', 'position'], // Ensure position is loaded
          limit: 100, // Reasonable cap
        });

        if (!entities || entities.length === 0) {
          return 'No entities found in this room.';
        }

        const lines = entities.map((param) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sheet = param as any; // Cast to access fields
          const pos = sheet.position || { x: '?', y: '?', z: '?' };
          const hpStatus = `${sheet.currentHp}/${sheet.maxHp} HP`;
          return `- [${sheet.type?.toUpperCase()}] **${sheet.name}** (ID: ${sheet.documentId}) at (${pos.x}, ${pos.y}, ${pos.z}) | ${hpStatus}`;
        });

        return `Found ${entities.length} entities:\n${lines.join('\n')}`;
      },
    },
    context
  );
