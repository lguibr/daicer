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
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface Ability {
  id: string;
  index: string;
  name: string;
  fullName: string;
  description: string;
  skills: string[];
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface Skill {
  id: string;
  index: string;
  name: string;
  description: string;
  abilityScore: string;
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface Race {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: string;
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface Language {
  id: string;
  index: string;
  name: string;
  isRare: boolean;
  note: string;
  imageUrl?: string | null;
}

export interface MagicSchool {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

export interface Condition {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

export interface DamageType {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

export interface WeaponProperty {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

export interface EquipmentCategory {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
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
  imageUrl?: string | null;
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

export interface MonsterAbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface MonsterAction {
  name: string;
  description: string;
}

export interface MonsterSpecialAbility {
  name: string;
  description: string;
}

export interface MonsterLegendaryAction {
  name: string;
  description: string;
}

export interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: string;
  speed: string;
  abilityScores: MonsterAbilityScores;
  savingThrows?: string[];
  skills?: string[];
  damageVulnerabilities?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses: string[];
  languages: string[];
  challenge: string;
  specialAbilities?: MonsterSpecialAbility[];
  actions: MonsterAction[];
  legendaryActions?: MonsterLegendaryAction[];
  imageUrl?: string | null;
}

export interface MagicItem {
  id: string;
  index: string;
  name: string;
  equipmentCategory: string;
  rarity: string;
  description: string;
  imageUrl?: string | null;
}

export interface Feature {
  id: string;
  index: string;
  name: string;
  className: string;
  level: number;
  prerequisites: string[];
  description: string;
}

export interface Trait {
  id: string;
  index: string;
  name: string;
  races: string[];
  subraces: string[];
  description: string;
  proficiencies: string[];
}

export interface Subclass {
  id: string;
  index: string;
  name: string;
  className: string;
  subclassFlavor: string;
  description: string;
}

export interface Proficiency {
  id: string;
  index: string;
  name: string;
  type: string;
  classes: string[];
  races: string[];
  reference?: string;
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

/**
 * Fetch all monsters
 */
export async function getMonsters(): Promise<Monster[]> {
  return apiRequest<Monster[]>('/api/game-data/monsters');
}

/**
 * Fetch a specific monster by ID
 */
export async function getMonster(id: string): Promise<Monster> {
  return apiRequest<Monster>(`/api/game-data/monsters/${id}`);
}

/**
 * Fetch all magic items
 */
export async function getMagicItems(): Promise<MagicItem[]> {
  return apiRequest<MagicItem[]>('/api/game-data/magic-items');
}

/**
 * Fetch a specific magic item by ID
 */
export async function getMagicItem(id: string): Promise<MagicItem> {
  return apiRequest<MagicItem>(`/api/game-data/magic-items/${id}`);
}

/**
 * Fetch all class features
 */
export async function getFeatures(): Promise<Feature[]> {
  return apiRequest<Feature[]>('/api/game-data/features');
}

/**
 * Fetch a specific feature by ID
 */
export async function getFeature(id: string): Promise<Feature> {
  return apiRequest<Feature>(`/api/game-data/features/${id}`);
}

/**
 * Fetch all racial traits
 */
export async function getTraits(): Promise<Trait[]> {
  return apiRequest<Trait[]>('/api/game-data/traits');
}

/**
 * Fetch a specific trait by ID
 */
export async function getTrait(id: string): Promise<Trait> {
  return apiRequest<Trait>(`/api/game-data/traits/${id}`);
}

/**
 * Fetch all subclasses
 */
export async function getSubclasses(): Promise<Subclass[]> {
  return apiRequest<Subclass[]>('/api/game-data/subclasses');
}

/**
 * Fetch a specific subclass by ID
 */
export async function getSubclass(id: string): Promise<Subclass> {
  return apiRequest<Subclass>(`/api/game-data/subclasses/${id}`);
}

/**
 * Fetch all proficiencies
 */
export async function getProficiencies(): Promise<Proficiency[]> {
  return apiRequest<Proficiency[]>('/api/game-data/proficiencies');
}

/**
 * Fetch a specific proficiency by ID
 */
export async function getProficiency(id: string): Promise<Proficiency> {
  return apiRequest<Proficiency>(`/api/game-data/proficiencies/${id}`);
}
