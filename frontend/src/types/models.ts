export enum GamePhase {
  Lobby = 'lobby',
  LOBBY = 'lobby',
  SETUP = 'setup',
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
  // New architecture relationships
  timeFrames?: TimeFrame[];
  currentTimeFrame?: TimeFrame;
  [key: string]: any;
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
export interface DMStyle {
  verbosity: number;
  detail: number;
  engagement: number;
  narrative: number;
  specialMode: string | null;
  customDirectives: string;
}

export interface WorldSettings {
  seed: string;
  worldType: string;
  worldSize: string;
  theme: string;
  setting: string;
  tone: string;
  worldBackground: string;
  dmStyle: DMStyle;
  dmSystemPrompt: string;
  playerCount: number;
  adventureLength: string;
  difficulty: string;
  startingLevel: number;
  attributePointBudget: number;
  language: string;
  // Advanced generation settings
  historyDepth?: number;
  eraCount?: number;
  structureDensity?: number;
  enableRoads?: boolean;
  roadQuality?: string;
  terrainComplexity?: number;
}

export interface TimeFrame {
  id: string;
  turnNumber: number;
  timestamp: string; // ISO string from Strapi
  gameState: {
    world: any; // generated world data
    entities: Entity[];
    settings: WorldSettings; // Snapshot of settings at this time
    mapConfig: any; // Snapshot of map config
  };
}
