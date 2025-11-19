/**
 * Character-related type definitions
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
 * Skill proficiency levels
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

  // Embedded data (denormalized for performance)
  raceData?: {
    name: string;
    speed: number;
    size: string;
  };
  classData?: {
    name: string;
    hitDie: number;
    primaryAbility: string;
  };
  backgroundData?: {
    name: string;
    description: string;
  };

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
  avatarAssets?: {
    id: string;
    mimeType: string;
    storagePath: string;
    publicUrl: string;
    prompt: string;
    createdAt: string;
  } | null;

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
 * Creature/NPC in combat
 */
export interface Creature {
  name: string;
  hp: number;
  maxHp: number;
  attackBonus: number;
  damage: string;
}
