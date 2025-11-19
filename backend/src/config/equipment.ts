/**
 * Equipment Configuration
 * Central place to configure starting equipment, gold, and pack options
 */

/**
 * Starting Gold Options
 * Players can choose between:
 * 1. Take the standard pack for their class + bonus gold
 * 2. Get more gold to buy freely
 */
export const STARTING_GOLD_CONFIG = {
  /**
   * Bonus gold given when taking the standard pack
   * Default: 50 gp extra spending money
   */
  BONUS_WITH_PACK: 50,

  /**
   * Total gold given when choosing free selection
   * Default: 100 gp to buy whatever you want
   */
  FREE_CHOICE_GOLD: 100,
} as const;

/**
 * Maximum cost for standard starting packs
 * All class packs should be under this value
 */
export const MAX_PACK_COST = 150;

/**
 * Equipment Slots
 * Define what can be equipped where
 */
export const EQUIPMENT_SLOTS = {
  MAIN_HAND: 'mainHand',
  OFF_HAND: 'offHand',
  ARMOR: 'armor',
  SHIELD: 'shield',
  HEAD: 'head',
  NECK: 'neck',
  HANDS: 'hands',
  FEET: 'feet',
  RING_1: 'ring1',
  RING_2: 'ring2',
  BELT: 'belt',
  CLOAK: 'cloak',
} as const;

/**
 * Slots that affect visual appearance in portraits
 * These are sent to AI for character image generation
 */
export const VISUAL_EQUIPMENT_SLOTS = [
  EQUIPMENT_SLOTS.MAIN_HAND,
  EQUIPMENT_SLOTS.OFF_HAND,
  EQUIPMENT_SLOTS.ARMOR,
  EQUIPMENT_SLOTS.SHIELD,
  EQUIPMENT_SLOTS.HEAD,
  EQUIPMENT_SLOTS.CLOAK,
  EQUIPMENT_SLOTS.BELT,
] as const;

/**
 * Slots that affect combat stats (AC, HP, damage, etc.)
 * These are used for stat calculations
 */
export const STAT_EQUIPMENT_SLOTS = [
  EQUIPMENT_SLOTS.MAIN_HAND,
  EQUIPMENT_SLOTS.OFF_HAND,
  EQUIPMENT_SLOTS.ARMOR,
  EQUIPMENT_SLOTS.SHIELD,
  EQUIPMENT_SLOTS.HANDS,
  EQUIPMENT_SLOTS.FEET,
  EQUIPMENT_SLOTS.RING_1,
  EQUIPMENT_SLOTS.RING_2,
  EQUIPMENT_SLOTS.BELT,
] as const;
