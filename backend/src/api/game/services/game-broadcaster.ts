import { streamManager } from '../../../utils/llm/stream-manager';

export default () => ({
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
});
