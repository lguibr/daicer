import type { Server as HttpServer } from 'http';
import type { Core } from '@strapi/strapi';

export interface StrapiWithServer extends Core.Strapi {
  server: Core.Strapi['server'] & {
    httpServer: HttpServer;
  };
}

export type { RoomJoinPayload, TurnProcessPayload, PlayerActionPayload, PlayerReadyPayload } from '@daicer/shared';

export interface SocketErrorPayload {
  message: string;
  code?: string;
}

export interface RoomWithPopulations {
  documentId: string;
  roomId: string;
  phase: string;
  world?: {
    name: string;
    description?: string;
  };
  config?: Record<string, unknown>; // Map generation config check schema
  exploredTiles?: string[]; // stored as json array or string? Schema says JSON. So simple array likely.
  messages?: Array<{
    documentId: string;
    content: string;
    senderName: string;
    senderType: 'dm' | 'player' | 'system';
    timestamp: string | number;
    recipient?: { documentId: string; id: string | number };
  }>;
  players?: Array<{
    id: string | number;
    documentId: string;
    user?: { documentId: string; id: string | number };
    character?: {
      baseStats: unknown;
      race: unknown;
      class: unknown;
    };
  }>;
  character_sheets?: Array<{
    documentId: string;
    name: string;
    type: string;
    position: unknown;
    stats: unknown;
    currentHp: number;
    maxHp: number;
  }>;
  worldConditions?: unknown[]; // or specific type if known
}
