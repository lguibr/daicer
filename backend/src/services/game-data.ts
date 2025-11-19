/**
 * Game Data Service
 * Provides cached access to all D&D 5e game data from Firestore
 */

import { db, initializeFirebase } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { SRD_RULES, type SRDRule } from '../../../seeds/data/srd-rules.ts';
import {
  GAME_DATA_COLLECTIONS,
  type RaceDocument,
  type CharacterClassDocument,
  type BackgroundDocument,
  type EquipmentDocument,
  type EquipmentCategoryDocument,
  type WeaponPropertyDocument,
  type AbilityDocument,
  type SkillDocument,
  type ConditionDocument,
  type DamageTypeDocument,
  type LanguageDocument,
  type MagicSchoolDocument,
  type AlignmentDocument,
  type MonsterDocument,
  type MagicItemDocument,
  type FeatureDocument,
  type TraitDocument,
  type SubclassDocument,
  type ProficiencyDocument,
} from '../types/game-data.js';

// ============================================================================
// Cache Layer
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(): void {
  cache.clear();
  logger.info('Game data cache cleared');
}

// ============================================================================
// Generic Firestore Query Helpers
// ============================================================================

async function getCollection<T>(collectionName: string): Promise<T[]> {
  const cacheKey = `collection:${collectionName}`;
  const cached = getCached<T[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Ensure Firebase is initialized before querying
  initializeFirebase();

  const snapshot = await db().collection(collectionName).get();
  const documents = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as T[];

  setCache(cacheKey, documents);
  return documents;
}

async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const cacheKey = `doc:${collectionName}:${docId}`;
  const cached = getCached<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Ensure Firebase is initialized before querying
  initializeFirebase();

  const docRef = await db().collection(collectionName).doc(docId).get();
  if (!docRef.exists) {
    return null;
  }

  const document = {
    ...docRef.data(),
    id: docRef.id,
  } as T;

  setCache(cacheKey, document);
  return document;
}

// ============================================================================
// Races
// ============================================================================

export async function getRaces(): Promise<RaceDocument[]> {
  const races = await getCollection<RaceDocument>(GAME_DATA_COLLECTIONS.RACES);
  // Add index field for API compatibility (D&D 5e API convention)
  return races.map((race) => ({
    ...race,
    index: race.index || race.id,
  }));
}

export async function getRace(id: string): Promise<RaceDocument | null> {
  const race = await getDocument<RaceDocument>(GAME_DATA_COLLECTIONS.RACES, id);
  if (!race) {
    return null;
  }
  return {
    ...race,
    index: race.index || race.id,
  };
}

// ============================================================================
// Classes
// ============================================================================

export async function getClasses(): Promise<CharacterClassDocument[]> {
  const classes = await getCollection<CharacterClassDocument>(GAME_DATA_COLLECTIONS.CLASSES);
  // Add index field for API compatibility (D&D 5e API convention)
  return classes.map((classItem) => ({
    ...classItem,
    index: classItem.index || classItem.id,
  }));
}

export async function getClass(id: string): Promise<CharacterClassDocument | null> {
  const classItem = await getDocument<CharacterClassDocument>(GAME_DATA_COLLECTIONS.CLASSES, id);
  if (!classItem) {
    return null;
  }
  return {
    ...classItem,
    index: classItem.index || classItem.id,
  };
}

// ============================================================================
// Backgrounds
// ============================================================================

export async function getBackgrounds(): Promise<BackgroundDocument[]> {
  return getCollection<BackgroundDocument>(GAME_DATA_COLLECTIONS.BACKGROUNDS);
}

export async function getBackground(id: string): Promise<BackgroundDocument | null> {
  return getDocument<BackgroundDocument>(GAME_DATA_COLLECTIONS.BACKGROUNDS, id);
}

// ============================================================================
// Equipment
// ============================================================================

export async function getEquipment(): Promise<EquipmentDocument[]> {
  return getCollection<EquipmentDocument>(GAME_DATA_COLLECTIONS.EQUIPMENT);
}

export async function getEquipmentItem(id: string): Promise<EquipmentDocument | null> {
  return getDocument<EquipmentDocument>(GAME_DATA_COLLECTIONS.EQUIPMENT, id);
}

export async function getEquipmentByCategory(category: string): Promise<EquipmentDocument[]> {
  const cacheKey = `equipment:category:${category}`;
  const cached = getCached<EquipmentDocument[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Ensure Firebase is initialized before querying
  initializeFirebase();

  const snapshot = await db()
    .collection(GAME_DATA_COLLECTIONS.EQUIPMENT)
    .where('equipmentCategory', '==', category)
    .get();

  const items = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as EquipmentDocument[];

  setCache(cacheKey, items);
  return items;
}

// ============================================================================
// Equipment Categories
// ============================================================================

export async function getEquipmentCategories(): Promise<EquipmentCategoryDocument[]> {
  return getCollection<EquipmentCategoryDocument>(GAME_DATA_COLLECTIONS.EQUIPMENT_CATEGORIES);
}

export async function getEquipmentCategory(id: string): Promise<EquipmentCategoryDocument | null> {
  return getDocument<EquipmentCategoryDocument>(GAME_DATA_COLLECTIONS.EQUIPMENT_CATEGORIES, id);
}

// ============================================================================
// Weapon Properties
// ============================================================================

export async function getWeaponProperties(): Promise<WeaponPropertyDocument[]> {
  return getCollection<WeaponPropertyDocument>(GAME_DATA_COLLECTIONS.WEAPON_PROPERTIES);
}

export async function getWeaponProperty(id: string): Promise<WeaponPropertyDocument | null> {
  return getDocument<WeaponPropertyDocument>(GAME_DATA_COLLECTIONS.WEAPON_PROPERTIES, id);
}

// ============================================================================
// Abilities
// ============================================================================

export async function getAbilities(): Promise<AbilityDocument[]> {
  return getCollection<AbilityDocument>(GAME_DATA_COLLECTIONS.ABILITIES);
}

export async function getAbility(id: string): Promise<AbilityDocument | null> {
  return getDocument<AbilityDocument>(GAME_DATA_COLLECTIONS.ABILITIES, id);
}

// ============================================================================
// Skills
// ============================================================================

export async function getSkills(): Promise<SkillDocument[]> {
  return getCollection<SkillDocument>(GAME_DATA_COLLECTIONS.SKILLS);
}

export async function getSkill(id: string): Promise<SkillDocument | null> {
  return getDocument<SkillDocument>(GAME_DATA_COLLECTIONS.SKILLS, id);
}

// ============================================================================
// Conditions
// ============================================================================

export async function getConditions(): Promise<ConditionDocument[]> {
  return getCollection<ConditionDocument>(GAME_DATA_COLLECTIONS.CONDITIONS);
}

export async function getCondition(id: string): Promise<ConditionDocument | null> {
  return getDocument<ConditionDocument>(GAME_DATA_COLLECTIONS.CONDITIONS, id);
}

// ============================================================================
// Damage Types
// ============================================================================

export async function getDamageTypes(): Promise<DamageTypeDocument[]> {
  return getCollection<DamageTypeDocument>(GAME_DATA_COLLECTIONS.DAMAGE_TYPES);
}

export async function getDamageType(id: string): Promise<DamageTypeDocument | null> {
  return getDocument<DamageTypeDocument>(GAME_DATA_COLLECTIONS.DAMAGE_TYPES, id);
}

// ============================================================================
// Languages
// ============================================================================

export async function getLanguages(): Promise<LanguageDocument[]> {
  return getCollection<LanguageDocument>(GAME_DATA_COLLECTIONS.LANGUAGES);
}

export async function getLanguage(id: string): Promise<LanguageDocument | null> {
  return getDocument<LanguageDocument>(GAME_DATA_COLLECTIONS.LANGUAGES, id);
}

// ============================================================================
// Magic Schools
// ============================================================================

export async function getMagicSchools(): Promise<MagicSchoolDocument[]> {
  return getCollection<MagicSchoolDocument>(GAME_DATA_COLLECTIONS.MAGIC_SCHOOLS);
}

export async function getMagicSchool(id: string): Promise<MagicSchoolDocument | null> {
  return getDocument<MagicSchoolDocument>(GAME_DATA_COLLECTIONS.MAGIC_SCHOOLS, id);
}

// ============================================================================
// Alignments
// ============================================================================

export async function getAlignments(): Promise<AlignmentDocument[]> {
  return getCollection<AlignmentDocument>(GAME_DATA_COLLECTIONS.ALIGNMENTS);
}

export async function getAlignment(id: string): Promise<AlignmentDocument | null> {
  return getDocument<AlignmentDocument>(GAME_DATA_COLLECTIONS.ALIGNMENTS, id);
}

// ============================================================================
// Monsters
// ============================================================================

export async function getMonsters(): Promise<MonsterDocument[]> {
  return getCollection<MonsterDocument>(GAME_DATA_COLLECTIONS.MONSTERS);
}

export async function getMonster(id: string): Promise<MonsterDocument | null> {
  return getDocument<MonsterDocument>(GAME_DATA_COLLECTIONS.MONSTERS, id);
}

// ============================================================================
// Magic Items
// ============================================================================

export async function getMagicItems(): Promise<MagicItemDocument[]> {
  return getCollection<MagicItemDocument>(GAME_DATA_COLLECTIONS.MAGIC_ITEMS);
}

export async function getMagicItem(id: string): Promise<MagicItemDocument | null> {
  return getDocument<MagicItemDocument>(GAME_DATA_COLLECTIONS.MAGIC_ITEMS, id);
}

// ============================================================================
// Features
// ============================================================================

export async function getFeatures(): Promise<FeatureDocument[]> {
  return getCollection<FeatureDocument>(GAME_DATA_COLLECTIONS.FEATURES);
}

export async function getFeature(id: string): Promise<FeatureDocument | null> {
  return getDocument<FeatureDocument>(GAME_DATA_COLLECTIONS.FEATURES, id);
}

// ============================================================================
// Traits
// ============================================================================

export async function getTraits(): Promise<TraitDocument[]> {
  return getCollection<TraitDocument>(GAME_DATA_COLLECTIONS.TRAITS);
}

export async function getTrait(id: string): Promise<TraitDocument | null> {
  return getDocument<TraitDocument>(GAME_DATA_COLLECTIONS.TRAITS, id);
}

// ============================================================================
// Subclasses
// ============================================================================

export async function getSubclasses(): Promise<SubclassDocument[]> {
  return getCollection<SubclassDocument>(GAME_DATA_COLLECTIONS.SUBCLASSES);
}

export async function getSubclass(id: string): Promise<SubclassDocument | null> {
  return getDocument<SubclassDocument>(GAME_DATA_COLLECTIONS.SUBCLASSES, id);
}

// ============================================================================
// Proficiencies
// ============================================================================

export async function getProficiencies(): Promise<ProficiencyDocument[]> {
  return getCollection<ProficiencyDocument>(GAME_DATA_COLLECTIONS.PROFICIENCIES);
}

export async function getProficiency(id: string): Promise<ProficiencyDocument | null> {
  return getDocument<ProficiencyDocument>(GAME_DATA_COLLECTIONS.PROFICIENCIES, id);
}

// ============================================================================
// Rules (from SRD)
// ============================================================================

export interface RuleDocument {
  id: string;
  name: string;
  title?: string;
  category?: string;
  content?: string;
  tags?: string[];
}

export interface RuleSectionDocument {
  id: string;
  name: string;
  desc?: string;
  ruleIds?: string[];
}

/**
 * Get all rules from SRD
 */
export function getRules(): RuleDocument[] {
  return SRD_RULES.map((rule) => ({
    id: rule.id,
    name: rule.title,
    title: rule.title,
    category: rule.category,
    content: rule.content,
    tags: rule.tags,
  }));
}

/**
 * Get a single rule by ID
 */
export function getRule(id: string): RuleDocument | null {
  const rule = SRD_RULES.find((r) => r.id === id);
  if (!rule) {
    return null;
  }
  return {
    id: rule.id,
    name: rule.title,
    title: rule.title,
    category: rule.category,
    content: rule.content,
    tags: rule.tags,
  };
}

/**
 * Get all rule sections (categories)
 */
export function getRuleSections(): RuleSectionDocument[] {
  const categories = [...new Set(SRD_RULES.map((r) => r.category))];
  return categories.map((category) => {
    const rulesInCategory = SRD_RULES.filter((r) => r.category === category);
    return {
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      desc: `Rules related to ${category}`,
      ruleIds: rulesInCategory.map((r) => r.id),
    };
  });
}

/**
 * Get a single rule section by ID
 */
export function getRuleSection(id: string): RuleSectionDocument | null {
  const rulesInCategory = SRD_RULES.filter((r) => r.category === id);
  if (rulesInCategory.length === 0) {
    return null;
  }
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    desc: `Rules related to ${id}`,
    ruleIds: rulesInCategory.map((r) => r.id),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Warm up cache by loading all game data
 */
export async function warmUpCache(): Promise<void> {
  logger.info('Warming up game data cache...');

  await Promise.all([
    getRaces(),
    getClasses(),
    getBackgrounds(),
    getEquipment(),
    getEquipmentCategories(),
    getWeaponProperties(),
    getAbilities(),
    getSkills(),
    getConditions(),
    getDamageTypes(),
    getLanguages(),
    getMagicSchools(),
    getAlignments(),
    getMonsters(),
    getMagicItems(),
    getFeatures(),
    getTraits(),
    getSubclasses(),
    getProficiencies(),
  ]);

  logger.info('Game data cache warmed up successfully');
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export { clearCache };
