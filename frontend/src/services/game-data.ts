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

const MOCK_ALIGNMENTS: Alignment[] = [
  {
    id: 'lg',
    name: 'Lawful Good',
    abbreviation: 'LG',
    description: 'Combines a strong sense of honor and compassion.',
  },
  { id: 'ng', name: 'Neutral Good', abbreviation: 'NG', description: 'Does the best that a good person can do.' },
  {
    id: 'cg',
    name: 'Chaotic Good',
    abbreviation: 'CG',
    description: 'Act as their conscience directs with little regard for expectations.',
  },
  {
    id: 'ln',
    name: 'Lawful Neutral',
    abbreviation: 'LN',
    description: 'Individuals who act in accordance with law, tradition, or personal codes.',
  },
  {
    id: 'n',
    name: 'True Neutral',
    abbreviation: 'N',
    description: "Prefer to steer clear of moral questions and don't take sides.",
  },
  {
    id: 'cn',
    name: 'Chaotic Neutral',
    abbreviation: 'CN',
    description: 'Follow their whims, holding their personal freedom above all else.',
  },
  {
    id: 'le',
    name: 'Lawful Evil',
    abbreviation: 'LE',
    description: 'Methodically take what they want within the limits of a code of tradition.',
  },
  {
    id: 'ne',
    name: 'Neutral Evil',
    abbreviation: 'NE',
    description: 'Those who do whatever they can get away with, without compassion or qualms.',
  },
  {
    id: 'ce',
    name: 'Chaotic Evil',
    abbreviation: 'CE',
    description: 'Act with arbitrary violence, spurred by their greed, hatred, or bloodlust.',
  },
];

/**
 * Fetch all alignments
 */
export async function getAlignments(): Promise<Alignment[]> {
  // Return mock data for now as strictly required by frontend
  return Promise.resolve(MOCK_ALIGNMENTS);
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
  return apiRequest<Race[]>('/api/races?populate=*');
}

/**
 * Fetch all character classes
 */
export async function getClasses(): Promise<CharacterClass[]> {
  const rawClasses = await apiRequest<any[]>('/api/classes?populate=*');
  return rawClasses.map((c: any) => ({
    ...c,
    id: c.documentId || c.id,
    hitDie: c.hit_die, // Map snake_case to camelCase
    primaryAbility: c.primary_ability || c.primaryAbility, // Safety check
    savingThrows: c.saving_throws || c.savingThrows,
  }));
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
  const rawItems = await apiRequest<any[]>('/api/equipments?populate=*');

  return rawItems.map((item: any) => ({
    index: item.slug || item.index,
    name: item.name,
    equipmentCategory: item.equipment_category?.name || item.equipment_category || 'Unknown',
    cost: {
      quantity: item.cost_quantity ?? 0,
      unit: item.cost_unit || 'gp',
    },
    weight: item.weight,
    description: item.description,
    damage: item.damage_dice
      ? {
          damageDice: item.damage_dice,
          damageType: item.damage_type?.name || 'bludgeoning',
        }
      : undefined,
    armorClass:
      typeof item.armor_class_base === 'number'
        ? {
            base: item.armor_class_base,
            dexBonus: item.armor_class_dex_bonus,
            maxBonus: item.armor_class_max_bonus,
          }
        : item.armor_class_base, // Could be null or number if flat
    range: item.range_normal
      ? {
          normal: item.range_normal,
          long: item.range_long,
        }
      : undefined,
    properties: item.properties?.map((p: any) => p.name) || [],
    imageUrl: item.image_url || null,
  }));
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
  const rawMonsters = await apiRequest<any[]>('/api/monsters?populate=*');
  return rawMonsters.map((m: any) => ({
    id: m.documentId || m.id || m.slug,
    name: m.name,
    size: m.size,
    type: m.type,
    alignment: m.alignment,
    armorClass: m.ac || m.armor_class || 10,
    hitPoints: m.hp || m.hit_points || '10',
    speed: m.speed,
    abilityScores: m.stats
      ? {
          STR: m.stats.strength || 10,
          DEX: m.stats.dexterity || 10,
          CON: m.stats.constitution || 10,
          INT: m.stats.intelligence || 10,
          WIS: m.stats.wisdom || 10,
          CHA: m.stats.charisma || 10,
        }
      : { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    challenge: m.challenge_rating || '0',
    senses: m.senses || [],
    languages: m.languages || [],
    actions: m.actions || [],
    specialAbilities: m.special_abilities || [],
    legendaryActions: m.legendary_actions || [],
    imageUrl: m.image_url || null,
  }));
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
