/**
 * Tests for presence tracking handlers
 */

import type { Server, Socket } from 'socket.io';
import { handleTypingIndicator, setDMGenerating, clearUserPresence, getRoomPresence } from '../presence';

describe('Presence Handlers', () => {
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

    // Clear presence before each test
    clearUserPresence(mockUserId);
  });

  describe('handleTypingIndicator', () => {
    it('should update typing state when user starts typing', () => {
      const data = {
        roomId: mockRoomId,
        userName: 'Alice',
        isTyping: true,
      };

      handleTypingIndicator(mockIo as Server, mockSocket as Socket, mockUserId, data);

      const presence = getRoomPresence(mockRoomId);
      expect(presence.some((p) => p.userId === mockUserId && p.type === 'typing')).toBe(true);
    });

    it('should clear typing state when user stops typing', () => {
      // First start typing
      handleTypingIndicator(mockIo as Server, mockSocket as Socket, mockUserId, {
        roomId: mockRoomId,
        userName: 'Alice',
        isTyping: true,
      });

      // Then stop typing
      handleTypingIndicator(mockIo as Server, mockSocket as Socket, mockUserId, {
        roomId: mockRoomId,
        userName: 'Alice',
        isTyping: false,
      });

      const presence = getRoomPresence(mockRoomId);
      expect(presence.some((p) => p.userId === mockUserId)).toBe(false);
    });

    it('should handle missing fields', () => {
      const data = {
        roomId: '',
        userName: '',
        isTyping: true,
      };

      handleTypingIndicator(mockIo as Server, mockSocket as Socket, mockUserId, data);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: 'Room ID and user name required' })
      );
    });
  });

  describe('setDMGenerating', () => {
    it('should set DM generating status', () => {
      setDMGenerating(mockIo as Server, mockRoomId, true, 'Crafting response...');

      const presence = getRoomPresence(mockRoomId);
      expect(presence.some((p) => p.type === 'generating')).toBe(true);
    });

    it('should clear DM generating status', () => {
      setDMGenerating(mockIo as Server, mockRoomId, true);
      setDMGenerating(mockIo as Server, mockRoomId, false);

      const presence = getRoomPresence(mockRoomId);
      expect(presence.some((p) => p.type === 'generating')).toBe(false);
    });
  });

  describe('clearUserPresence', () => {
    it('should clear all presence for user', () => {
      handleTypingIndicator(mockIo as Server, mockSocket as Socket, mockUserId, {
        roomId: mockRoomId,
        userName: 'Alice',
        isTyping: true,
      });

      clearUserPresence(mockUserId);

      const presence = getRoomPresence(mockRoomId);
      expect(presence.some((p) => p.userId === mockUserId)).toBe(false);
    });
  });
});
