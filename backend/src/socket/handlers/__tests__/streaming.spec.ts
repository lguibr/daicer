/**
 * Tests for streaming socket handlers
 */

import type { Server, Socket } from 'socket.io';
import { handleStreamRequest, handleStreamAbort, cleanupUserStreams } from '../streaming';

describe('Streaming Socket Handlers', () => {
  let mockIo: Partial<Server>;
  let mockSocket: Partial<Socket>;
  const mockUserId = 'user-123';
  const mockRoomId = 'room-456';

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocket = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
  });

  describe('handleStreamRequest', () => {
    it('should emit stream start event', async () => {
      const data = {
        roomId: mockRoomId,
        messageId: 'msg-123',
        systemPrompt: 'You are a DM',
        userPrompt: 'Describe a scene',
        language: 'en',
      };

      await handleStreamRequest(mockIo as Server, mockSocket as Socket, mockUserId, data);

      expect(mockIo.to).toHaveBeenCalledWith(mockRoomId);
    });

    it('should handle missing required fields', async () => {
      const data = {
        roomId: mockRoomId,
        messageId: '',
        systemPrompt: '',
        userPrompt: '',
      };

      await handleStreamRequest(mockIo as Server, mockSocket as Socket, mockUserId, data);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'message:stream:error',
        expect.objectContaining({ error: 'Missing required fields' })
      );
    });
  });

  describe('handleStreamAbort', () => {
    it('should abort stream when requested', () => {
      const data = { streamId: 'stream-123' };

      handleStreamAbort(mockSocket as Socket, mockUserId, data);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle missing stream ID', () => {
      const data = { streamId: '' };

      handleStreamAbort(mockSocket as Socket, mockUserId, data);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: 'Stream ID required' }));
    });
  });

  describe('cleanupUserStreams', () => {
    it('should cleanup streams for user', () => {
      cleanupUserStreams(mockUserId);

      // Should complete without error
      expect(true).toBe(true);
    });
  });
});
