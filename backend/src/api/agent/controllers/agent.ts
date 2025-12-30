/**
 * Agent Controller
 */

export default ({ strapi }) => ({
  async executeTool(ctx) {
    try {
      const { roomId, toolName, payload } = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');
      if (!toolName) return ctx.badRequest('Tool Name required');
      if (!payload) return ctx.badRequest('Payload required');

      const result = await strapi.service('api::agent.agent').executeTool(roomId, toolName, payload, ctx.state.user);

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Agent executeTool error:', error);
      return ctx.internalServerError(error.message || 'Failed to execute tool');
    }
  },
});
