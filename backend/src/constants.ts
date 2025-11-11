/**
 * Shared constants
 */

import type { CharacterSheet, WorldSettings } from '@/types/index';

/**
 * New character template with default values
 */
export const NEW_CHARACTER_TEMPLATE: CharacterSheet = {
  name: '',
  race: 'Human',
  characterClass: 'Fighter',
  background: 'Folk Hero',
  alignment: 'Neutral Good',
  level: 1,
  xp: 0,
  hp: 10,
  maxHp: 10,
  temporaryHp: 0,
  hitDice: { total: 1, current: 1 },
  deathSaves: { successes: 0, failures: 0 },
  armorClass: 10,
  initiative: 0,
  speed: 30,
  proficiencyBonus: 2,
  inspiration: false,
  baseAttackBonus: 1,
  attributes: {
    Strength: 10,
    Dexterity: 10,
    Constitution: 10,
    Intelligence: 10,
    Wisdom: 10,
    Charisma: 10,
  },
  savingThrows: {
    fortitude: 2,
    reflex: 0,
    will: 0,
  },
  skills: {},
  skillDetails: [],
  expertises: [],
  attacks: [],
  equipment: '',
  currency: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  },
  proficienciesAndLanguages: '',
  features: '',
  talents: [],
  appearance: {
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    description: '',
  },
  personality: {
    traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
  },
  backstory: '',
  backgroundDetails: {
    origin: '',
    upbringing: '',
    motivation: '',
    keyEvents: [],
    allies: [],
  },
  alliesAndOrganizations: '',
  treasure: '',
  resourcePools: [],
  advancementPoints: {
    ability: 0,
    skill: 0,
    talent: 0,
  },
  avatarAssets: null,
  spellcasting: {
    class: '',
    ability: '',
    saveDC: 0,
    attackBonus: 0,
    cantrips: [],
    spellsKnown: [],
    slots: [],
  },
};

/**
 * List of attributes
 */
export const ATTRIBUTES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'] as const;

/**
 * Default world settings
 */
export const DEFAULT_WORLD_SETTINGS: WorldSettings = {
  worldType: 'terra',
  worldSize: 'medium',
  theme: 'High Fantasy',
  setting: 'Medieval',
  tone: 'Heroic',
  worldBackground: '',
  dmStyle: {
    verbosity: 3,
    detail: 3,
    engagement: 3,
    narrative: 3,
    specialMode: null,
    customDirectives: '',
  },
  dmSystemPrompt: '',
  playerCount: 4,
  adventureLength: 'medium',
  difficulty: 'medium',
  startingLevel: 1,
  attributePointBudget: 27,
  language: 'en',
};

/**
 * D&D point-buy costs for attributes (score -> point cost)
 */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
