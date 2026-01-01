import { streamManager } from '../../../utils/llm/stream-manager';
import { RoomWithPopulations, TurnProcessPayload } from '../../../lifecycle/socket/types';

export default ({ strapi }) => ({
  startProcessing(roomId: string) {
    streamManager.broadcast(roomId, 'turn:processing', { roomId });
  },

  broadcastTurnComplete(roomId: string, documentId: string, turnPayload: TurnProcessPayload) {
    streamManager.broadcast(roomId, 'turn:complete', turnPayload);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'turn:complete', turnPayload);
    }
  },

  broadcastNewMessage(roomId: string, documentId: string, message: unknown) {
    streamManager.broadcast(roomId, 'message:new', message);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'message:new', message);
    }
  },

  broadcastGameUpdate(roomId: string, documentId: string, updatePayload: unknown) {
    streamManager.broadcast(roomId, 'game:update', updatePayload);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'game:update', updatePayload);
    }
  },

  broadcastEntitiesUpdate(roomId: string, entities: unknown[]) {
    streamManager.broadcast(roomId, 'entities:update', { entities });
  },

  /**
   * Fetches all character sheets for a room, formats them, and broadcasts the update.
   * This ensures the frontend (Debug Map, etc.) is in sync with DB state.
   */
  async broadcastRoomEntities(roomDocumentId: string) {
    // Logic:
    const roomRaw = await strapi.documents('api::room.room').findOne({
      documentId: roomDocumentId,
      populate: ['character_sheets', 'character_sheets.position'],
    });

    if (!roomRaw) return;

    const room = roomRaw as unknown as RoomWithPopulations;

    // Format
    const entities = (room.character_sheets || []).map((sheet) => ({
      id: sheet.documentId,
      name: sheet.name,
      type: sheet.type || 'monster',
      position: sheet.position || { x: 0, y: 0, z: 0 },
      // Map other fields needed by DebugEntity in frontend
      speed: sheet.speed || 30,
      currentHp: sheet.currentHp,
      maxHp: sheet.maxHp,
    }));

    this.broadcastEntitiesUpdate(room.roomId || room.documentId, entities);
    // Also broadcast to documentId room just in case
    if (room.roomId && room.roomId !== room.documentId) {
      this.broadcastEntitiesUpdate(room.documentId, entities);
    }
  },
});
