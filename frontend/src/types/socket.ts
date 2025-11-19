/**
 * Frontend Socket.IO TypeScript Event Types
 * Mirror of backend types for type-safe client
 */

import type { Room, Player, Message, Creature } from './shared';

/**
 * Events received from server (matches backend ServerToClientEvents)
 */
export interface ServerToClientEvents {
  // Connection
  connect: () => void;
  disconnect: (reason: string) => void;

  // Game state - actual structure from backend
  'game:state': (data: { room: Room; players: Player[]; messages: Message[]; creatures: Creature[] }) => void;

  // Room - actual structure from backend
  'room:updated': (data: { type: string; userId: string; action?: string | null }) => void;
  'room:all_ready': (data: { roomId: string }) => void;
  'room:phase_changed': (data: { roomId: string; phase: string }) => void;

  // Player - actual structures from backend
  'player:joined': (data: { userId: string }) => void;
  'player:left': (data: { userId: string }) => void;
  'player:created': (data: { player: Player }) => void;
  'player:ready_updated': (data: { playerId: string; ready: boolean }) => void;

  // Turn - actual structures from backend
  'turn:processing': () => void;
  'turn:complete': () => void;

  // Tools - actual structure from backend
  'tool:calls': (toolCalls: any[]) => void;

  // Messages - actual structure from backend
  'message:new': (message: Message) => void;
  'message:stream:start': (data: { streamId: string; messageId: string; sender: string; timestamp: number }) => void;
  'message:stream:chunk': (data: { streamId: string; messageId: string; content: string; accumulated: string }) => void;
  'message:stream:end': (data: { streamId: string; messageId: string; fullText: string; timestamp: number }) => void;
  'message:stream:error': (data: { streamId: string; messageId?: string; error: string }) => void;
  'message:stream:aborted': (data: { streamId: string; messageId: string }) => void;

  // Presence
  'presence:update': (data: { roomId: string; presence: any[] }) => void;

  // World chunks
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

  // Errors
  error: (data: { message: string }) => void;
}

/**
 * Events sent to server (matches backend ClientToServerEvents)
 */
export interface ClientToServerEvents {
  // Room
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:create': (data: { name: string; config?: any }, callback?: (error: Error | null, room?: Room) => void) => void;

  // Player
  'player:ready': (data: { roomId: string; ready: boolean }) => void;
  'player:action': (data: { roomId: string; action: string }) => void;

  // Game
  'game:start': (data: { roomId: string }) => void;
  'game:submit_turn': (data: { roomId: string; actions: any[] }) => void;
  'turn:process': (data: { roomId: string; language?: string }) => void;

  // Combat
  'combat:action': (data: any) => void;
  'combat:restore': (data: any) => void;

  // Messages
  'message:send': (data: { roomId: string; content: string }) => void;
  'message:stream:abort': (data: { streamId: string }) => void;

  // Presence
  'presence:update': (data: { roomId: string; status: string }) => void;
  'presence:typing': (data: { roomId: string; userName: string; isTyping: boolean }) => void;
  'presence:heartbeat': (data: { roomId: string; userName: string }) => void;

  // World chunks
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
