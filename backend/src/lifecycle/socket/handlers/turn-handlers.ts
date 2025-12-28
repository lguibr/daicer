import { streamManager } from '../../../utils/llm/stream-manager';
import { StrapiWithServer, TurnProcessPayload, PlayerActionPayload } from '../types';

import { Socket } from 'socket.io';

export const handleTurnProcess =
  (strapi: StrapiWithServer) =>
  async (socket: Socket, { roomId, language }: TurnProcessPayload) => {
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
          'world',
        ],
      });

      if (!rooms || rooms.length === 0) {
        socket.emit('error', { message: 'Room not found during processing' });
        return;
      }
      const room = rooms[0];
      const world = room.world as Record<string, unknown> | null;

      const messages = (room.messages || []).map((msg) => ({
        sender: msg.senderName,
        text: msg.content,
        timestamp: msg.timestamp,
      }));

      // Safe access until schema is strict
      const worldConditions = (room as unknown as Record<string, unknown>).worldConditions || [];

      await strapi
        .service('api::game.game')
        .processTurn(
          roomId,
          (world?.description as string) || '',
          messages,
          room.players || [],
          [],
          language || 'en',
          world,
          worldConditions
        );

      streamManager.broadcast(roomId, 'turn:complete', { roomId });
    } catch (e) {
      strapi.log.error('Error processing turn via socket:', e);
      socket.emit('error', { message: 'Failed to process turn' });
      streamManager.broadcast(roomId, 'turn:complete', { roomId, error: true });
    }
  };

export const handlePlayerAction =
  (strapi: StrapiWithServer) =>
  async (socket: Socket, { roomId, action }: PlayerActionPayload) => {
    strapi.log.info(`[Socket] Player action in room ${roomId}: ${action}`);
  };
