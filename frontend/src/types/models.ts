export enum GamePhase {
  LOBBY = 'lobby',
  CHARACTER_CREATION = 'character_creation',
  GAMEPLAY = 'gameplay',
  COMBAT = 'combat',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  isReady: boolean;
  role: 'dm' | 'player' | 'spectator';
  characterId?: string;
  character?: any; // To be refined if needed
  color?: string;
  action?: string | null;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  phase: GamePhase;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  content?: string; // Legacy compat
  timestamp: number;
  type?: 'text' | 'system' | 'narrative';
  metadata?: any;
}

export interface Creature {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  position: { x: number; y: number; z: number };
  type: 'monster' | 'npc';
}

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'monster' | 'object';
  name: string;
  position: { x: number; y: number; z: number };
  color: string;
  visionRadius: number;
}

export interface ChunkDTO {
  x: number;
  y: number;
  tiles: any[][][]; // Loose typing for now to avoid deep dependency chain
}

export type GridChunk = ChunkDTO;

// Other types often used
export interface WorldSettings {
  seed: string;
  // ... add more as discovered
}
