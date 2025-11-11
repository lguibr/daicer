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
  | AlignmentDocument;
