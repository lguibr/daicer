/**
 * Shared type definitions for the D20 AI backend
 */

import type { AvatarAssetResponse } from '@/types/assets';

export enum GamePhase {
  SETUP = 'SETUP',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  GAMEPLAY = 'GAMEPLAY',
  COMBAT = 'COMBAT',
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
export type SkillProficiency = 'none' | 'trained' | 'proficient' | 'expertise';

export interface SkillDetail {
  name: string;
  ability: Attribute;
  modifier: number;
  proficiency: SkillProficiency;
  notes?: string;
}

export interface Talent {
  name: string;
  category: 'class' | 'racial' | 'background' | 'custom';
  description: string;
}

export interface BackgroundDetails {
  origin: string;
  upbringing: string;
  motivation: string;
  keyEvents: string[];
  allies?: string[];
}

export interface ResourcePool {
  name: string;
  current: number;
  max: number;
  refresh: 'at-will' | 'encounter' | 'short-rest' | 'long-rest' | 'daily' | 'custom';
  description?: string;
}

export interface AdvancementPoints {
  ability: number;
  skill: number;
  talent: number;
}

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
  skillDetails: SkillDetail[];
  expertises: string[];

  // Combat & equipment
  baseAttackBonus: number;
  attacks: Array<{ name: string; bonus: string; damageType: string }>;
  equipment: string;

  // Currency
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };

  // Character details
  proficienciesAndLanguages: string;
  features: string;
  talents: Talent[];

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
  backgroundDetails: BackgroundDetails;
  alliesAndOrganizations: string;
  treasure: string;
  resourcePools: ResourcePool[];
  advancementPoints: AdvancementPoints;
  avatarAssets?: AvatarAssetResponse | null;

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
  updatedAt?: number;
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

export type ScaleLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Adventure length options
 */
export type AdventureLength = 'flash' | 'short' | 'medium' | 'long' | 'epic' | 'legendary';

/**
 * Difficulty levels
 */
export type Difficulty = 'storyteller' | 'easy' | 'medium' | 'challenging' | 'gritty' | 'deadly';

/**
 * Supported languages
 */
export type Language = 'en' | 'es' | 'pt-BR';

/**
 * World archetype types
 */
export type WorldType = 'terra' | 'water' | 'desert' | 'ice' | 'volcanic' | 'forest' | 'sky' | 'underground' | 'custom';
export type WorldSize = 'intimate' | 'small' | 'medium' | 'large' | 'vast' | 'epic';
export type DMPerformanceMode = 'pirate' | 'shakespearean' | 'noir' | 'courtly' | 'grimdark' | 'storybook';

/**
 * DM personality style
 */
export interface DMStyle {
  verbosity: ScaleLevel;
  detail: ScaleLevel;
  engagement: ScaleLevel;
  narrative: ScaleLevel;
  specialMode?: DMPerformanceMode | null;
  customDirectives: string;
}

/**
 * World generation settings
 */
export interface WorldSettings {
  // World Archetype
  worldType: WorldType;
  worldSize: WorldSize;

  // Theme (editable, pre-filled by archetype)
  theme: string;
  setting: string;
  tone: string;
  worldBackground: string;

  // DM Personality
  dmStyle: DMStyle;
  dmSystemPrompt: string;

  // Game Settings
  playerCount: number;
  adventureLength: AdventureLength;
  difficulty: Difficulty;
  startingLevel: number;
  attributePointBudget: number;
  language: Language;
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
