/**
 * @file backend/src/types/spells.ts
 * @description Spell type system with spatial effect shapes as CORE combat mechanics
 * @note These shapes are fundamental to combat grid calculations, not just metadata
 */

/**
 * Spell effect shapes - CORE to combat targeting and damage calculation
 * These determine which grid squares are affected in combat
 */
export enum SpellEffectShape {
  // ===== SINGLE TARGET =====
  /** Touch range - affects adjacent square only (5ft reach) */
  MELEE_TOUCH = 'melee_touch',

  /** Guided projectile - targets specific creature, ignores obstacles in path */
  RANGED_SINGLE = 'ranged_single',

  /** Straight projectile - ray/beam that stops at first obstacle or target */
  PROJECTILE_STRAIGHT = 'projectile_straight',

  // ===== AREA OF EFFECT =====
  /** Cone emanating from caster - directional, spreads outward */
  CONE = 'cone',

  /** Straight line - affects all squares in line (Lightning Bolt) */
  LINE = 'line',

  /** Sphere/radius around target point - affects all within radius (Fireball) */
  SPHERE = 'sphere',

  /** Vertical cylinder - radius + height, for multi-level effects */
  CYLINDER = 'cylinder',

  /** Cubic area - NxN grid squares */
  CUBE = 'cube',

  /** Hemisphere/dome - half-sphere, usually upward from ground */
  HEMISPHERE = 'hemisphere',

  // ===== SPECIAL SPATIAL =====
  /** Self only - affects caster's square only */
  SELF_ONLY = 'self_only',

  /** Moving aura - radius around caster that moves with them */
  SELF_AURA = 'self_aura',

  /** Wall/barrier - linear or circular, blocks movement/LOS */
  WALL = 'wall',

  /** Chain - bounces between targets within range */
  CHAIN = 'chain',

  /** Custom/complex - requires special handling */
  CUSTOM = 'custom',
}

/**
 * Targeting type - how the spell's target is selected
 */
export enum TargetingType {
  /** No targeting - self-cast only */
  NONE = 'none',

  /** Choose a point within range (for area effects) */
  POINT = 'point',

  /** Choose specific creature(s) */
  CREATURE = 'creature',

  /** Choose specific object(s) */
  OBJECT = 'object',

  /** Choose direction (for cones, lines from caster) */
  DIRECTION = 'direction',
}

/**
 * Attack/save type - determines combat resolution
 */
export enum AttackType {
  /** No attack or save - automatic effect */
  NONE = 'none',

  /** Melee spell attack roll */
  MELEE_SPELL = 'melee_spell',

  /** Ranged spell attack roll */
  RANGED_SPELL = 'ranged_spell',

  /** Target makes saving throw */
  SAVING_THROW = 'saving_throw',
}

/**
 * Spell level (0-9)
 * 0 = Cantrip, 1-9 = spell levels
 */
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Magic schools
 */
export type MagicSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

/**
 * D&D abilities for saving throws
 */
export type Ability = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Wisdom' | 'Charisma';

/**
 * Damage types
 */
export type DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder';

/**
 * Spell range specification
 */
export interface SpellRange {
  type: 'self' | 'touch' | 'feet' | 'miles' | 'sight' | 'unlimited';
  distance?: number;
}

/**
 * Effect dimensions - CRITICAL for grid calculations
 * Dimensions in feet, converted to 5ft grid squares in combat
 */
export interface EffectDimensions {
  // For SPHERE/CYLINDER/SELF_AURA
  /** Radius in feet */
  radius?: number;
  /** Height in feet (for CYLINDER) */
  height?: number;

  // For CONE
  /** Cone length in feet */
  length?: number;

  // For LINE/PROJECTILE_STRAIGHT
  /** Line length in feet */
  lineLength?: number;
  /** Line width in feet (default 5) */
  lineWidth?: number;

  // For CUBE
  /** Cube side length in feet */
  size?: number;

  // For WALL
  /** Maximum wall length in feet */
  maxLength?: number;
  /** Wall height in feet */
  wallHeight?: number;
  /** Wall thickness in feet */
  thickness?: number;
}

/**
 * Saving throw details
 */
export interface SavingThrow {
  /** Ability to save against */
  ability: Ability;
  /** Effect on successful save */
  damageOnSave: 'half' | 'none' | 'special';
  /** Description of save effect */
  saveDescription?: string;
}

/**
 * Damage specification
 */
export interface SpellDamage {
  /** Number of dice */
  diceCount: number;
  /** Dice type (4, 6, 8, 10, 12) */
  diceType: number;
  /** Type of damage */
  damageType: DamageType;
  /** Additional flat damage */
  bonus?: number;
  /** How damage scales at higher levels */
  scaling?: {
    perLevel: boolean;
    additionalDice?: number;
    additionalBonus?: number;
  };
}

/**
 * Duration specification
 */
export interface Duration {
  type: 'instantaneous' | 'rounds' | 'minutes' | 'hours' | 'days' | 'special' | 'permanent';
  value?: number;
  concentration: boolean;
}

/**
 * Complete spell data structure
 */
export interface SpellData {
  /** Unique identifier (slug) */
  id: string;

  /** Spell name */
  name: string;

  /** Spell level (0=cantrip, 1-9=spell levels) */
  level: SpellLevel;

  /** School of magic */
  school: MagicSchool;

  /** Optional image reference */
  imageUrl?: string | null;

  // ===== CASTING =====
  /** Casting time (action, bonus action, reaction, etc.) */
  castingTime: string;

  /** Can be cast as ritual */
  isRitual: boolean;

  // ===== TARGETING & SPATIAL (CORE COMBAT) =====
  /** Range of the spell */
  range: SpellRange;

  /** How the target is selected */
  targeting: TargetingType;

  /** Effect shape - CORE for combat grid calculations */
  effectShape: SpellEffectShape;

  /** Spatial dimensions - CORE for determining affected squares */
  effectDimensions: EffectDimensions;

  // ===== COMBAT MECHANICS =====
  /** Attack type (spell attack, saving throw, or none) */
  attackType: AttackType;

  /** Saving throw details if applicable */
  savingThrow?: SavingThrow;

  /** Damage details if applicable */
  damage?: SpellDamage;

  /** Additional effects (healing, buffs, etc.) */
  effects?: string[];

  // ===== COMPONENTS & DURATION =====
  /** Spell components required */
  components: {
    verbal: boolean;
    somatic: boolean;
    material: string | null;
  };

  /** Duration of the spell */
  duration: Duration;

  // ===== DESCRIPTION =====
  /** Full spell description */
  description: string;

  /** Effects when cast at higher levels */
  higherLevels?: string;

  // ===== METADATA =====
  /** Classes that can cast this spell */
  classes?: string[];

  /** Source book */
  source?: string;
}

/**
 * Grid position for spatial calculations
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Spell targeting result - which squares are affected
 * Used by combat system to determine damage application
 */
export interface SpellTargetingResult {
  /** Squares that are affected by the spell */
  affectedSquares: GridPosition[];

  /** Squares that provide cover */
  coverSquares?: GridPosition[];

  /** Whether line of sight is required */
  requiresLOS: boolean;

  /** Whether friendly fire is possible */
  canHitAllies: boolean;
}

/**
 * Spell casting validation result
 */
export interface SpellCastingValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
