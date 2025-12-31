/**
 * Socket.io client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
// import { auth } from './firebase';
import type { Room, Player, Message, Creature } from '@daicer/engine';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
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
  onRoomUpdated?: (data: { type?: string; userId?: string; action?: string | null; players?: Player[] }) => void;
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
  onGameStart?: (data: { room: Room; text: string; sender: string; timestamp: number }) => void;
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
    metadata?: Record<string, unknown>;
    timestamp: number;
  }) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEntitiesUpdate?: (data: { entities: any[] }) => void;
}

/**
 * Initialize socket connection
 * @param events - Event callbacks
 * @returns Socket instance
 */
export async function initSocket(
  events: SocketEvents = {}
): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (!socket) {
    const token = localStorage.getItem('strapi_jwt');
    if (!token) {
      throw new Error('User must be authenticated to connect socket');
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try WebSocket first
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
      // Retry failed packets
      retries: 3,
      ackTimeout: 10000,
    });
  }

  // Register all provided event listeners (even if socket existed)
  registerSocketEvents(socket, events);

  // If already connected, trigger check
  if (socket.connected) {
    // We don't manually fire onConnect here because listeners might be duplicates if we aren't careful,
    // but the caller usually expects to be able to emit immediately if connected.
    // However, useStreamingSocket relies on onConnect to join room.
    // We should let the caller handle 'already connected' logic, or fire it.
    // Let's fire it for consistency with the 'new connection' path from the caller's perspective.
    events.onConnect?.();
  } else if (socket.disconnected) {
    socket.connect();
  }

  return socket;
}

/**
 * Helper to register events
 */
function registerSocketEvents(s: Socket<ServerToClientEvents, ClientToServerEvents>, events: SocketEvents) {
  if (events.onConnect) s.on('connect', events.onConnect);
  if (events.onError) s.on('connect_error', (err) => events.onError?.({ message: err.message }));
  if (events.onDisconnect) s.on('disconnect', events.onDisconnect);

  if (events.onGameState) s.on('game:state', events.onGameState);
  if (events.onRoomUpdated) s.on('room:updated', events.onRoomUpdated);
  if (events.onPlayerJoined) s.on('player:joined', events.onPlayerJoined);
  if (events.onPlayerLeft) s.on('player:left', events.onPlayerLeft);
  if (events.onPlayerCreated) s.on('player:created', events.onPlayerCreated);
  if (events.onPlayerReadyUpdated) s.on('player:ready_updated', events.onPlayerReadyUpdated);
  if (events.onAllReady) s.on('room:all_ready', events.onAllReady);
  if (events.onPhaseChanged) s.on('room:phase_changed', events.onPhaseChanged);
  if (events.onTurnProcessing) s.on('turn:processing', events.onTurnProcessing);
  if (events.onTurnComplete) s.on('turn:complete', events.onTurnComplete);
  if (events.onToolCalls) s.on('tool:calls', events.onToolCalls);
  if (events.onMessageNew) s.on('message:new', events.onMessageNew);
  if (events.onGameStart) s.on('game:start', events.onGameStart);

  // Streaming events
  if (events.onStreamStart) s.on('message:stream:start', events.onStreamStart);
  if (events.onStreamChunk) s.on('message:stream:chunk', events.onStreamChunk);
  if (events.onStreamEnd) s.on('message:stream:end', events.onStreamEnd);
  if (events.onStreamError) s.on('message:stream:error', events.onStreamError);
  if (events.onStreamAborted) s.on('message:stream:aborted', events.onStreamAborted);

  // Presence events
  if (events.onPresenceUpdate) s.on('presence:update', events.onPresenceUpdate);

  // Entities update (God Mode / Narrator)
  if (events.onEntitiesUpdate) s.on('entities:update', events.onEntitiesUpdate);

  // Unified LLM Stream
  if (events.onLLMStreamEvent) s.on('llm:stream:event', events.onLLMStreamEvent);

  return s;
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
export function joinRoom(roomId: string, userId?: string): void {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit('room:join', { roomId, userId });
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
  if (!socket) {
    console.error('❌ Socket not initialized when trying to setReady');
    return;
  }
  // Allow emitting even if disconnected - Socket.IO will buffer
  console.log('✅ Emitting player:ready', { roomId, isReady: ready });
  socket.emit('player:ready', { roomId, isReady: ready });
}

/**
 * Submit player action
 * @param roomId - Room ID
 * @param action - Player action text
 */
export function submitAction(roomId: string, action: string): void {
  if (!socket) {
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
  console.log('[Socket Service] processTurn called', {
    roomId,
    language,
    socketExists: !!socket,
    connected: socket?.connected,
    socketId: socket?.id,
  });
  if (!socket) {
    console.warn('[Socket Service] Socket is null, aborting processTurn');
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

/**
 * Update player position
 * @param roomId - Room ID
 * @param position - New position {x, y, z}
 */
export function movePlayer(roomId: string, position: { x: number; y: number; z: number }): void {
  if (!socket) return;
  // Allow emitting even if disconnected - Socket.IO will buffer
  socket.emit('player:move', { roomId, position });
}
