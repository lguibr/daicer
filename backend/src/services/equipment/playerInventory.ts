/**
 * Player Inventory Service
 * Manages player equipment, inventory, and equipped items
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getItemByIndex } from './equipmentService';
import { getStartingPack } from './startingPacks';

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  weight?: number;
  value?: {
    amount: number;
    currency: string;
  };
  quantity: number;
  slot?: string;
}

export interface EquippedItems {
  mainHand?: InventoryItem;
  offHand?: InventoryItem;
  armor?: InventoryItem;
  shield?: InventoryItem;
  helmet?: InventoryItem;
  gloves?: InventoryItem;
  boots?: InventoryItem;
  ring1?: InventoryItem;
  ring2?: InventoryItem;
  necklace?: InventoryItem;
  cloak?: InventoryItem;
}

export interface PlayerEquipment {
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
}

/**
 * Get player's inventory and equipped items
 */
export async function getPlayerEquipment(roomId: string, playerId: string): Promise<PlayerEquipment> {
  const firestore = getFirestore();
  const playerDoc = await firestore.collection('rooms').doc(roomId).collection('players').doc(playerId).get();

  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};

  return {
    inventory: character.inventory || [],
    equippedItems: character.equippedItems || {},
  };
}

/**
 * Add item to player inventory
 * Handles item stacking for identical items
 */
export async function addItemToInventory(
  roomId: string,
  playerId: string,
  item: InventoryItem
): Promise<PlayerEquipment> {
  const firestore = getFirestore();
  const playerRef = firestore.collection('rooms').doc(roomId).collection('players').doc(playerId);

  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};
  const inventory: InventoryItem[] = character.inventory || [];

  // Check if item already exists in inventory (for stacking)
  const existingItemIndex = inventory.findIndex((i) => i.id === item.id);

  if (existingItemIndex >= 0) {
    // Stack identical items
    inventory[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    inventory.push(item);
  }

  await playerRef.update({
    'character.inventory': inventory,
  });

  return {
    inventory,
    equippedItems: character.equippedItems || {},
  };
}

/**
 * Remove item from player inventory
 */
export async function removeItemFromInventory(
  roomId: string,
  playerId: string,
  itemId: string
): Promise<PlayerEquipment> {
  const firestore = getFirestore();
  const playerRef = firestore.collection('rooms').doc(roomId).collection('players').doc(playerId);

  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};
  const inventory: InventoryItem[] = character.inventory || [];

  const itemIndex = inventory.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Item not found in inventory');
  }

  // Remove item
  inventory.splice(itemIndex, 1);

  await playerRef.update({
    'character.inventory': inventory,
  });

  return {
    inventory,
    equippedItems: character.equippedItems || {},
  };
}

/**
 * Equip item from inventory
 */
export async function equipItem(
  roomId: string,
  playerId: string,
  itemId: string,
  slot: string
): Promise<PlayerEquipment> {
  const firestore = getFirestore();
  const playerRef = firestore.collection('rooms').doc(roomId).collection('players').doc(playerId);

  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};
  const inventory: InventoryItem[] = character.inventory || [];
  const equippedItems: EquippedItems = character.equippedItems || {};

  // Find item in inventory
  const item = inventory.find((i) => i.id === itemId);
  if (!item) {
    throw new Error('Item not found in inventory');
  }

  // Equip item (item stays in inventory but also gets equipped)
  equippedItems[slot as keyof EquippedItems] = item;

  await playerRef.update({
    'character.equippedItems': equippedItems,
  });

  return {
    inventory,
    equippedItems,
  };
}

/**
 * Unequip item from slot
 */
export async function unequipItem(roomId: string, playerId: string, slot: string): Promise<PlayerEquipment> {
  const firestore = getFirestore();
  const playerRef = firestore.collection('rooms').doc(roomId).collection('players').doc(playerId);

  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};
  const inventory: InventoryItem[] = character.inventory || [];
  const equippedItems: EquippedItems = character.equippedItems || {};

  // Check if slot has an item
  if (!equippedItems[slot as keyof EquippedItems]) {
    throw new Error('No item equipped in that slot');
  }

  // Remove item from slot
  delete equippedItems[slot as keyof EquippedItems];

  await playerRef.update({
    'character.equippedItems': equippedItems,
  });

  return {
    inventory,
    equippedItems,
  };
}

/**
 * Apply starting equipment pack to player
 */
export async function applyStartingPack(
  roomId: string,
  playerId: string,
  packName: string,
  characterClass: string
): Promise<PlayerEquipment> {
  const pack = getStartingPack(packName.toLowerCase());

  if (!pack) {
    throw new Error('Starting pack not found for this class');
  }

  const firestore = getFirestore();
  const playerRef = firestore.collection('rooms').doc(roomId).collection('players').doc(playerId);

  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) {
    throw new Error('Player not found');
  }

  const playerData = playerDoc.data();
  const character = playerData?.character || {};
  const inventory: InventoryItem[] = character.inventory || [];
  const equippedItems: EquippedItems = character.equippedItems || {};

  // Convert pack items to inventory items
  for (const packItem of pack.items) {
    const equipmentItem = getItemByIndex(packItem.itemIndex);
    if (!equipmentItem) {
      continue;
    }

    const inventoryItem: InventoryItem = {
      id: equipmentItem.index,
      name: equipmentItem.name,
      type: equipmentItem.equipment_category.name.toLowerCase(),
      weight: equipmentItem.weight,
      value: equipmentItem.cost
        ? {
            amount: equipmentItem.cost.quantity,
            currency: equipmentItem.cost.unit,
          }
        : undefined,
      quantity: packItem.quantity || 1,
      slot: packItem.slot,
    };

    inventory.push(inventoryItem);

    // Auto-equip if specified
    if (packItem.autoEquip && packItem.slot) {
      equippedItems[packItem.slot as keyof EquippedItems] = inventoryItem;
    }
  }

  await playerRef.update({
    'character.inventory': inventory,
    'character.equippedItems': equippedItems,
  });

  return {
    inventory,
    equippedItems,
  };
}
