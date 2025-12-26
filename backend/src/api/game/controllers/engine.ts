/**
 * Engine Controller
 * Direct access to deterministic game engine functions.
 */

export default ({ strapi }) => ({
  async spawn(ctx) {
    const { roomId, type, entityId, position } = ctx.request.body;

    if (!roomId || !type || !entityId || !position) {
      return ctx.badRequest('Missing required fields: roomId, type, entityId, position');
    }

    try {
      let result;
      if (type === 'monster') {
        result = await strapi.service('api::game.spawn-service').spawnMonster(roomId, entityId, position);
      } else if (type === 'character') {
        result = await strapi.service('api::game.spawn-service').spawnCharacter(roomId, entityId, position);
      } else {
        return ctx.badRequest('Invalid type. Must be "monster" or "character"');
      }

      // Broadcast Update
      const { streamManager } = await import('../../../utils/llm/stream-manager');

      // We need to fetch the room's UUID (roomId) for broadcasting,
      // but result.room usually just has ID/DocumentID if we didn't populate.
      // Let's safe fetch or use the one passed if we trust it?
      // Be safe:
      const room = await strapi.documents('api::room.room').findOne({ documentId: roomId });
      if (room) {
        // Broadcast generic entities update
        // We can just send the new entity
        streamManager.broadcast(room.roomId, 'entities:update', {
          entities: [
            {
              id: result.documentId,
              name: result.name,
              type: result.type,
              position: result.position,
              // ... map other useful props
              currentHp: result.currentHp,
              maxHp: result.maxHp,
            },
          ],
        });
      }

      ctx.body = result;
    } catch (err) {
      strapi.log.error('Spawn error:', err);
      ctx.badRequest('Spawn failed', { error: err.message });
    }
  },

  async execute(ctx) {
    const { roomId, actions } = ctx.request.body;
    const user = ctx.state.user; // If auth is used

    // Delegate to existing turn-processing logic
    // We might want to move that logic here eventually, but for now wrap it.
    try {
      const result = await strapi.service('api::game.turn-processing').executeDeterministicTurn(roomId, actions, user);
      ctx.body = result;
    } catch (err) {
      ctx.badRequest('Execution failed', { error: err.message });
    }
  },
});
