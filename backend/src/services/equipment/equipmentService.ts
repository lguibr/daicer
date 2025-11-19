/**
 * Equipment Service
 * Handles equipment management, stat calculations, and inventory operations
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  EquipmentItem,
  EquipmentStatModifiers,
  PurchaseTransaction,
  CharacterEquipment,
  EquippedItems,
} from '../../types/equipment';
import { logger } from '../../utils/logger';
import { getFirestore } from 'firebase-admin/firestore';

let equipmentData: EquipmentItem[] | null = null;

/**
 * Load equipment data from Firestore or seeds
 * Priority: Firestore > Seeds file
 */
export async function loadEquipmentDataAsync(): Promise<EquipmentItem[]> {
  if (equipmentData) {
    return equipmentData;
  }

  try {
    // Try loading from Firestore first (for emulator/production)
    const firestore = getFirestore();
    const equipmentSnapshot = await firestore.collection('equipment').get();

    if (!equipmentSnapshot.empty) {
      equipmentData = equipmentSnapshot.docs.map((doc) => ({
        ...doc.data(),
        index: doc.id,
      })) as EquipmentItem[];
      logger.info(`[EquipmentService] Loaded ${equipmentData.length} equipment items from Firestore`);
      return equipmentData;
    }
  } catch (error) {
    logger.warn('[EquipmentService] Firestore not available, falling back to seeds:', error);
  }

  // Fallback to loading from seeds file
  return loadEquipmentDataFromFile();
}

/**
 * Load equipment data synchronously from seeds (for tests and initial load)
 */
export function loadEquipmentData(): EquipmentItem[] {
  if (equipmentData) {
    return equipmentData;
  }

  return loadEquipmentDataFromFile();
}

/**
 * Load equipment data from JSON file
 */
function loadEquipmentDataFromFile(): EquipmentItem[] {
  try {
    // Try multiple possible paths (for different execution contexts)
    const possiblePaths = [
      join(process.cwd(), 'seeds', 'game-data', 'equipment-items.json'),
      join(process.cwd(), '..', 'seeds', 'game-data', 'equipment-items.json'),
      join(__dirname, '../../../seeds/game-data/equipment-items.json'),
    ];

    let equipmentPath: string | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        equipmentPath = path;
        break;
      }
    }

    if (!equipmentPath) {
      throw new Error('Equipment data file not found in any expected location');
    }

    const rawData = readFileSync(equipmentPath, 'utf-8');
    equipmentData = JSON.parse(rawData) as EquipmentItem[];
    logger.info(`[EquipmentService] Loaded ${equipmentData.length} equipment items from file: ${equipmentPath}`);
    return equipmentData;
  } catch (error) {
    logger.error('[EquipmentService] Error loading equipment data from file:', error);
    throw new Error('Failed to load equipment data');
  }
}

/**
 * Get all equipment items
 */
export function getAllEquipment(): EquipmentItem[] {
  return loadEquipmentData();
}

/**
 * Get equipment item by index
 */
export function getItemByIndex(index: string): EquipmentItem | null {
  const data = loadEquipmentData();
  return data.find((item) => item.index === index) || null;
}

/**
 * Get equipment items by category
 */
export function getItemsByCategory(category: string): EquipmentItem[] {
  const data = loadEquipmentData();
  return data.filter((item) => item.equipmentCategory === category);
}

/**
 * Convert currency to gold pieces
 */
export function convertToGold(quantity: number, unit: string): number {
  const conversionRates: Record<string, number> = {
    cp: 0.01,
    sp: 0.1,
    ep: 0.5,
    gp: 1,
    pp: 10,
  };
  return quantity * (conversionRates[unit] || 1);
}

/**
 * Calculate stat modifiers from equipped items
 */
export function calculateStatModifiers(equippedItems: EquippedItems): EquipmentStatModifiers {
  const data = loadEquipmentData();
  let acBonus = 0;
  const attackBonuses: Array<{ name: string; bonus: string; damageType: string }> = [];
  let totalWeight = 0;
  let speedPenalty = 0;
  let stealthDisadvantage = false;

  Object.values(equippedItems).forEach((itemIndex) => {
    if (!itemIndex) return;

    const item = data.find((eq) => eq.index === itemIndex);
    if (!item) return;

    // Add weight
    totalWeight += item.weight;

    // Calculate armor AC bonus
    if (item.armorClass) {
      acBonus += item.armorClass.base;
    }

    // Add attack bonuses from weapons
    if (item.damage) {
      attackBonuses.push({
        name: item.name,
        bonus: '+0', // Base bonus, modifiers applied from character stats
        damageType: item.damage.damageType,
      });
    }

    // Check for heavy armor penalties
    if (item.armorCategory === 'Heavy') {
      stealthDisadvantage = true;
    }
  });

  return {
    acBonus,
    attackBonuses,
    totalWeight,
    speedPenalty,
    stealthDisadvantage,
  };
}

/**
 * Validate if character can afford purchase
 */
export function validatePurchase(
  itemIndex: string,
  quantity: number,
  currentGold: number
): { valid: boolean; totalCost: number; error?: string } {
  const item = getItemByIndex(itemIndex);

  if (!item) {
    return { valid: false, totalCost: 0, error: 'Item not found' };
  }

  const itemCostInGold = convertToGold(item.cost.quantity, item.cost.unit);
  const totalCost = itemCostInGold * quantity;

  if (totalCost > currentGold) {
    return { valid: false, totalCost, error: 'Insufficient gold' };
  }

  return { valid: true, totalCost };
}

/**
 * Apply purchase to character equipment
 */
export function applyPurchase(
  equipment: CharacterEquipment,
  currentGold: number,
  itemIndex: string,
  quantity: number
): { success: boolean; newEquipment: CharacterEquipment; newGold: number; error?: string } {
  const validation = validatePurchase(itemIndex, quantity, currentGold);

  if (!validation.valid) {
    return {
      success: false,
      newEquipment: equipment,
      newGold: currentGold,
      error: validation.error,
    };
  }

  const item = getItemByIndex(itemIndex);
  if (!item) {
    return {
      success: false,
      newEquipment: equipment,
      newGold: currentGold,
      error: 'Item not found',
    };
  }

  // Check if item already in inventory
  const existingItemIndex = equipment.inventory.findIndex((inv) => inv.itemIndex === itemIndex);

  let newInventory = [...equipment.inventory];
  if (existingItemIndex >= 0) {
    newInventory[existingItemIndex] = {
      ...newInventory[existingItemIndex],
      quantity: newInventory[existingItemIndex].quantity + quantity,
    };
  } else {
    newInventory.push({ itemIndex, quantity });
  }

  const newEquipment: CharacterEquipment = {
    ...equipment,
    inventory: newInventory,
    totalWeight: equipment.totalWeight + item.weight * quantity,
  };

  return {
    success: true,
    newEquipment,
    newGold: currentGold - validation.totalCost,
  };
}

/**
 * Equip item from inventory
 */
export function equipItem(
  equipment: CharacterEquipment,
  slot: keyof EquippedItems,
  itemIndex: string
): { success: boolean; newEquipment: CharacterEquipment; error?: string } {
  // Check if item is in inventory
  const inventoryItem = equipment.inventory.find((inv) => inv.itemIndex === itemIndex);
  if (!inventoryItem) {
    return { success: false, newEquipment: equipment, error: 'Item not in inventory' };
  }

  const item = getItemByIndex(itemIndex);
  if (!item) {
    return { success: false, newEquipment: equipment, error: 'Item not found' };
  }

  // Unequip current item in slot if any
  const currentItem = equipment.equippedItems[slot];
  let newInventory = [...equipment.inventory];

  if (currentItem) {
    // Return current item to inventory
    const existingIndex = newInventory.findIndex((inv) => inv.itemIndex === currentItem);
    if (existingIndex >= 0) {
      newInventory[existingIndex].quantity += 1;
    } else {
      newInventory.push({ itemIndex: currentItem, quantity: 1 });
    }
  }

  // Remove item from inventory
  const itemIndexInInventory = newInventory.findIndex((inv) => inv.itemIndex === itemIndex);
  if (newInventory[itemIndexInInventory].quantity > 1) {
    newInventory[itemIndexInInventory].quantity -= 1;
  } else {
    newInventory = newInventory.filter((inv) => inv.itemIndex !== itemIndex);
  }

  const newEquipment: CharacterEquipment = {
    ...equipment,
    equippedItems: {
      ...equipment.equippedItems,
      [slot]: itemIndex,
    },
    inventory: newInventory,
  };

  return { success: true, newEquipment };
}

/**
 * Unequip item to inventory
 */
export function unequipItem(
  equipment: CharacterEquipment,
  slot: keyof EquippedItems
): { success: boolean; newEquipment: CharacterEquipment; error?: string } {
  const itemIndex = equipment.equippedItems[slot];

  if (!itemIndex) {
    return { success: false, newEquipment: equipment, error: 'No item equipped in slot' };
  }

  // Add item back to inventory
  let newInventory = [...equipment.inventory];
  const existingIndex = newInventory.findIndex((inv) => inv.itemIndex === itemIndex);

  if (existingIndex >= 0) {
    newInventory[existingIndex].quantity += 1;
  } else {
    newInventory.push({ itemIndex, quantity: 1 });
  }

  const newEquipment: CharacterEquipment = {
    ...equipment,
    equippedItems: {
      ...equipment.equippedItems,
      [slot]: null,
    },
    inventory: newInventory,
  };

  return { success: true, newEquipment };
}

/**
 * Get starting gold for a class
 */
export function getStartingGold(className: string): number {
  const startingGoldByClass: Record<string, number> = {
    Barbarian: 50,
    Bard: 125,
    Cleric: 125,
    Druid: 50,
    Fighter: 125,
    Monk: 10,
    Paladin: 125,
    Ranger: 125,
    Rogue: 100,
    Sorcerer: 75,
    Warlock: 100,
    Wizard: 100,
  };

  return startingGoldByClass[className] || 100;
}
