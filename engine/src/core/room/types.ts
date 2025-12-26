/**
 * Room and game session types
 */

export enum GamePhase {
  SETUP = 'SETUP',
  TERRAIN_GENERATION = 'TERRAIN_GENERATION',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  GAMEPLAY = 'GAMEPLAY',
  COMBAT = 'COMBAT',
}

export type ScaleLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AdventureLength = 'flash' | 'short' | 'medium' | 'long' | 'epic' | 'legendary';
export type Difficulty = 'storyteller' | 'easy' | 'medium' | 'challenging' | 'gritty' | 'deadly';
export type Language = 'en' | 'es' | 'pt-BR';
export type WorldType = 'terra' | 'water' | 'desert' | 'ice' | 'volcanic' | 'forest' | 'sky' | 'underground' | 'custom';
export type WorldSize = 'intimate' | 'small' | 'medium' | 'large' | 'vast' | 'epic';
export type DMPerformanceMode = 'pirate' | 'shakespearean' | 'noir' | 'courtly' | 'grimdark' | 'storybook';

export interface DMStyle {
  verbosity: ScaleLevel;
  detail: ScaleLevel;
  engagement: ScaleLevel;
  narrative: ScaleLevel;
  specialMode?: DMPerformanceMode | null;
  customDirectives: string;
}

export interface WorldSettings {
  worldType: WorldType;
  worldSize: WorldSize;
  theme: string;
  setting: string;
  tone: string;
  worldBackground: string;
  dmStyle: DMStyle;
  dmSystemPrompt: string;
  playerCount: number;
  adventureLength: AdventureLength;
  difficulty: Difficulty;
  startingLevel: number;
  attributePointBudget: number;
  language: Language;
  historyDepth?: number;
  eraCount?: number;
  structureDensity?: number;
  structureTypes?: string[];
  enableRoads?: boolean;
  roadQuality?: string;
  terrainComplexity?: number;
  seed?: string;
  generationParams?: Record<string, any>;
}

export interface TurnAction {
  playerId: string | number;
  characterId: string | number;
  type: 'action' | 'movement' | 'bonus' | 'free';
  intent: string;
  metadata?: any;
  timestamp: number;
}

export interface TurnData {
  phase: 'idle' | 'waiting_for_actions' | 'processing';
  startTime: number;
  actions: TurnAction[];
}

export interface MapConfig {
  seed: string;
  gridEnabled: boolean;
  biomeBias?: Record<string, number>;
  globalWaterLevel?: number; // -1 to 1
  globalTemperature?: number; // -1 to 1
  renderSettings?: {
    showGrid: boolean;
    showCoordinates: boolean;
    fogOfWar: boolean;
  };
}

export interface Room {
  documentId: string; // Strapi ID (v5)
  roomId: string; // Public Room ID / Code (if distinct) or alias
  id: string;
  code: string;
  owner?: {
    documentId: string;
    username: string;
    email: string;
  };
  ownerId?: string;
  settings: WorldSettings | null;
  mapConfig?: MapConfig; // Centralized map configuration
  worldDescription: string;
  worldHistory?: any;
  structures?: any[];
  roads?: any[];
  worldConditions?: any[];
  phase: GamePhase;
  turnData?: TurnData;
  character_sheets?: any[]; // Populated from Strapi
  terrainData?: any; // Deprecated: Moving to grid_chunks collection
  characterCreationLocked?: boolean; // Owner must unlock before players can create characters
  generationEvents?: any[]; // Captured SSE events from world generation for review
  createdAt: number;
  updatedAt: number;
  isActive?: boolean;
}

export interface RoomMembership {
  room: Room;
  roomId?: string;
  isOwner: boolean;
  player: any; // Will be Player from player module
  updatedAt?: number;
}
