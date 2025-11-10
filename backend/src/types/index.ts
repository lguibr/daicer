/**
 * Shared type definitions for the D20 AI backend
 */

export enum GamePhase {
  SETUP = 'SETUP',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  GAMEPLAY = 'GAMEPLAY',
}

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
  // Basic info
  name: string;
  race: string;
  characterClass: string;
  background: string;
  alignment: string;
  level: number;
  xp: number;

  // Core stats
  hp: number;
  maxHp: number;
  temporaryHp: number;
  hitDice: { total: number; current: number };
  deathSaves: { successes: number; failures: number };

  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  inspiration: boolean;

  // Attributes & skills
  attributes: Record<Attribute, number>;
  savingThrows: SavingThrows;
  skills: Record<string, number>;

  // Combat & equipment
  baseAttackBonus: number;
  attacks: Array<{ name: string; bonus: string; damageType: string }>;
  equipment: string;

  // Currency
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };

  // Character details
  proficienciesAndLanguages: string;
  features: string;

  // Appearance & personality
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
  };

  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };

  backstory: string;
  alliesAndOrganizations: string;
  treasure: string;

  // Spellcasting (all characters, empty for non-casters)
  spellcasting: {
    class: string;
    ability: string;
    saveDC: number;
    attackBonus: number;
    cantrips: string[];
    spellsKnown: string[];
    slots: { level: number; total: number; expended: number }[];
  };
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
  recipientId?: string; // For player-specific messages
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
 * Supported languages
 */
export type Language = 'en' | 'es' | 'pt-BR';

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
  startingLevel: number;
  attributePointBudget: number;
  language?: Language;
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
 * LLM provider options
 */
export type LLMProvider = 'gemini';
