/**
 * Shared type definitions for the D20 AI backend
 */

/**
 * Game phase enumeration
 */
export enum GamePhase {
  SETUP = 'SETUP',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  GAMEPLAY = 'GAMEPLAY',
}

/**
 * Character attributes
 */
export enum Attribute {
  STR = 'Strength',
  DEX = 'Dexterity',
  CON = 'Constitution',
  INT = 'Intelligence',
  WIS = 'Wisdom',
  CHA = 'Charisma',
}

/**
 * Character saving throws
 */
export interface SavingThrows {
  fortitude: number;
  reflex: number;
  will: number;
}

/**
 * Complete character sheet
 */
export interface CharacterSheet {
  name: string;
  race: string;
  characterClass: string;
  alignment: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  armorClass: number;
  initiative: number;
  baseAttackBonus: number;
  attributes: Record<Attribute, number>;
  savingThrows: SavingThrows;
  skills: Record<string, number>;
  equipment: string;
}

/**
 * Player in a game room
 */
export interface Player {
  id: string;
  userId: string;
  name: string;
  character: CharacterSheet;
  action: string | null;
  isReady: boolean;
  joinedAt: number;
}

/**
 * Game message (chat/DM narration)
 */
export interface Message {
  id: string;
  sender: 'DM' | string;
  text: string;
  images?: string[];
  timestamp: number;
  targetPlayer?: string;
}

/**
 * Adventure length options
 */
export type AdventureLength = 'short' | 'medium' | 'epic';

/**
 * Difficulty levels
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * World generation settings
 */
export interface WorldSettings {
  theme: string;
  setting: string;
  tone: string;
  playerCount: number;
  adventureLength: AdventureLength;
  difficulty: Difficulty;
}

/**
 * Creature/NPC in combat
 */
export interface Creature {
  name: string;
  hp: number;
  maxHp: number;
  attackBonus: number;
  damage: string;
}

/**
 * Game room state
 */
export interface Room {
  id: string;
  code: string;
  ownerId: string;
  settings: WorldSettings | null;
  worldDescription: string;
  phase: GamePhase;
  createdAt: number;
  updatedAt: number;
}

/**
 * User profile
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: number;
}

/**
 * Supported languages
 */
export type Language = 'en' | 'es' | 'pt-BR';

/**
 * LLM provider options
 */
export type LLMProvider = 'gemini' | 'openai' | 'anthropic';

