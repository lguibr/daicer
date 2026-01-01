import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';
import { RoomWithPopulations } from '../../../lifecycle/socket/types';

const mapImageSchema = z.object({
  x: z.number().describe('Center X coordinate'),
  y: z.number().describe('Center Y coordinate'),
  radius: z.number().default(16).describe('View radius'),
});

const mapImageOutput = z.object({
  type: z.literal('image'),
  base64: z.string(),
  description: z.string(),
});

export const getMapImageTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'get_map_image',
      description: 'Generates a visual map image (PNG) centered at the coordinates.',
      schema: mapImageSchema,
      outputSchema: mapImageOutput,
      func: async ({ x, y, radius }, { strapi, roomDocumentId }) => {
        // Dynamic import to avoid circular dependencies or massive builds if not needed
        // Assuming path relative to this file: ../../../api/game/services/map-visualization
        const { generateMapImage } = await import('../../../api/game/services/map-visualization');

        // Fetch Room Data
        // Fetch Room Data
        const roomRaw = await strapi.documents('api::room.room').findOne({
          documentId: roomDocumentId,
          populate: ['character_sheets'],
        });

        if (!roomRaw) throw new Error('Room not found.');

        // Cast to our known populated shape
        const room = roomRaw as unknown as RoomWithPopulations;

        const chunkX = Math.floor(x / 32);
        const chunkY = Math.floor(y / 32);

        let chunk;
        const voxelService = strapi.service('api::voxel-engine.voxel-engine') as unknown as {
          getChunk: (x: number, y: number, config: unknown) => Promise<unknown>;
        };

        if (voxelService && voxelService.getChunk) {
          const config = room.config || { seed: 'default' };
          chunk = await voxelService.getChunk(chunkX, chunkY, config);
        } else {
          throw new Error('Voxel Engine service unavailable.');
        }

        if (!chunk) throw new Error('Failed to load map chunk.');

        // Map sheets to creatures
        // Map sheets to creatures
        const creatures = (room.character_sheets || []).map((cs) => ({
          id: cs.documentId,
          name: cs.name,
          type: cs.type,
          position: cs.position,
          stats: cs.stats,
          // Map 'currentHp' to 'hp' as per Creature interface
          hp: cs.currentHp,
          maxHp: cs.maxHp,
          // Add missing Creature props if needed by generator
          ac: 10, // Default action: cs.ac || 10
        }));

        // Generate Buffer
        const imageBuffer = await generateMapImage(
          chunk,
          [], // Players - needed? Room players not fully mapped here yet.
          creatures,
          new Set((room.exploredTiles as unknown as string[]) || []),
          { x, y }
        );

        const base64 = imageBuffer.toString('base64');

        return {
          type: 'image',
          base64: base64,
          description: `Map image generated at ${x},${y} with radius ${radius}.`,
        };
      },
    },
    context
  );
