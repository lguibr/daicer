/**
 * Equipment System Types
 * Defines types for D&D 5e equipment management
 */

export interface EquipmentCost {
  quantity: number;
  unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
}

export interface EquipmentDamage {
  damageDice: string;
  damageType: string;
}

export interface EquipmentRange {
  normal: number;
  long?: number;
}

export interface EquipmentArmorClass {
  base: number;
  dexBonus?: boolean;
  maxBonus?: number | null;
}

export interface EquipmentItem {
  index: string;
  name: string;
  equipmentCategory: string | { index: string; name: string; url?: string };
  cost: EquipmentCost;
  weight: number;
  damage?: EquipmentDamage;
  range?: EquipmentRange;
  properties?: string[];
  armorClass?: EquipmentArmorClass;
  armorCategory?: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  weaponCategory?: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged';
  desc?: string[];
  description?: string;
}

export interface EquippedItems {
  mainHand: string | null;
  offHand: string | null;
  armor: string | null;
  shield: string | null;
  head: string | null;
  cloak: string | null;
  belt: string | null;
  boots: string | null; // feet
  gloves: string | null; // hands
  ring1: string | null;
  ring2: string | null;
  necklace: string | null;
  accessory1: string | null; // legacy
  accessory2: string | null; // legacy
}

export interface InventoryItem {
  itemIndex: string;
  quantity: number;
}

export interface CharacterEquipment {
  equippedItems: EquippedItems;
  inventory: InventoryItem[];
  totalWeight: number;
}

export interface EquipmentStatModifiers {
  acBonus: number;
  attackBonuses: Array<{
    name: string;
    bonus: string;
    damageType: string;
  }>;
  totalWeight: number;
  speedPenalty: number;
  stealthDisadvantage: boolean;
}

export interface PurchaseTransaction {
  itemIndex: string;
  quantity: number;
  totalCostInGold: number;
}

export interface StartingPack {
  className: string;
  items: Array<{
    itemIndex: string;
    quantity: number;
    autoEquip?: boolean;
    slot?: keyof EquippedItems;
  }>;
  totalCostInGold: number;
}
