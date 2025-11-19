/**
 * Equipment Test Fixtures
 * Mock equipment items for testing with proper types
 */

import type { EquipmentItem } from '@/types/equipment';

/**
 * Mock weapon: Longsword
 */
export const mockLongsword: EquipmentItem = {
  index: 'longsword',
  name: 'Longsword',
  equipmentCategory: 'Weapon',
  weaponCategory: 'Martial Melee',
  cost: { quantity: 15, unit: 'gp' },
  weight: 3,
  damage: {
    damageDice: '1d8',
    damageType: 'slashing',
  },
  properties: ['Versatile'],
  desc: ['A versatile martial melee weapon.'],
};

/**
 * Mock weapon: Shortsword
 */
export const mockShortsword: EquipmentItem = {
  index: 'shortsword',
  name: 'Shortsword',
  equipmentCategory: 'Weapon',
  weaponCategory: 'Martial Melee',
  cost: { quantity: 10, unit: 'gp' },
  weight: 2,
  damage: {
    damageDice: '1d6',
    damageType: 'piercing',
  },
  properties: ['Finesse', 'Light'],
  desc: ['A light martial melee weapon.'],
};

/**
 * Mock armor: Chain Mail
 */
export const mockChainMail: EquipmentItem = {
  index: 'chain-mail',
  name: 'Chain Mail',
  equipmentCategory: 'Armor',
  armorCategory: 'Heavy',
  cost: { quantity: 75, unit: 'gp' },
  weight: 55,
  armorClass: {
    base: 16,
    dexBonus: false,
  },
  desc: ['Heavy armor made of interlocking metal rings.'],
};

/**
 * Mock armor: Leather Armor
 */
export const mockLeatherArmor: EquipmentItem = {
  index: 'leather-armor',
  name: 'Leather Armor',
  equipmentCategory: 'Armor',
  armorCategory: 'Light',
  cost: { quantity: 10, unit: 'gp' },
  weight: 10,
  armorClass: {
    base: 11,
    dexBonus: true,
  },
  desc: ['Light armor made of hardened leather.'],
};

/**
 * Mock gear: Backpack
 */
export const mockBackpack: EquipmentItem = {
  index: 'backpack',
  name: 'Backpack',
  equipmentCategory: 'Adventuring Gear',
  cost: { quantity: 2, unit: 'gp' },
  weight: 5,
  desc: ['A leather backpack with multiple compartments.'],
};

/**
 * Mock gear: Rope (50 feet)
 */
export const mockRope: EquipmentItem = {
  index: 'rope-hempen-50-feet',
  name: 'Rope, Hempen (50 feet)',
  equipmentCategory: 'Adventuring Gear',
  cost: { quantity: 1, unit: 'gp' },
  weight: 10,
  desc: ['Rope has 2 hit points and can be burst with a DC 17 Strength check.'],
};

/**
 * Mock gear: Torch
 */
export const mockTorch: EquipmentItem = {
  index: 'torch',
  name: 'Torch',
  equipmentCategory: 'Adventuring Gear',
  cost: { quantity: 1, unit: 'cp' },
  weight: 1,
  desc: ['A torch burns for 1 hour, providing bright light in a 20-foot radius.'],
};

/**
 * Mock gear: Bedroll
 */
export const mockBedroll: EquipmentItem = {
  index: 'bedroll',
  name: 'Bedroll',
  equipmentCategory: 'Adventuring Gear',
  cost: { quantity: 1, unit: 'gp' },
  weight: 7,
  desc: ['A simple bedroll for sleeping on the ground.'],
};

/**
 * Complete mock equipment dataset
 */
export const mockEquipmentData: EquipmentItem[] = [
  mockLongsword,
  mockShortsword,
  mockChainMail,
  mockLeatherArmor,
  mockBackpack,
  mockRope,
  mockTorch,
  mockBedroll,
];

/**
 * Get mock equipment by category
 */
export function getMockEquipmentByCategory(category: string): EquipmentItem[] {
  return mockEquipmentData.filter((item) => item.equipmentCategory === category);
}

/**
 * Get mock equipment by index
 */
export function getMockEquipmentByIndex(index: string): EquipmentItem | null {
  return mockEquipmentData.find((item) => item.index === index) || null;
}
