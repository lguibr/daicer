/**
 * Starting Equipment Packs by Class
 * Defines recommended starting equipment for each D&D 5e class
 *
 * All packs are designed to be under 150gp total cost
 * Players can choose: Take pack + 50g bonus OR Get 100g to buy freely
 */

import type { StartingPack } from '../../types/equipment';
import { MAX_PACK_COST, STARTING_GOLD_CONFIG } from '../../config/equipment';

/**
 * Fighter starting pack (145gp)
 * Chain mail + longsword + shield combo
 */
const FIGHTER_PACK: StartingPack = {
  className: 'Fighter',
  items: [
    { itemIndex: 'longsword', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' },
    { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' }, // 75gp
    { itemIndex: 'dagger', quantity: 2 }, // 4gp - backup weapons
  ],
  totalCostInGold: 100,
};

/**
 * Wizard starting pack
 */
const WIZARD_PACK: StartingPack = {
  className: 'Wizard',
  items: [
    { itemIndex: 'quarterstaff', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'spellbook', quantity: 1 },
    { itemIndex: 'component-pouch', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'book', quantity: 1 },
    { itemIndex: 'ink', quantity: 1 },
    { itemIndex: 'ink-pen', quantity: 1 },
    { itemIndex: 'parchment', quantity: 10 },
    { itemIndex: 'robe', quantity: 1, autoEquip: true, slot: 'armor' },
  ],
  totalCostInGold: 70,
};

/**
 * Rogue starting pack
 */
const ROGUE_PACK: StartingPack = {
  className: 'Rogue',
  items: [
    { itemIndex: 'rapier', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'shortbow', quantity: 1 },
    { itemIndex: 'arrow', quantity: 20 },
    { itemIndex: 'leather-armor', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'dagger', quantity: 2 },
    { itemIndex: 'thieves-tools', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'ball-bearings', quantity: 1 },
    { itemIndex: 'rope-hempen', quantity: 1 },
    { itemIndex: 'crowbar', quantity: 1 },
  ],
  totalCostInGold: 95,
};

/**
 * Cleric starting pack (90gp)
 * Heavy armor divine warrior
 */
const CLERIC_PACK: StartingPack = {
  className: 'Cleric',
  items: [
    { itemIndex: 'club', quantity: 1, autoEquip: true, slot: 'mainHand' }, // Simple weapon
    { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' }, // 10gp
    { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' }, // 75gp
    { itemIndex: 'dagger', quantity: 1 }, // 2gp - backup
  ],
  totalCostInGold: 87,
};

/**
 * Ranger starting pack (70gp)
 * Archer with backup melee
 */
const RANGER_PACK: StartingPack = {
  className: 'Ranger',
  items: [
    { itemIndex: 'longbow', quantity: 1, autoEquip: true, slot: 'mainHand' }, // 50gp
    { itemIndex: 'dagger', quantity: 2 }, // 4gp - melee backup
    { itemIndex: 'leather', quantity: 1, autoEquip: true, slot: 'armor' }, // 10gp (using 'leather' index)
  ],
  totalCostInGold: 64,
};

/**
 * Barbarian starting pack
 */
const BARBARIAN_PACK: StartingPack = {
  className: 'Barbarian',
  items: [
    { itemIndex: 'greataxe', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'handaxe', quantity: 2 },
    { itemIndex: 'hide-armor', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'javelin', quantity: 4 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'bedroll', quantity: 1 },
    { itemIndex: 'rations', quantity: 10 },
    { itemIndex: 'waterskin', quantity: 1 },
    { itemIndex: 'torch', quantity: 10 },
  ],
  totalCostInGold: 55,
};

/**
 * Paladin starting pack (100gp)
 * Holy warrior with heavy armor
 */
const PALADIN_PACK: StartingPack = {
  className: 'Paladin',
  items: [
    { itemIndex: 'longsword', quantity: 1, autoEquip: true, slot: 'mainHand' }, // 15gp
    { itemIndex: 'shield', quantity: 1, autoEquip: true, slot: 'shield' }, // 10gp
    { itemIndex: 'chain-mail', quantity: 1, autoEquip: true, slot: 'armor' }, // 75gp
  ],
  totalCostInGold: 100,
};

/**
 * Bard starting pack
 */
const BARD_PACK: StartingPack = {
  className: 'Bard',
  items: [
    { itemIndex: 'rapier', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'leather-armor', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'dagger', quantity: 1 },
    { itemIndex: 'lute', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'bedroll', quantity: 1 },
    { itemIndex: 'costume', quantity: 2 },
    { itemIndex: 'candle', quantity: 5 },
    { itemIndex: 'rations', quantity: 10 },
  ],
  totalCostInGold: 90,
};

/**
 * Druid starting pack
 */
const DRUID_PACK: StartingPack = {
  className: 'Druid',
  items: [
    { itemIndex: 'quarterstaff', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'leather-armor', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'druidic-focus', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'bedroll', quantity: 1 },
    { itemIndex: 'rations', quantity: 10 },
    { itemIndex: 'waterskin', quantity: 1 },
    { itemIndex: 'torch', quantity: 10 },
    { itemIndex: 'herbalism-kit', quantity: 1 },
  ],
  totalCostInGold: 45,
};

/**
 * Monk starting pack
 */
const MONK_PACK: StartingPack = {
  className: 'Monk',
  items: [
    { itemIndex: 'shortsword', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'dart', quantity: 10 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'bedroll', quantity: 1 },
    { itemIndex: 'rations', quantity: 10 },
    { itemIndex: 'waterskin', quantity: 1 },
    { itemIndex: 'rope-hempen', quantity: 1 },
  ],
  totalCostInGold: 25,
};

/**
 * Sorcerer starting pack
 */
const SORCERER_PACK: StartingPack = {
  className: 'Sorcerer',
  items: [
    { itemIndex: 'light-crossbow', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'crossbow-bolt', quantity: 20 },
    { itemIndex: 'dagger', quantity: 2 },
    { itemIndex: 'component-pouch', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'bedroll', quantity: 1 },
    { itemIndex: 'rations', quantity: 10 },
    { itemIndex: 'torch', quantity: 10 },
  ],
  totalCostInGold: 65,
};

/**
 * Warlock starting pack
 */
const WARLOCK_PACK: StartingPack = {
  className: 'Warlock',
  items: [
    { itemIndex: 'light-crossbow', quantity: 1, autoEquip: true, slot: 'mainHand' },
    { itemIndex: 'crossbow-bolt', quantity: 20 },
    { itemIndex: 'dagger', quantity: 2 },
    { itemIndex: 'leather-armor', quantity: 1, autoEquip: true, slot: 'armor' },
    { itemIndex: 'component-pouch', quantity: 1 },
    { itemIndex: 'backpack', quantity: 1 },
    { itemIndex: 'book', quantity: 1 },
    { itemIndex: 'rations', quantity: 10 },
  ],
  totalCostInGold: 85,
};

/**
 * Map of all starting packs by class name
 * All packs cost under 150gp (MAX_PACK_COST)
 *
 * STARTING OPTIONS FOR PLAYERS:
 * Option 1: Take class pack + 50gp extra (BONUS_WITH_PACK)
 * Option 2: Skip pack and get 100gp to spend freely (FREE_CHOICE_GOLD)
 */
export const STARTING_PACKS: Record<string, StartingPack> = {
  Fighter: FIGHTER_PACK, // 100gp + 50g = Total 150gp value
  Wizard: WIZARD_PACK, // 70gp + 50g = Total 120gp value
  Rogue: ROGUE_PACK, // 95gp + 50g = Total 145gp value
  Cleric: CLERIC_PACK, // 87gp + 50g = Total 137gp value
  Ranger: RANGER_PACK, // 64gp + 50g = Total 114gp value
  Barbarian: BARBARIAN_PACK, // 55gp + 50g = Total 105gp value
  Paladin: PALADIN_PACK, // 100gp + 50g = Total 150gp value
  Bard: BARD_PACK, // 90gp + 50g = Total 140gp value
  Druid: DRUID_PACK, // 45gp + 50g = Total 95gp value
  Monk: MONK_PACK, // 25gp + 50g = Total 75gp value
  Sorcerer: SORCERER_PACK, // 65gp + 50g = Total 115gp value
  Warlock: WARLOCK_PACK, // 85gp + 50g = Total 135gp value
};

/**
 * Get starting pack for a class
 */
export function getStartingPack(className: string): StartingPack | null {
  return STARTING_PACKS[className] || null;
}

/**
 * Get starting gold options for display
 */
export function getStartingGoldOptions() {
  return {
    withPack: STARTING_GOLD_CONFIG.BONUS_WITH_PACK,
    freeChoice: STARTING_GOLD_CONFIG.FREE_CHOICE_GOLD,
    maxPackCost: MAX_PACK_COST,
  };
}
