/**
 * Shared constants
 */

import type { CharacterSheet } from '@/types/index.js';

/**
 * New character template with default values
 */
export const NEW_CHARACTER_TEMPLATE: CharacterSheet = {
  name: '',
  race: 'Human',
  characterClass: 'Fighter',
  alignment: 'True Neutral',
  level: 1,
  xp: 0,
  hp: 10,
  maxHp: 10,
  armorClass: 10,
  initiative: 0,
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
  equipment: '',
};

/**
 * List of attributes
 */
export const ATTRIBUTES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'] as const;

