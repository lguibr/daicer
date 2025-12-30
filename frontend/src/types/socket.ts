/**
 * Frontend Socket.IO TypeScript Event Types
 * Mirror of backend types for type-safe client
 */

import type { ChunkDTO as GridChunk, Entity, Room, Player, Message, Creature } from '@daicer/engine';
import type { RoomJoinPayload, TurnProcessPayload, PlayerActionPayload } from '@daicer/shared';

/**
 * Events received from server (matches backend ServerToClientEvents)
 */
export interface ServerToClientEvents {
  // Connection
  connect: () => void;
  disconnect: (reason: string) => void;

  // Game state
  'game:state': (data: { room: Room; players: Player[]; messages: Message[]; creatures: Creature[] }) => void;

  // Room
  'room:updated': (data: { type: string; userId: string; action?: string | null; players?: Player[] }) => void;
  'room:all_ready': (data: { roomId: string }) => void;
  'room:phase_changed': (data: { roomId: string; phase: string }) => void;

  // Player
  'player:joined': (data: { userId: string }) => void;
  'player:left': (data: { userId: string }) => void;
  'player:created': (data: { player: Player }) => void;
  'player:ready_updated': (data: { userId: string; isReady: boolean }) => void;

  // Turn
  'turn:processing': () => void;
  'turn:complete': () => void;

  // Tools
  'tool:calls': (toolCalls: any[]) => void;

  // Messages
  'message:new': (message: Message) => void;
  'game:start': (data: { room: Room; text: string; sender: string; timestamp: number }) => void;
  'message:stream:start': (data: { streamId: string; messageId: string; sender: string; timestamp: number }) => void;
  'message:stream:chunk': (data: { streamId: string; messageId: string; content: string; accumulated: string }) => void;
  'message:stream:end': (data: { streamId: string; messageId: string; fullText: string; timestamp: number }) => void;
  'message:stream:error': (data: { streamId: string; messageId?: string; error: string }) => void;
  'message:stream:aborted': (data: { streamId: string; messageId: string }) => void;

  // Unified LLM Stream
  'llm:stream:event': (data: {
    streamId: string;
    roomId: string;
    type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'error' | 'done';
    content?: string;
    metadata?: Record<string, any>;
    timestamp: number;
  }) => void;

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

  // Map View
  'map:view:result': (data: {
    roomId: string;
    center: { x: number; y: number; z: number };
    chunks: GridChunk[];
    entities: Entity[];
  }) => void;
  'map:view:error': (data: { error: string }) => void;

  // Errors
  error: (data: { message: string }) => void;
}

/**
 * Events sent to server (matches backend ClientToServerEvents)
 */
export interface ClientToServerEvents {
  // Room
  'room:join': (data: RoomJoinPayload) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:create': (data: { name: string; config?: any }, callback?: (error: Error | null, room?: Room) => void) => void;

  // Player
  'player:ready': (data: { roomId: string; isReady: boolean }) => void;
  'player:action': (data: PlayerActionPayload) => void;
  'player:move': (data: { roomId: string; position: { x: number; y: number; z: number } }) => void;

  // Game
  'game:start': (data: { roomId: string }) => void;
  'game:submit_turn': (data: { roomId: string; actions: any[] }) => void;
  'turn:process': (data: TurnProcessPayload) => void;

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

  // Map View
  'map:view:query': (data: {
    roomId: string;
    x: number;
    y: number;
    z: number;
    radius: number;
    viewMode?: 'player' | 'dm';
  }) => void;
}
