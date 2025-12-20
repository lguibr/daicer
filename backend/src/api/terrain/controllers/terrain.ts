export default ({ strapi }) => ({
  async chunk(ctx) {
    const { roomId, chunkX, chunkY, chunkSize } = ctx.request.body;

    try {
      const data = await strapi
        .service('api::terrain.terrain')
        .generateChunk(roomId, parseInt(chunkX), parseInt(chunkY), parseInt(chunkSize));

      ctx.body = {
        success: true,
        data,
      };
    } catch (err) {
      ctx.body = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      if (err instanceof Error && err.message.includes('Invalid')) {
        ctx.status = 400;
      }
    }
  },

  async generate(ctx) {
    const { roomId } = ctx.request.body;

    try {
      // Changed to generateInitialMap which returns ChunkDTO[]
      const chunks = await strapi.service('api::terrain.terrain').generateInitialMap(roomId);

      ctx.body = {
        success: true,
        data: {
          chunks, // Return chunks directly
        },
      };
    } catch (err) {
      strapi.log.error('Terrain generate REST failed', err);
      ctx.body = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});
