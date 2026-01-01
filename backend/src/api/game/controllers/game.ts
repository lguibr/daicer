/**
 * Game Controller
 */

import type { WorldSettings, Language } from '@daicer/engine';

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

  async searchEntities(ctx) {
    try {
      const { query } = ctx.request.query;

      if (!query || typeof query !== 'string') {
        return ctx.badRequest('Query parameter required');
      }

      // Parallel search
      const [monsters, characters] = await Promise.all([
        strapi.documents('api::monster.monster').findMany({
          filters: { name: { $contains: query } }, // Case insensitive usually handled by DB or $containsi if postgres
          fields: ['name', 'documentId'],
        }),
        strapi.documents('api::character.character').findMany({
          filters: { name: { $contains: query } },
          fields: ['name', 'documentId'],
        }),
      ]);

      // Normalize results
      const results = [
        ...((monsters as Array<{ documentId: string; name: string }>) || []).map((m) => ({
          id: m.documentId,
          name: m.name,
          type: 'monster',
        })),
        ...((characters as Array<{ documentId: string; name: string }>) || []).map((c) => ({
          id: c.documentId,
          name: c.name,
          type: 'character',
        })),
      ];

      return ctx.send(results);
    } catch (error) {
      strapi.log.error('searchEntities error:', error);
      return ctx.internalServerError('Failed to search entities');
    }
  },

  async processTurn(ctx) {
    try {
      const { roomId } = ctx.params; // or ctx.params.id depending on route config

      if (!roomId) return ctx.badRequest('Room ID required');

      // Robust Room Lookup
      const filters: Record<string, unknown>[] = [{ documentId: roomId }, { roomId: roomId }];
      if (!isNaN(Number(roomId))) {
        filters.push({ id: Number(roomId) });
      }

      // Fetch Room with necessary data
      const rooms = await strapi.documents('api::room.room').findMany({
        filters: { $or: filters },
        populate: ['players', 'players.character'], // Populate essential data
      });

      if (!rooms || rooms.length === 0) return ctx.notFound('Room not found');
      const room: Record<string, unknown> = rooms[0] as Record<string, unknown>;

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

      const result = await strapi.service('api::game.game').processTurn(
        roomId, // Pass roomId first
        room.worldDescription,
        messages || [],
        players,
        creatures,
        (room.settings as { language: Language })?.language || 'en',
        room.settings as WorldSettings,
        room.worldConditions as unknown[]
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

  async submitAction(ctx) {
    try {
      // route: /game/:roomId/action creates params.roomId
      const { roomId } = ctx.params;
      const { action, mode } = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');
      if (!action) return ctx.badRequest('Action required');

      const result = await strapi.service('api::game.game').submitAction(roomId, action, ctx.state.user, mode);

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('submitAction error:', error);
      return ctx.internalServerError('Failed to submit action');
    }
  },
  async executeEngineAction(ctx) {
    try {
      const { roomId, actions } = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');
      if (!actions || !Array.isArray(actions)) return ctx.badRequest('Actions array required');

      const result = await strapi.service('api::game.game').executeEngineAction(roomId, actions, ctx.state.user);

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('executeEngineAction error:', error);
      return ctx.internalServerError('Failed to execute engine action');
    }
  },

  async toggleReady(ctx) {
    try {
      const { roomId } = ctx.params;
      const { isReady } = ctx.request.body;

      if (!roomId) return ctx.badRequest('Room ID required');
      if (typeof isReady !== 'boolean') return ctx.badRequest('isReady boolean required');

      const result = await strapi
        .service('api::game.game')
        .togglePlayerReady(roomId, ctx.state.user.id || ctx.state.user.documentId, isReady);

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('toggleReady error:', error);
      return ctx.internalServerError('Failed to toggle ready state');
    }
  },
});
