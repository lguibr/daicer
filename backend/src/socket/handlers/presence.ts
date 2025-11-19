/**
 * Presence tracking handlers
 * Manages typing indicators, LLM generation status, and tool execution progress
 */

import type { Server, Socket } from 'socket.io';
import { logger } from '@/utils/logger';

/**
 * Presence state types
 */
export enum PresenceType {
  TYPING = 'typing',
  GENERATING = 'generating',
  TOOL_EXECUTING = 'tool_executing',
  IDLE = 'idle',
}

/**
 * Presence data structure
 */
export interface PresenceData {
  userId: string;
  userName: string;
  type: PresenceType;
  timestamp: number;
  metadata?: {
    toolName?: string;
    progress?: number;
    message?: string;
  };
}

/**
 * Room presence state
 * Maps roomId -> userId -> PresenceData
 */
const roomPresence = new Map<string, Map<string, PresenceData>>();

/**
 * Get presence for a room
 */
export function getRoomPresence(roomId: string): PresenceData[] {
  const presence = roomPresence.get(roomId);
  return presence ? Array.from(presence.values()) : [];
}

/**
 * Update user presence in room
 */
export function updatePresence(
  roomId: string,
  userId: string,
  userName: string,
  type: PresenceType,
  metadata?: PresenceData['metadata']
): PresenceData {
  let roomUsers = roomPresence.get(roomId);

  if (!roomUsers) {
    roomUsers = new Map();
    roomPresence.set(roomId, roomUsers);
  }

  const presenceData: PresenceData = {
    userId,
    userName,
    type,
    timestamp: Date.now(),
    metadata,
  };

  roomUsers.set(userId, presenceData);

  logger.debug('[Presence] Updated', {
    roomId,
    userId,
    type,
    metadata,
  });

  return presenceData;
}

/**
 * Clear user presence in room
 */
export function clearPresence(roomId: string, userId: string): void {
  const roomUsers = roomPresence.get(roomId);

  if (roomUsers) {
    roomUsers.delete(userId);
    logger.debug('[Presence] Cleared', { roomId, userId });

    // Clean up empty room presence
    if (roomUsers.size === 0) {
      roomPresence.delete(roomId);
    }
  }
}

/**
 * Clear all presence for user across all rooms
 */
export function clearUserPresence(userId: string): void {
  let clearedCount = 0;

  for (const [roomId, roomUsers] of roomPresence.entries()) {
    if (roomUsers.has(userId)) {
      roomUsers.delete(userId);
      clearedCount += 1;

      // Clean up empty room presence
      if (roomUsers.size === 0) {
        roomPresence.delete(roomId);
      }
    }
  }

  if (clearedCount > 0) {
    logger.debug('[Presence] Cleared user from all rooms', {
      userId,
      roomCount: clearedCount,
    });
  }
}

/**
 * Auto-expire stale presence (> 30 seconds old)
 */
export function expireStalePresence(): void {
  const now = Date.now();
  const maxAge = 30000; // 30 seconds
  let expiredCount = 0;

  for (const [roomId, roomUsers] of roomPresence.entries()) {
    for (const [userId, presence] of roomUsers.entries()) {
      if (now - presence.timestamp > maxAge) {
        roomUsers.delete(userId);
        expiredCount += 1;
      }
    }

    // Clean up empty room presence
    if (roomUsers.size === 0) {
      roomPresence.delete(roomId);
    }
  }

  if (expiredCount > 0) {
    logger.debug('[Presence] Expired stale entries', { count: expiredCount });
  }
}

// Run expiration check every 10 seconds
setInterval(expireStalePresence, 10000);

/**
 * Handle typing indicator
 */
export function handleTypingIndicator(
  _io: Server,
  socket: Socket,
  userId: string,
  data: {
    roomId: string;
    userName: string;
    isTyping: boolean;
  }
): void {
  const { roomId, userName, isTyping } = data;

  if (!roomId || !userName) {
    socket.emit('error', { message: 'Room ID and user name required' });
    return;
  }

  if (isTyping) {
    updatePresence(roomId, userId, userName, PresenceType.TYPING);

    // Broadcast to room (except sender)
    socket.to(roomId).emit('presence:update', {
      roomId,
      presence: getRoomPresence(roomId),
    });
  } else {
    clearPresence(roomId, userId);

    // Broadcast to room (except sender)
    socket.to(roomId).emit('presence:update', {
      roomId,
      presence: getRoomPresence(roomId),
    });
  }
}

/**
 * Update DM generating status
 */
export function setDMGenerating(io: Server, roomId: string, isGenerating: boolean, message?: string): void {
  const dmUserId = 'dm-system';
  const dmUserName = 'DM';

  if (isGenerating) {
    updatePresence(roomId, dmUserId, dmUserName, PresenceType.GENERATING, {
      message: message || 'Crafting response...',
    });

    io.to(roomId).emit('presence:update', {
      roomId,
      presence: getRoomPresence(roomId),
    });
  } else {
    clearPresence(roomId, dmUserId);

    io.to(roomId).emit('presence:update', {
      roomId,
      presence: getRoomPresence(roomId),
    });
  }
}

/**
 * Update tool execution status
 */
export function setToolExecuting(
  io: Server,
  roomId: string,
  toolName: string,
  progress?: number,
  message?: string
): void {
  const dmUserId = 'dm-system';
  const dmUserName = 'DM';

  updatePresence(roomId, dmUserId, dmUserName, PresenceType.TOOL_EXECUTING, {
    toolName,
    progress,
    message: message || `Executing ${toolName}...`,
  });

  io.to(roomId).emit('presence:update', {
    roomId,
    presence: getRoomPresence(roomId),
  });
}

/**
 * Clear tool execution status
 */
export function clearToolExecuting(io: Server, roomId: string): void {
  const dmUserId = 'dm-system';

  clearPresence(roomId, dmUserId);

  io.to(roomId).emit('presence:update', {
    roomId,
    presence: getRoomPresence(roomId),
  });
}

/**
 * Handle presence heartbeat (keep-alive)
 */
export function handlePresenceHeartbeat(
  _socket: Socket,
  userId: string,
  data: {
    roomId: string;
    userName: string;
  }
): void {
  const { roomId, userName } = data;

  if (!roomId || !userName) {
    return;
  }

  // Refresh timestamp for existing presence
  const roomUsers = roomPresence.get(roomId);
  const existingPresence = roomUsers?.get(userId);

  if (existingPresence) {
    existingPresence.timestamp = Date.now();
  }
}

/**
 * Register presence event handlers
 */
export function registerPresenceHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on('presence:typing', (data) => handleTypingIndicator(io, socket, userId, data));
  socket.on('presence:heartbeat', (data) => handlePresenceHeartbeat(socket, userId, data));

  logger.debug('[Presence] Registered handlers for user', { userId, socketId: socket.id });
}
