import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin('terrain-explorer').service('service').getWelcomeMessage();
  },

  async generateChunk(ctx) {
    const { roomId, chunkX, chunkY, chunkSize } = ctx.request.body;

    try {
      // Reuse the Core API Service to ensure single source of truth
      const data = await strapi
        .service('api::terrain.terrain')
        .generateChunk(roomId, parseInt(chunkX), parseInt(chunkY), parseInt(chunkSize || 16));

      ctx.body = {
        success: true,
        data,
      };
    } catch (err) {
      ctx.body = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});

export default controller;
