export default {
  async previewWorld(ctx) {
    const { x, y, config } = ctx.request.body;

    if (!config) {
      return ctx.badRequest('Missing config');
    }

    try {
      const service = strapi.service('api::voxel-engine.voxel-engine');
      const chunk = await service.getChunk(x || 0, y || 0, config);
      ctx.body = chunk;
    } catch (err) {
      ctx.internalServerError('Failed to generate chunk', err);
    }
  },
};
