/**
 * D&D 5e Equipment Items (Common Weapons & Armor)
 * Note: This is a subset of the full equipment list for core items
 */

export interface EquipmentCost {
  quantity: number;
  unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

export interface EquipmentDamage {
  damageDice: string;
  damageType: string;
}

export interface EquipmentItem {
  index: string;
  name: string;
  equipmentCategory: string;
  cost: EquipmentCost;
  weight: number;
  description?: string;
  damage?: EquipmentDamage;
  armorClass?: number | { base: number; dexBonus: boolean; maxBonus?: number };
  range?: { normal: number; long?: number };
  properties?: string[];
}

// Common weapons
export const COMMON_WEAPONS: readonly EquipmentItem[] = [
  {
    index: 'club',
    name: 'Club',
    equipmentCategory: 'Weapon',
    cost: { quantity: 1, unit: 'sp' },
    weight: 2,
    damage: { damageDice: '1d4', damageType: 'bludgeoning' },
    properties: ['Light'],
  },
  {
    index: 'dagger',
    name: 'Dagger',
    equipmentCategory: 'Weapon',
    cost: { quantity: 2, unit: 'gp' },
    weight: 1,
    damage: { damageDice: '1d4', damageType: 'piercing' },
    range: { normal: 20, long: 60 },
    properties: ['Finesse', 'Light', 'Thrown'],
  },
  {
    index: 'greataxe',
    name: 'Greataxe',
    equipmentCategory: 'Weapon',
    cost: { quantity: 30, unit: 'gp' },
    weight: 7,
    damage: { damageDice: '1d12', damageType: 'slashing' },
    properties: ['Heavy', 'Two-Handed'],
  },
  {
    index: 'greatsword',
    name: 'Greatsword',
    equipmentCategory: 'Weapon',
    cost: { quantity: 50, unit: 'gp' },
    weight: 6,
    damage: { damageDice: '2d6', damageType: 'slashing' },
    properties: ['Heavy', 'Two-Handed'],
  },
  {
    index: 'longsword',
    name: 'Longsword',
    equipmentCategory: 'Weapon',
    cost: { quantity: 15, unit: 'gp' },
    weight: 3,
    damage: { damageDice: '1d8', damageType: 'slashing' },
    properties: ['Versatile'],
  },
  {
    index: 'shortbow',
    name: 'Shortbow',
    equipmentCategory: 'Weapon',
    cost: { quantity: 25, unit: 'gp' },
    weight: 2,
    damage: { damageDice: '1d6', damageType: 'piercing' },
    range: { normal: 80, long: 320 },
    properties: ['Ammunition', 'Two-Handed'],
  },
  {
    index: 'longbow',
    name: 'Longbow',
    equipmentCategory: 'Weapon',
    cost: { quantity: 50, unit: 'gp' },
    weight: 2,
    damage: { damageDice: '1d8', damageType: 'piercing' },
    range: { normal: 150, long: 600 },
    properties: ['Ammunition', 'Heavy', 'Two-Handed'],
  },
] as const;

// Common armor
export const COMMON_ARMOR: readonly EquipmentItem[] = [
  {
    index: 'padded',
    name: 'Padded',
    equipmentCategory: 'Armor',
    cost: { quantity: 5, unit: 'gp' },
    weight: 8,
    armorClass: { base: 11, dexBonus: true },
  },
  {
    index: 'leather',
    name: 'Leather',
    equipmentCategory: 'Armor',
    cost: { quantity: 10, unit: 'gp' },
    weight: 10,
    armorClass: { base: 11, dexBonus: true },
  },
  {
    index: 'chain-mail',
    name: 'Chain Mail',
    equipmentCategory: 'Armor',
    cost: { quantity: 75, unit: 'gp' },
    weight: 55,
    armorClass: { base: 16, dexBonus: false },
  },
  {
    index: 'plate',
    name: 'Plate',
    equipmentCategory: 'Armor',
    cost: { quantity: 1500, unit: 'gp' },
    weight: 65,
    armorClass: { base: 18, dexBonus: false },
  },
  {
    index: 'shield',
    name: 'Shield',
    equipmentCategory: 'Armor',
    cost: { quantity: 10, unit: 'gp' },
    weight: 6,
    armorClass: 2,
    description: 'A shield increases your Armor Class by 2',
  },
] as const;

export const EQUIPMENT_ITEMS = [...COMMON_WEAPONS, ...COMMON_ARMOR] as const;
