/**
 * Socket.IO TypeScript Event Types
 * Defines all client-to-server and server-to-client events
 */

import type { Room, Player, Message, Creature, ToolCallEvent } from '@/types/index';
import type { PresenceData } from './handlers/presence';

/**
 * Events sent from server to client
 */
export interface ServerToClientEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;

  // Game state events - actual structure from handleJoinRoom
  'game:state': (data: { room: Room; players: Player[]; messages: Message[]; creatures: Creature[] }) => void;

  // Room events - actual structure from handlePlayerAction
  'room:updated': (data: { room: Room }) => void;
  'room:all_ready': (data: { roomId: string }) => void;
  'room:phase_changed': (data: { roomId: string; phase: string }) => void;

  // Player events - actual structures from handlers
  'player:joined': (data: { player: Player }) => void;
  'player:left': (data: { playerId: string }) => void;
  'player:created': (data: { player: Player }) => void;
  'player:ready_updated': (data: { userId: string; isReady: boolean }) => void;

  // Turn events - actual structures from handlers
  'turn:processing': () => void;
  'turn:complete': () => void;

  // Tool call events - actual structure from handlePlayerAction
  'tool:calls': (toolCalls: ToolCallEvent[]) => void;

  // Message events - actual structure from handlers
  'message:new': (message: Message) => void;
  'message:stream:start': (data: { streamId: string; messageId: string; sender: string; timestamp: number }) => void;
  'message:stream:chunk': (data: { streamId: string; messageId: string; content: string; accumulated: string }) => void;
  'message:stream:end': (data: { streamId: string; messageId: string; fullText: string; timestamp: number }) => void;
  'message:stream:error': (data: { streamId: string; messageId?: string; error: string }) => void;
  'message:stream:aborted': (data: { streamId: string; messageId: string }) => void;

  // Presence events
  'presence:update': (data: { roomId: string; presence: PresenceData[] }) => void;

  // World chunk events (NEW)
  'world:chunk:data': (data: {
    worldId: string;
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    tiles: Array<{
      x: number;
      y: number;
      z: number;
      biome: string;
      elevation: number;
    }>;
    biomes: string[];
  }) => void;
  'world:chunk:error': (data: { error: string; details?: string }) => void;
  'world:chunks:complete': (data: { worldId: string; count: number; failed?: number }) => void;

  // Error events
  error: (data: { message: string }) => void;
}

/**
 * Events sent from client to server
 */
export interface ClientToServerEvents {
  // Room events - actual structures from handlers.ts
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:create': (
    data: { name: string; config?: Record<string, unknown> },
    callback?: (error: Error | null, room?: Room) => void
  ) => void;

  // Player events - actual structures from handlers
  'player:ready': (data: { roomId: string; isReady: boolean }) => void;
  'player:action': (data: { roomId: string; action: string }) => void;

  // Game events - actual structures from handlers
  'game:start': (data: { roomId: string }) => void;
  'game:submit_turn': (data: { roomId: string; actions: Record<string, unknown>[] }) => void;
  'turn:process': (data: { roomId: string; language?: string }) => void;

  // Combat events
  'combat:action': (data: Record<string, unknown>) => void;
  'combat:restore': (data: Record<string, unknown>) => void;

  // Message events
  'message:send': (data: { roomId: string; content: string }) => void;
  'message:stream:abort': (data: { streamId: string }) => void;

  // Presence events  - actual structure from presence.ts
  'presence:update': (data: { roomId: string; status: string }) => void;
  'presence:typing': (data: { roomId: string; userName: string; isTyping: boolean }) => void;
  'presence:heartbeat': (data: { roomId: string; userName: string }) => void;

  // World chunk events (NEW)
  'world:chunk:request': (
    data: { worldId: string; chunkX: number; chunkY: number; chunkZ: number },
    callback?: (error: { error: string } | null) => void
  ) => void;
  'world:chunks:request': (
    data: {
      worldId: string;
      chunks: Array<{ chunkX: number; chunkY: number; chunkZ: number }>;
    },
    callback?: (error: { error: string } | null) => void
  ) => void;
}

/**
 * Events for inter-server communication
 */
export interface InterServerEvents {
  ping: () => void;
  'room:sync': (data: { roomId: string }) => void;
}

/**
 * Custom data stored on socket instance
 */
export interface SocketData {
  userId: string;
  username?: string;
  currentRoomId?: string;
}
