/**
 * Game Data API Client
 * Fetches D&D 5e SRD data from backend API
 */

import { apiRequest } from './api';

// Re-export types from shared types
export interface Alignment {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
}

export interface Ability {
  id: string;
  index: string;
  name: string;
  fullName: string;
  description: string;
  skills: string[];
}

export interface Skill {
  id: string;
  index: string;
  name: string;
  description: string;
  abilityScore: string;
}

export interface Race {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: string;
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
}

export interface Background {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
}

export interface Language {
  id: string;
  index: string;
  name: string;
  isRare: boolean;
  note: string;
}

export interface MagicSchool {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface Condition {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface DamageType {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface WeaponProperty {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface EquipmentCategory {
  id: string;
  index: string;
  name: string;
  description: string;
}

export interface EquipmentItem {
  index: string;
  name: string;
  equipmentCategory: string;
  cost: { quantity: number; unit: string };
  weight: number;
  description?: string;
  damage?: { damageDice: string; damageType: string };
  armorClass?: number | { base: number; dexBonus: boolean; maxBonus?: number };
  range?: { normal: number; long?: number };
  properties?: string[];
}

/**
 * Fetch all alignments
 */
export async function getAlignments(): Promise<Alignment[]> {
  return apiRequest<Alignment[]>('/api/game-data/alignments');
}

/**
 * Fetch all ability scores
 */
export async function getAbilities(): Promise<Ability[]> {
  return apiRequest<Ability[]>('/api/game-data/abilities');
}

/**
 * Fetch all skills
 */
export async function getSkills(): Promise<Skill[]> {
  return apiRequest<Skill[]>('/api/game-data/skills');
}

/**
 * Fetch all player races
 */
export async function getRaces(): Promise<Race[]> {
  return apiRequest<Race[]>('/api/game-data/races');
}

/**
 * Fetch all character classes
 */
export async function getClasses(): Promise<CharacterClass[]> {
  return apiRequest<CharacterClass[]>('/api/game-data/classes');
}

/**
 * Fetch all character backgrounds
 */
export async function getBackgrounds(): Promise<Background[]> {
  return apiRequest<Background[]>('/api/game-data/backgrounds');
}

/**
 * Fetch all languages
 */
export async function getLanguages(): Promise<Language[]> {
  return apiRequest<Language[]>('/api/game-data/languages');
}

/**
 * Fetch all magic schools
 */
export async function getMagicSchools(): Promise<MagicSchool[]> {
  return apiRequest<MagicSchool[]>('/api/game-data/magic-schools');
}

/**
 * Fetch all conditions
 */
export async function getConditions(): Promise<Condition[]> {
  return apiRequest<Condition[]>('/api/game-data/conditions');
}

/**
 * Fetch all damage types
 */
export async function getDamageTypes(): Promise<DamageType[]> {
  return apiRequest<DamageType[]>('/api/game-data/damage-types');
}

/**
 * Fetch all equipment items
 */
export async function getEquipment(): Promise<EquipmentItem[]> {
  return apiRequest<EquipmentItem[]>('/api/game-data/equipment');
}

/**
 * Fetch all equipment categories
 */
export async function getEquipmentCategories(): Promise<EquipmentCategory[]> {
  return apiRequest<EquipmentCategory[]>('/api/game-data/equipment-categories');
}

/**
 * Fetch all weapon properties
 */
export async function getWeaponProperties(): Promise<WeaponProperty[]> {
  return apiRequest<WeaponProperty[]>('/api/game-data/weapon-properties');
}
