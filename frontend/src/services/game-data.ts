/**
 * Game Data API Client
 * Fetches D&D 5e SRD data from backend API
 */

import { apolloClient } from '../lib/apollo';
import {
  GET_ABILITIES_QUERY,
  GET_SKILLS_QUERY,
  GET_RACES_QUERY,
  GET_CLASSES_QUERY,
  GET_ALIGNMENTS_QUERY,
  GET_BACKGROUNDS_QUERY,
  GET_LANGUAGES_QUERY,
  GET_MAGIC_SCHOOLS_QUERY,
  GET_CONDITIONS_QUERY,
  GET_DAMAGE_TYPES_QUERY,
  GET_EQUIPMENT_QUERY,
  GET_MONSTERS_QUERY,
  GET_FEATURES_QUERY,
  GET_SPELLS_QUERY,
} from '../graphql/game-data';

import type {
  GetAbilitiesQuery,
  GetSkillsQuery,
  GetRacesQuery,
  GetClassesQuery,
  GetAlignmentsQuery,
  GetBackgroundsQuery,
  GetLanguagesQuery,
  GetMagicSchoolsQuery,
  GetConditionsQuery,
  GetDamageTypesQuery,
  GetEquipmentQuery,
  GetMonstersQuery,
  GetFeaturesQuery,
  GetSpellsQuery,
} from '../gql/graphql';

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
  id: string; // Document ID
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

export interface MonsterSpeeds {
  walk: number;
  fly: number;
  swim: number;
  climb: number;
  burrow: number;
  hover: boolean;
}

export interface Monster {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: string;
  speed: MonsterSpeeds;
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

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  isRitual: boolean;
  description: string;
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
  const { data } = await apolloClient.query<GetAlignmentsQuery>({
    query: GET_ALIGNMENTS_QUERY,
  });
  return (
    data?.alignments?.map((a) => ({
      id: a?.documentId || '', // Check valid ID safely
      name: a?.name || '',
      abbreviation: a?.abbreviation || '',
      description: a?.description || '',
    })) || MOCK_ALIGNMENTS
  );
}

/**
 * Fetch all ability scores
 */
export async function getAbilities(): Promise<Ability[]> {
  const { data } = await apolloClient.query<GetAbilitiesQuery>({ query: GET_ABILITIES_QUERY });
  return (
    data?.abilities?.map((a) => ({
      id: a?.documentId || '',
      index: a?.name?.toLowerCase() || '',
      name: a?.name || '',
      fullName: a?.fullName || '',
      description: a?.description || '',
      skills: a?.skills?.map((s) => s?.name || '') || [],
    })) || []
  );
}

/**
 * Fetch all skills
 */
export async function getSkills(): Promise<Skill[]> {
  const { data } = await apolloClient.query<GetSkillsQuery>({ query: GET_SKILLS_QUERY });
  return (
    data?.skills?.map((s) => ({
      id: s?.documentId || '',
      index: s?.name?.toLowerCase().replace(/\s+/g, '-') || '',
      name: s?.name || '',
      description: s?.description || '',
      abilityScore: s?.abilityScore?.name || '',
    })) || []
  );
}

/**
 * Fetch all player races
 */
export async function getRaces(): Promise<Race[]> {
  const { data } = await apolloClient.query<GetRacesQuery>({ query: GET_RACES_QUERY });
  return (
    data?.races?.map((r) => ({
      id: r?.documentId || '',
      name: r?.name || '',
      description: r?.description || '',
      speed: r?.speed || 30,
      size: r?.size || 'Medium',
    })) || []
  );
}

/**
 * Fetch all character classes
 */
export async function getClasses(): Promise<CharacterClass[]> {
  const { data } = await apolloClient.query<GetClassesQuery>({ query: GET_CLASSES_QUERY });
  return (
    data?.classes?.map((c) => ({
      id: c?.documentId || '',
      name: c?.name || '',
      description: c?.description || '',
      hitDie: parseInt(c?.hit_die || '8', 10),
    })) || []
  );
}

/**
 * Fetch all character backgrounds
 */
export async function getBackgrounds(): Promise<Background[]> {
  const { data } = await apolloClient.query<GetBackgroundsQuery>({ query: GET_BACKGROUNDS_QUERY });
  return (
    data?.backgrounds?.map((b) => ({
      id: b?.documentId || '',
      name: b?.name || '',
      description: b?.description || '',
      skillProficiencies: b?.skillProficiencies?.map((s) => s?.name || '') || [],
    })) || []
  );
}

/**
 * Fetch all languages
 */
export async function getLanguages(): Promise<Language[]> {
  const { data } = await apolloClient.query<GetLanguagesQuery>({ query: GET_LANGUAGES_QUERY });
  return (
    data?.languages?.map((l) => ({
      id: l?.documentId || '',
      index: l?.name?.toLowerCase() || '',
      name: l?.name || '',
      isRare: false, // Default
      note: l?.note || '',
    })) || []
  );
}

/**
 * Fetch all magic schools
 */
export async function getMagicSchools(): Promise<MagicSchool[]> {
  const { data } = await apolloClient.query<GetMagicSchoolsQuery>({ query: GET_MAGIC_SCHOOLS_QUERY });
  return (
    data?.magicSchools?.map((m) => ({
      id: m?.documentId || '',
      index: m?.name?.toLowerCase() || '',
      name: m?.name || '',
      description: m?.description || '',
    })) || []
  );
}

/**
 * Fetch all conditions
 */
export async function getConditions(): Promise<Condition[]> {
  const { data } = await apolloClient.query<GetConditionsQuery>({ query: GET_CONDITIONS_QUERY });
  return (
    data?.conditions?.map((c) => ({
      id: c?.documentId || '',
      index: c?.name?.toLowerCase() || '',
      name: c?.name || '',
      description: c?.description || '',
    })) || []
  );
}

/**
 * Fetch all damage types
 */
export async function getDamageTypes(): Promise<DamageType[]> {
  const { data } = await apolloClient.query<GetDamageTypesQuery>({ query: GET_DAMAGE_TYPES_QUERY });
  return (
    data?.damageTypes?.map((d) => ({
      id: d?.documentId || '',
      index: d?.name?.toLowerCase() || '',
      name: d?.name || '',
      description: d?.description || '',
    })) || []
  );
}

/**
 * Fetch all equipment items
 */
export async function getEquipment(): Promise<EquipmentItem[]> {
  const { data } = await apolloClient.query<GetEquipmentQuery>({ query: GET_EQUIPMENT_QUERY });
  return (
    data?.equipments?.map((item) => ({
      id: item?.documentId || '', // Map documentId
      index: item?.name?.toLowerCase().replace(/\s+/g, '-') || '',
      name: item?.name || '',
      equipmentCategory: item?.equipment_category?.name || 'Unknown',
      cost: {
        quantity: item?.cost_quantity ?? 0,
        unit: item?.cost_unit || 'gp',
      },
      weight: item?.weight || 0,
      description: item?.description || '',
      damage: item?.damage_dice
        ? {
            damageDice: item.damage_dice,
            damageType: item.damage_type?.name || 'bludgeoning',
          }
        : undefined,
      armorClass: item?.armor_class_base
        ? {
            base: item.armor_class_base,
            dexBonus: item.armor_class_dex_bonus || false,
            maxBonus: 0,
          }
        : undefined,
      range: item?.range_normal
        ? {
            normal: item.range_normal,
            long: item.range_long || undefined,
          }
        : undefined,
      properties: item?.properties?.map((p) => p?.name || '') || [],
      imageUrl: null,
    })) || []
  );
}

/**
 * Fetch all monsters
 */
export async function getMonsters(): Promise<Monster[]> {
  const { data } = await apolloClient.query<GetMonstersQuery>({ query: GET_MONSTERS_QUERY });
  return (
    data?.monsters?.map((m) => ({
      id: m?.documentId || '',
      name: m?.name || '',
      size: m?.size || 'Medium',
      type: m?.type || 'beast',
      alignment: m?.alignment || 'Unaligned',
      armorClass: m?.ac || 10,
      hitPoints: String(m?.hp || 10),
      speed: {
        walk: m?.stats?.walkSpeed || 30,
        fly: m?.stats?.flySpeed || 0,
        swim: m?.stats?.swimSpeed || 0,
        climb: m?.stats?.climbSpeed || 0,
        burrow: m?.stats?.burrowSpeed || 0,
        hover: m?.stats?.hover || false,
      },
      abilityScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      senses: [],
      languages: [],
      challenge: String(m?.challenge_rating || '0'),
      actions: [],
      imageUrl: null,
    })) || []
  );
}

/**
 * Fetch a specific monster by ID
 */
export async function getMonster(id: string): Promise<Monster | undefined> {
  const monsters = await getMonsters();
  return monsters.find((m) => m.id === id); // Simple client-side filter fallback or implement GET_MONSTER_QUERY properly
}

/**
 * Fetch all class features
 */
export async function getFeatures(): Promise<Feature[]> {
  const { data } = await apolloClient.query<GetFeaturesQuery>({ query: GET_FEATURES_QUERY });
  return (
    data?.features?.map((f) => ({
      id: f?.documentId || '',
      index: f?.name?.toLowerCase().replace(/\s+/g, '-') || '',
      name: f?.name || '',
      level: f?.level || 1,
      prerequisites: [],
      description: f?.description || '',
    })) || []
  );
}

/**
 * Fetch all spells
 */
export async function getSpells(): Promise<Spell[]> {
  const { data } = await apolloClient.query<GetSpellsQuery>({ query: GET_SPELLS_QUERY });
  return (
    data?.spells?.map((s) => ({
      id: s?.documentId || '',
      name: s?.name || '',
      level: s?.level || 0,
      school: s?.school || '',
      castingTime: s?.casting_time || '',
      range: s?.range || '',
      components: Array.isArray(s?.components) ? s.components.map(String) : [],
      duration: s?.duration || '',
      isRitual: s?.is_ritual || false,
      description: s?.description || '',
    })) || []
  );
}

// Stubs for remaining functions
export async function getEquipmentCategories(): Promise<EquipmentCategory[]> {
  return [];
}
export async function getWeaponProperties(): Promise<WeaponProperty[]> {
  return [];
}
export async function getMagicItems(): Promise<MagicItem[]> {
  return [];
}
export async function getMagicItem(_id: string): Promise<MagicItem> {
  throw new Error('Not implemented');
}
export async function getFeature(_id: string): Promise<Feature> {
  throw new Error('Not implemented');
}
export async function getTraits(): Promise<Trait[]> {
  return [];
}
export async function getTrait(_id: string): Promise<Trait> {
  throw new Error('Not implemented');
}
export async function getSubclasses(): Promise<Subclass[]> {
  return [];
}
export async function getSubclass(_id: string): Promise<Subclass> {
  throw new Error('Not implemented');
}
export async function getProficiencies(): Promise<Proficiency[]> {
  return [];
}
export async function getProficiency(_id: string): Promise<Proficiency> {
  throw new Error('Not implemented');
}
