/**
 * Shared type definitions ported for Strapi
 */

export enum Attribute {
  STR = 'Strength',
  DEX = 'Dexterity',
  CON = 'Constitution',
  INT = 'Intelligence',
  WIS = 'Wisdom',
  CHA = 'Charisma',
}

export interface SavingThrows {
  fortitude: number;
  reflex: number;
  will: number;
}

export interface SkillDetail {
  name: string;
  ability: Attribute;
  modifier: number;
  proficiency: 'none' | 'trained' | 'proficient' | 'expertise';
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

export interface InventoryItem {
  id?: string;
  item: string; // ID or relation
  quantity: number;
  slot: string;
  isEquipped: boolean;
}

export type CharacterEquipment = InventoryItem[];

export interface CharacterSheet {
  name: string;
  race: string;
  characterClass: string;
  class?: any; // strapi relation
  background: string;
  alignment: string;
  level: number;
  xp: number;
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
  attributes: Record<Attribute, number>;
  savingThrows: SavingThrows;
  skills: Record<string, number>;
  skillDetails: SkillDetail[];
  expertises: string[];
  baseAttackBonus: number;
  attacks: Array<{ name: string; bonus: string; damageType: string }>;
  equipment: CharacterEquipment;
  equipmentDescription?: string;
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  proficienciesAndLanguages: string;
  features: string;
  talents: Talent[];
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
  avatarAssets?: {
    id: string;
    mimeType: string;
    storagePath: string;
    publicUrl: string;
    prompt: string;
    createdAt: string;
  } | null;
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

export interface MapConfig {
  seed: string;
  gridEnabled: boolean;
  biomeBias?: Record<string, number>;
  globalWaterLevel?: number;
  globalTemperature?: number;
  renderSettings?: {
    showGrid: boolean;
    showCoordinates: boolean;
    fogOfWar: boolean;
  };
}

export interface Room {
  id: string;
  code: string;
  ownerId: string;
  settings: WorldSettings | null;
  mapConfig?: MapConfig;
  worldDescription: string;
  worldHistory?: any;
  structures?: any[];
  roads?: any[];
  worldConditions?: any[];
  phase: GamePhase;
  terrainData?: any;
  characterCreationLocked?: boolean;
  generationEvents?: any[];
  createdAt: number;
  updatedAt: number;
  isActive?: boolean;
}

export interface AvatarPreviewImage {
  url: string;
  alt?: string;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  isOnline?: boolean;
  character: CharacterSheet | null;
  action: string | null;
  isReady: boolean;
  joinedAt: number;
  updatedAt?: number;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  avatarPreview?: {
    portrait: AvatarPreviewImage;
    upperBody: AvatarPreviewImage;
    fullBody: AvatarPreviewImage;
  };
}

export interface Message {
  id: string;
  sender: 'DM' | string;
  recipientId?: string;
  text: string;
  images?: string[];
  timestamp: number;
  targetPlayer?: string;
  type?: 'talk' | 'narration' | 'system';
  metadata?: {
    ragContext?: string;
    toolCalls?: any[];
    [key: string]: any;
  };
}

export interface Creature {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  attackBonus?: number;
  damage?: string;
  position: { x: number; y: number; z: number };
  type: 'npc' | 'monster';
  sheet?: CharacterSheet;
}
