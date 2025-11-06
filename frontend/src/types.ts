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
  savingThrows: {
    fortitude: number;
    reflex: number;
    will: number;
  };
  skills: Record<string, number>;
  equipment: string;
}

export interface Player {
  id: string;
  name: string;
  character: CharacterSheet;
  action: string | null;
}

export interface Message {
  id: string;
  sender: 'DM' | string; // DM or Player Name
  text: string;
  images?: string[]; // Array of base64 image strings
}

export type AdventureLength = 'short' | 'medium' | 'epic';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WorldSettings {
  theme: string;
  setting: string;
  tone: string;
  playerCount: number;
  adventureLength: AdventureLength;
  difficulty: Difficulty;
}

export interface Creature {
    name: string;
    hp: number;
    maxHp: number;
    attackBonus: number;
    damage: string;
}