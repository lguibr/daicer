/**
 * Socket.io client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';
import type { Room, Player, Message, Creature } from '../types/shared';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  timestamp: number;
}

/**
 * Streaming message chunk
 */
export interface StreamingChunk {
  streamId: string;
  messageId: string;
  content: string;
  accumulated: string;
}

/**
 * Presence data
 */
export interface PresenceData {
  userId: string;
  userName: string;
  type: 'typing' | 'generating' | 'tool_executing' | 'idle';
  timestamp: number;
  metadata?: {
    toolName?: string;
    progress?: number;
    message?: string;
  };
}

/**
 * Socket event callbacks
 */
interface SocketEvents {
  onGameState?: (data: { room: Room; players: Player[]; messages: Message[]; creatures: Creature[] }) => void;
  onRoomUpdated?: (data: { type: string; userId: string; action?: string | null }) => void;
  onPlayerJoined?: (data: { userId: string }) => void;
  onPlayerLeft?: (data: { userId: string }) => void;
  onPlayerCreated?: (data: { player: Player }) => void;
  onPlayerReadyUpdated?: (data: { userId: string; isReady: boolean }) => void;
  onAllReady?: () => void;
  onPhaseChanged?: (data: { phase: string }) => void;
  onTurnProcessing?: () => void;
  onTurnComplete?: () => void;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
  onError?: (data: { message: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessageNew?: (message: Message) => void;
  // Streaming events
  onStreamStart?: (data: { streamId: string; messageId: string; sender: string; timestamp: number }) => void;
  onStreamChunk?: (data: { streamId: string; messageId: string; content: string; accumulated: string }) => void;
  onStreamEnd?: (data: { streamId: string; messageId: string; fullText: string; timestamp: number }) => void;
  onStreamError?: (data: { streamId: string; messageId?: string; error: string }) => void;
  onStreamAborted?: (data: { streamId: string; messageId: string }) => void;
  // Presence events
  onPresenceUpdate?: (data: { roomId: string; presence: PresenceData[] }) => void;

  // Unified LLM Stream
  onLLMStreamEvent?: (data: {
    streamId: string;
    roomId: string;
    type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'error' | 'done';
    content?: string;
    metadata?: Record<string, any>;
    timestamp: number;
  }) => void;
}

/**
 * Initialize socket connection
 * @param events - Event callbacks
 * @returns Socket instance
 */
export async function initSocket(
  events: SocketEvents = {}
): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (socket?.connected) {
    return socket;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to connect socket');
  }

  const token = await user.getIdToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Try WebSocket first
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    // Retry failed packets
    retries: 3,
    ackTimeout: 10000,
  });

  // Connection success
  socket.on('connect', () => {
    reconnectAttempts = 0;
    console.log('[Socket] Connected:', socket?.id);
    events.onConnect?.();
  });

  // Connection error
  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);

    if (socket?.active) {
      // Temporary failure, will auto-reconnect
      reconnectAttempts++;
      console.log(`[Socket] Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    } else {
      // Permanent failure (e.g., auth denied)
      console.error('[Socket] Connection denied:', error.message);
      events.onError?.({ message: error.message });
    }

    events.onError?.({ message: error.message });
  });

  // Disconnection
  socket.on('disconnect', (reason, details) => {
    console.warn('[Socket] Disconnected:', reason, details);

    if (socket?.active) {
      // Will auto-reconnect
      console.log('[Socket] Will attempt to reconnect');
    } else {
      // Manual reconnect needed
      console.warn('[Socket] Manual reconnect required');
    }

    events.onDisconnect?.();
  });

  // Reconnection success
  socket.io.on('reconnect', (attempt) => {
    reconnectAttempts = 0;
    console.log(`[Socket] Reconnected after ${attempt} attempts`);
  });

  // Reconnection attempt
  socket.io.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket] Reconnection attempt ${attempt}`);
  });

  // Reconnection failed
  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after max attempts');
    events.onError?.({ message: 'Failed to reconnect to server' });
  });

  // Ping/Pong for monitoring
  socket.io.on('ping', () => {
    console.debug('[Socket] Ping');
  });

  // Register event listeners
  if (events.onGameState) socket.on('game:state', events.onGameState);
  if (events.onRoomUpdated) socket.on('room:updated', events.onRoomUpdated);
  if (events.onPlayerJoined) socket.on('player:joined', events.onPlayerJoined);
  if (events.onPlayerLeft) socket.on('player:left', events.onPlayerLeft);
  if (events.onPlayerCreated) socket.on('player:created', events.onPlayerCreated);
  if (events.onPlayerReadyUpdated) socket.on('player:ready_updated', events.onPlayerReadyUpdated);
  if (events.onAllReady) socket.on('room:all_ready', events.onAllReady);
  if (events.onPhaseChanged) socket.on('room:phase_changed', events.onPhaseChanged);
  if (events.onTurnProcessing) socket.on('turn:processing', events.onTurnProcessing);
  if (events.onTurnComplete) socket.on('turn:complete', events.onTurnComplete);
  if (events.onToolCalls) socket.on('tool:calls', events.onToolCalls);
  if (events.onMessageNew) socket.on('message:new', events.onMessageNew);

  // Streaming events
  if (events.onStreamStart) socket.on('message:stream:start', events.onStreamStart);
  if (events.onStreamChunk) socket.on('message:stream:chunk', events.onStreamChunk);
  if (events.onStreamEnd) socket.on('message:stream:end', events.onStreamEnd);
  if (events.onStreamError) socket.on('message:stream:error', events.onStreamError);
  if (events.onStreamAborted) socket.on('message:stream:aborted', events.onStreamAborted);

  // Presence events
  if (events.onPresenceUpdate) socket.on('presence:update', events.onPresenceUpdate);

  // Unified LLM Stream
  if (events.onLLMStreamEvent) socket.on('llm:stream:event', events.onLLMStreamEvent);

  return socket;
}

/**
 * Get current socket instance
 * @returns Socket or null
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Join a room
 * @param roomId - Room ID
 */
export function joinRoom(roomId: string): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('room:join', { roomId });
}

/**
 * Leave current room
 */
export function leaveRoom(roomId: string): void {
  if (!socket || !socket.connected) return; // Safe no-op if not connected
  socket.emit('room:leave', { roomId });
}

/**
 * Set ready status
 * @param roomId - Room ID
 * @param ready - Ready state
 */
export function setReady(roomId: string, ready: boolean): void {
  if (!socket || !socket.connected) {
    console.error('❌ Socket not connected when trying to setReady', {
      socket: !!socket,
      connected: socket?.connected,
    });
    return;
  }
  console.log('✅ Emitting player:ready', { roomId, isReady: ready });
  socket.emit('player:ready', { roomId, isReady: ready });
}

/**
 * Submit player action
 * @param roomId - Room ID
 * @param action - Player action text
 */
export function submitAction(roomId: string, action: string): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('player:action', { roomId, action });
}

/**
 * Request turn processing
 * @param roomId - Room ID
 * @param language - Language code
 */
export function processTurn(roomId: string, language = 'en'): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('turn:process', { roomId, language });
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 * @returns Connection status
 */
export function isConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Send typing indicator
 * @param roomId - Room ID
 * @param userName - User name
 * @param isTyping - Typing state
 */
export function sendTypingIndicator(roomId: string, userName: string, isTyping: boolean): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('presence:typing', { roomId, userName, isTyping });
}

/**
 * Abort a streaming message
 * @param streamId - Stream ID to abort
 */
export function abortStream(streamId: string): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('message:stream:abort', { streamId });
}
