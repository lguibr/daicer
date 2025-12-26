/**
 * narrator controller
 */

export default {
  async handleAction(ctx) {
    const { roomId, input, mode } = ctx.request.body;

    if (!roomId || !input) {
      return ctx.badRequest('Missing roomId or input');
    }

    try {
      const result = await strapi.service('api::narrator.narrator').processAction({
        roomId,
        input,
        mode: mode || 'player',
        userId: ctx.state.user?.documentId,
      });

      ctx.body = result;
    } catch (err) {
      ctx.badRequest('Narrator Error', { error: err.message });
    }
  },
};
