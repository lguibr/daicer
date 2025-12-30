import { streamManager } from '../../../utils/llm/stream-manager';

export default ({ strapi }) => ({
  startProcessing(roomId: string) {
    streamManager.broadcast(roomId, 'turn:processing', { roomId });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastTurnComplete(roomId: string, documentId: string, turnPayload: any) {
    streamManager.broadcast(roomId, 'turn:complete', turnPayload);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'turn:complete', turnPayload);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastNewMessage(roomId: string, documentId: string, message: any) {
    streamManager.broadcast(roomId, 'message:new', message);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'message:new', message);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastGameUpdate(roomId: string, documentId: string, updatePayload: any) {
    streamManager.broadcast(roomId, 'game:update', updatePayload);
    if (documentId !== roomId) {
      streamManager.broadcast(documentId, 'game:update', updatePayload);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcastEntitiesUpdate(roomId: string, entities: any[]) {
    streamManager.broadcast(roomId, 'entities:update', { entities });
  },

  /**
   * Fetches all character sheets for a room, formats them, and broadcasts the update.
   * This ensures the frontend (Debug Map, etc.) is in sync with DB state.
   */
  async broadcastRoomEntities(roomDocumentId: string) {
    // strapi is available in closure scope from factory
    // But here export default () => ... passed in file view?
    // Wait, previous file view of game-broadcaster.ts showed `export default () => ({` !
    // It did NOT take strapi in the factory function arguments in the file view I saw (Step 1405).
    // line 3: export default () => ({
    // This implies it doesn't use 'strapi' instance, or relies on global?
    // Or it handles it via imports?
    // It imports streamManager directly.
    // I need 'strapi' to fetch documents.
    // I should check if I can add ({ strapi }) to the arguments.
    // Standard Strapi 5/4 service format: export default ({ strapi }) => ({ ... });

    // I will update the export to accept { strapi }.

    // Logic:
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomDocumentId,
      populate: ['character_sheets', 'character_sheets.position'],
    });

    if (!room) return;

    // Format
    const entities = (room.character_sheets || []).map((sheet: any) => ({
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
