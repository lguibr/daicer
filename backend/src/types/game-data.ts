/**
 * Game Data Types for Firestore Collections
 * All D&D 5e SRD data structures
 */

// ============================================================================
// Currency & Cost
// ============================================================================

export interface GameDataCost {
  quantity: number;
  unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

// ============================================================================
// Races
// ============================================================================

export interface RaceDocument {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: string;
  abilityBonuses?: Array<{
    ability: string;
    bonus: number;
  }>;
  traits?: string[];
  imageUrl?: string | null;
}

// ============================================================================
// Classes
// ============================================================================

export interface CharacterClassDocument {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  proficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
    savingThrows?: string[];
    skills?: {
      choose: number;
      from: string[];
    };
  };
  imageUrl?: string | null;

  // Embedded equipment (denormalized for performance)
  startingEquipmentEmbedded?: Array<{
    id: string;
    name: string;
    category: string;
    description?: string;
  }>;
}

// ============================================================================
// Backgrounds
// ============================================================================

export interface BackgroundDocument {
  id: string;
  name: string;
  description: string;
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  languages?: number;
  equipment?: string[];
  feature?: {
    name: string;
    description: string;
  };
  imageUrl?: string | null;
}

// ============================================================================
// Equipment & Items
// ============================================================================

export interface EquipmentDamage {
  damageDice: string;
  damageType: string;
}

export interface EquipmentArmorClass {
  base: number;
  dexBonus: boolean;
  maxBonus?: number;
}

export interface EquipmentRange {
  normal: number;
  long?: number;
}

export interface EquipmentDocument {
  id: string;
  index: string;
  name: string;
  equipmentCategory: string;
  cost: GameDataCost;
  weight: number;
  description?: string;
  damage?: EquipmentDamage;
  armorClass?: number | EquipmentArmorClass;
  range?: EquipmentRange;
  properties?: string[];
  weaponCategory?: 'Simple' | 'Martial';
  armorCategory?: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  gearCategory?: string;
  imageUrl?: string | null;
}

// ============================================================================
// Equipment Categories
// ============================================================================

export interface EquipmentCategoryDocument {
  id: string;
  index: string;
  name: string;
  equipment?: string[]; // References to equipment IDs
  imageUrl?: string | null;
}

// ============================================================================
// Weapon Properties
// ============================================================================

export interface WeaponPropertyDocument {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Abilities
// ============================================================================

export interface AbilityDocument {
  id: string;
  index: string;
  name: string;
  fullName: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Skills
// ============================================================================

export interface SkillDocument {
  id: string;
  index: string;
  name: string;
  description: string;
  abilityScore: string;
  imageUrl?: string | null;
}

// ============================================================================
// Conditions
// ============================================================================

export interface ConditionDocument {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Damage Types
// ============================================================================

export interface DamageTypeDocument {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Languages
// ============================================================================

export interface LanguageDocument {
  id: string;
  index: string;
  name: string;
  isRare: boolean;
  note: string;
  imageUrl?: string | null;
}

// ============================================================================
// Magic Schools
// ============================================================================

export interface MagicSchoolDocument {
  id: string;
  index: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Alignments
// ============================================================================

export interface AlignmentDocument {
  id: string;
  index: string;
  name: string;
  abbreviation: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Monsters
// ============================================================================

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

export interface MonsterDocument {
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

  // Embedded spell metadata (denormalized for performance)
  spellsEmbedded?: Array<{
    id: string;
    name: string;
    level: number;
    school: string;
    range?: string;
  }>;
}

// ============================================================================
// Magic Items
// ============================================================================

export interface MagicItemDocument {
  id: string;
  index: string;
  name: string;
  equipmentCategory: string;
  rarity: string;
  description: string;
  imageUrl?: string | null;
}

// ============================================================================
// Features (Class Features)
// ============================================================================

export interface FeatureDocument {
  id: string;
  index: string;
  name: string;
  className: string;
  level: number;
  prerequisites: string[];
  description: string;
}

// ============================================================================
// Traits (Race Traits)
// ============================================================================

export interface TraitDocument {
  id: string;
  index: string;
  name: string;
  races: string[];
  subraces: string[];
  description: string;
  proficiencies: string[];
}

// ============================================================================
// Subclasses
// ============================================================================

export interface SubclassDocument {
  id: string;
  index: string;
  name: string;
  className: string;
  subclassFlavor: string;
  description: string;
}

// ============================================================================
// Proficiencies
// ============================================================================

export interface ProficiencyDocument {
  id: string;
  index: string;
  name: string;
  type: string;
  classes: string[];
  races: string[];
  reference?: string;
}

// ============================================================================
// SRD Rules (for RAG/Vector Search)
// ============================================================================

export interface SRDRuleDocument {
  id: string;
  title: string;
  category: 'combat' | 'spells' | 'exploration' | 'conditions' | 'abilities' | 'general';
  content: string;
  tags: string[];
  embedding: number[]; // Will be stored as vector in Firestore
  createdAt: number;
}

// ============================================================================
// Collection Names (Constants)
// ============================================================================

export const GAME_DATA_COLLECTIONS = {
  RACES: 'game_data_races',
  CLASSES: 'game_data_classes',
  BACKGROUNDS: 'game_data_backgrounds',
  EQUIPMENT: 'game_data_equipment',
  EQUIPMENT_CATEGORIES: 'game_data_equipment_categories',
  WEAPON_PROPERTIES: 'game_data_weapon_properties',
  ABILITIES: 'game_data_abilities',
  SKILLS: 'game_data_skills',
  CONDITIONS: 'game_data_conditions',
  DAMAGE_TYPES: 'game_data_damage_types',
  LANGUAGES: 'game_data_languages',
  MAGIC_SCHOOLS: 'game_data_magic_schools',
  ALIGNMENTS: 'game_data_alignments',
  MONSTERS: 'game_data_monsters',
  MAGIC_ITEMS: 'game_data_magic_items',
  FEATURES: 'game_data_features',
  TRAITS: 'game_data_traits',
  SUBCLASSES: 'game_data_subclasses',
  PROFICIENCIES: 'game_data_proficiencies',
} as const;

// ============================================================================
// Union Types for Game Data
// ============================================================================

export type GameDataDocument =
  | RaceDocument
  | CharacterClassDocument
  | BackgroundDocument
  | EquipmentDocument
  | EquipmentCategoryDocument
  | WeaponPropertyDocument
  | AbilityDocument
  | SkillDocument
  | ConditionDocument
  | DamageTypeDocument
  | LanguageDocument
  | MagicSchoolDocument
  | AlignmentDocument
  | MonsterDocument
  | MagicItemDocument
  | FeatureDocument
  | TraitDocument
  | SubclassDocument
  | ProficiencyDocument;
