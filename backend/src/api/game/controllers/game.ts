/**
 * Game Controller
 */

import { factories } from '@strapi/strapi';

export default ({ strapi }) => ({
  async generateWorld(ctx) {
    try {
      const { settings, language } = ctx.request.body;

      if (!settings) {
        return ctx.badRequest('Missing settings');
      }

      const worldDescription = await strapi.service('api::game.game').generateWorld(settings, language);

      return ctx.send({ worldDescription });
    } catch (error) {
      strapi.log.error('generateWorld error:', error);
      return ctx.internalServerError('Failed to generate world');
    }
  },

  async processTurn(ctx) {
    try {
      const { roomId } = ctx.params; // or ctx.params.id depending on route config

      if (!roomId) return ctx.badRequest('Room ID required');

      // Fetch Room
      const rooms = await strapi.documents('api::room.room').findMany({
        filters: { roomId: roomId },
        // populate: ['players', 'creatures'] // TODO: Verify relations if we store them in SQL or JSON
      });

      if (!rooms || rooms.length === 0) return ctx.notFound('Room not found');
      const room = rooms[0] as any;

      // We need "players", "messages", "creatures" to process turn
      // Currently Room schema has "players" as JSON.
      // But "messages" are usually sub-collection in Firestore.
      // In Strapi, do we have a Message content type?
      // Implementation Plan says: "Re-implement Room Management: Translate Firestore-based room management logic..."

      // If we haven't implemented Message storage yet, we can't fetch messages.
      // Assuming for MVP migration, we pass messages in body OR we implement Message content type later.
      // In Firestore, messages are a subcollection.
      // For now, let's assume the client sends the *context* or we just fetch from a Message content type (if we created one).
      // We didn't create a Message content type yet.
      // 'd better create one or accept messages in payload for stateless turn processing (simpler for now).
      // Backend `resolveTurn` fetches `getMessages(roomId)`.

      // I will accept messages in the body for now to enable stateless testing/migration without full DB schema yet.
      // Or I stub it.

      const { messages } = ctx.request.body; // Temporary: Client sends history?
      // Realistically, backend fetches it.
      // I'll leave a TODO.

      const players = room.players || []; // JSON field
      const creatures = []; // TODO: fetching creatures

      const result = await strapi
        .service('api::game.game')
        .processTurn(
          room.worldDescription,
          messages || [],
          players,
          creatures,
          room.settings?.language || 'en',
          room.settings,
          room.worldConditions
        );

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('processTurn error:', error);
      return ctx.internalServerError('Failed to process turn');
    }
  },

  async addCharacter(ctx) {
    try {
      const { roomId } = ctx.params;
      const characterData = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');
      if (!characterData) return ctx.badRequest('Character data required');

      // Call service to add character
      const result = await strapi.service('api::game.game').addCharacter(roomId, characterData, ctx.state.user);

      return ctx.send({ success: true, data: result });
    } catch (error) {
      strapi.log.error('addCharacter error:', error);
      return ctx.internalServerError('Failed to add character');
    }
  },

  async startGame(ctx) {
    try {
      const { roomId } = ctx.params;
      const { language } = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');

      const result = await strapi.service('api::game.game').startGame(roomId, language);

      return ctx.send({ success: true, data: result });
    } catch (error) {
      strapi.log.error('startGame error:', error);
      return ctx.internalServerError('Failed to start game');
    }
  },

  async getRoom(ctx) {
    try {
      const { roomId } = ctx.params;
      if (!roomId) return ctx.badRequest('Room ID required');

      const result = await strapi.service('api::game.game').getRoom(roomId);
      if (!result) return ctx.notFound('Room not found');

      return ctx.send({ success: true, data: result });
    } catch (error) {
      strapi.log.error('getRoom error:', error);
      return ctx.internalServerError('Failed to fetch room');
    }
  },
});
