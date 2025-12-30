import { z } from 'zod';
import { createDaicerTool, StrapiContext } from '../tool-factory';

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
        const room = await strapi.documents('api::room.room').findOne({
          documentId: roomDocumentId,
          populate: ['character_sheets', 'creatures'],
        });

        if (!room) throw new Error('Room not found.');

        const chunkX = Math.floor(x / 32);
        const chunkY = Math.floor(y / 32);

        let chunk;
        const voxelService = strapi.service('api::voxel-engine.voxel-engine');
        if (voxelService && voxelService.getChunk) {
          const config = room.config || { seed: 'default' };
          chunk = await voxelService.getChunk(chunkX, chunkY, config);
        } else {
          throw new Error('Voxel Engine service unavailable.');
        }

        if (!chunk) throw new Error('Failed to load map chunk.');

        // Generate Buffer
        const imageBuffer = await generateMapImage(
          chunk,
          room.character_sheets || [],
          room.creatures || [],
          new Set(room.exploredTiles || []),
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
