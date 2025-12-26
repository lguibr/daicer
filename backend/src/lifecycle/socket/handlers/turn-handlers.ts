import { streamManager } from '../../../utils/llm/stream-manager';

export const handleTurnProcess =
  (strapi) =>
  async (socket, { roomId, language }) => {
    strapi.log.info(`[Socket] Processing turn for room ${roomId}`);
    try {
      streamManager.broadcast(roomId, 'turn:processing', { roomId });

      const rooms = await strapi.documents('api::room.room').findMany({
        filters: {
          $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
        },
        populate: [
          'players',
          'players.character',
          'players.character.baseStats',
          'players.character.race',
          'players.character.class',
          'messages',
        ],
      });

      if (!rooms || rooms.length === 0) {
        socket.emit('error', { message: 'Room not found during processing' });
        return;
      }
      const room = rooms[0];

      const messages = (room.messages || []).map((msg) => ({
        sender: msg.senderName,
        text: msg.content,
        timestamp: msg.timestamp,
      }));

      await strapi
        .service('api::game.game')
        .processTurn(
          roomId,
          room.worldDescription,
          messages,
          room.players || [],
          [],
          language || 'en',
          room.settings,
          room.worldConditions
        );

      streamManager.broadcast(roomId, 'turn:complete', { roomId });
    } catch (e) {
      strapi.log.error('Error processing turn via socket:', e);
      socket.emit('error', { message: 'Failed to process turn' });
      streamManager.broadcast(roomId, 'turn:complete', { roomId, error: true });
    }
  };

export const handlePlayerAction =
  (strapi) =>
  async (socket, { roomId, action }) => {
    strapi.log.info(`[Socket] Player action in room ${roomId}: ${action}`);
  };
