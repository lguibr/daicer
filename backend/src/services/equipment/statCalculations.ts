/**
 * Equipment Stat Calculations
 * Calculate AC, HP bonuses, attack bonuses, and other stats from equipped items
 */

import { loadEquipmentData, convertToGold } from './equipmentService';
import type { EquippedItems, EquipmentItem } from '../../types/equipment';
import { STAT_EQUIPMENT_SLOTS, VISUAL_EQUIPMENT_SLOTS } from '../../config/equipment';

export interface CharacterStats {
  /** Total Armor Class (base AC + armor + shield + bonuses) */
  totalAC: number;
  /** AC from armor only */
  armorAC: number;
  /** AC from shield */
  shieldAC: number;
  /** Can add DEX modifier to AC? */
  canAddDexToAC: boolean;
  /** Max DEX bonus allowed (null = unlimited) */
  maxDexBonus: number | null;

  /** Total weight carried (for encumbrance) */
  totalWeight: number;

  /** Speed penalty from heavy armor */
  speedPenalty: number;

  /** Disadvantage on stealth? */
  stealthDisadvantage: boolean;

  /** Equipped weapons with damage info */
  equippedWeapons: Array<{
    slot: string;
    name: string;
    damage: string;
    damageType: string;
    properties: string[];
    range?: { normal: number; long?: number };
  }>;

  /** Total gold value of equipped items */
  equippedValue: number;
}

export interface VisualEquipment {
  /** Items that affect character appearance (for AI portrait generation) */
  visualItems: Array<{
    slot: string;
    name: string;
    category: string;
    description?: string;
  }>;
  /** Formatted string for AI prompt */
  visualDescription: string;
}

/**
 * Calculate all combat stats from equipped items
 */
export function calculateCharacterStats(equippedItems: EquippedItems, baseAC: number = 10): CharacterStats {
  const allEquipment = loadEquipmentData();

  let armorAC = 0;
  let shieldAC = 0;
  let canAddDexToAC = true;
  let maxDexBonus: number | null = null;
  let totalWeight = 0;
  let speedPenalty = 0;
  let stealthDisadvantage = false;
  let equippedValue = 0;
  const equippedWeapons: CharacterStats['equippedWeapons'] = [];

  // Iterate through stat-relevant equipment slots
  for (const slot of STAT_EQUIPMENT_SLOTS) {
    const itemIndex = equippedItems[slot];
    if (!itemIndex) continue;

    const item = allEquipment.find((eq) => eq.index === itemIndex);
    if (!item) continue;

    // Add weight
    totalWeight += item.weight;

    // Add value
    equippedValue += convertToGold(item.cost.quantity, item.cost.unit);

    // Calculate armor AC
    if (item.armorClass) {
      if (typeof item.armorClass === 'number') {
        // Shield or simple AC bonus
        shieldAC += item.armorClass;
      } else {
        // Armor with AC calculation
        armorAC = item.armorClass.base;
        canAddDexToAC = item.armorClass.dexBonus;
        maxDexBonus = item.armorClass.maxBonus ?? null;
      }
    }

    // Track weapons
    if (item.damage) {
      equippedWeapons.push({
        slot: slot as string,
        name: item.name,
        damage: item.damage.damageDice,
        damageType: item.damage.damageType,
        properties: item.properties || [],
        range: item.range,
      });
    }

    // Check for heavy armor penalties
    if (item.armorCategory === 'Heavy') {
      stealthDisadvantage = true;
      // TODO: Check if Strength requirement met, apply speed penalty if not
    }
  }

  const totalAC = (armorAC || baseAC) + shieldAC;

  return {
    totalAC,
    armorAC,
    shieldAC,
    canAddDexToAC,
    maxDexBonus,
    totalWeight,
    speedPenalty,
    stealthDisadvantage,
    equippedWeapons,
    equippedValue,
  };
}

/**
 * Get visual equipment for AI portrait generation
 */
export function getVisualEquipment(equippedItems: EquippedItems): VisualEquipment {
  const allEquipment = loadEquipmentData();
  const visualItems: VisualEquipment['visualItems'] = [];

  for (const slot of VISUAL_EQUIPMENT_SLOTS) {
    const itemIndex = equippedItems[slot];
    if (!itemIndex) continue;

    const item = allEquipment.find((eq) => eq.index === itemIndex);
    if (!item) continue;

    visualItems.push({
      slot: slot as string,
      name: item.name,
      category: item.equipmentCategory,
      description: item.description,
    });
  }

  // Build AI-friendly description
  const visualDescription =
    visualItems.length > 0
      ? `Equipped with: ${visualItems.map((v) => `${v.name} (${v.category})`).join(', ')}`
      : 'No equipment visible';

  return {
    visualItems,
    visualDescription,
  };
}

/**
 * Get all equipped item details (for character sheet display)
 */
export function getEquippedItemDetails(equippedItems: EquippedItems): EquipmentItem[] {
  const allEquipment = loadEquipmentData();
  const equipped: EquipmentItem[] = [];

  Object.values(equippedItems).forEach((itemIndex) => {
    if (!itemIndex) return;
    const item = allEquipment.find((eq) => eq.index === itemIndex);
    if (item) equipped.push(item);
  });

  return equipped;
}

/**
 * Calculate attack bonus for a weapon (simplified)
 * Full implementation would factor in character attributes
 */
export function calculateAttackBonus(
  weapon: EquipmentItem,
  strengthMod: number,
  dexterityMod: number
): { attackBonus: number; damageBonus: number; modifier: 'STR' | 'DEX' } {
  const hasFinesse = weapon.properties?.includes('Finesse');
  const isRanged = Boolean(weapon.range);

  // Determine which modifier to use
  let modifier: 'STR' | 'DEX';
  let attackBonus: number;
  let damageBonus: number;

  if (hasFinesse) {
    // Use higher of STR or DEX
    if (dexterityMod > strengthMod) {
      modifier = 'DEX';
      attackBonus = dexterityMod;
      damageBonus = dexterityMod;
    } else {
      modifier = 'STR';
      attackBonus = strengthMod;
      damageBonus = strengthMod;
    }
  } else if (isRanged) {
    modifier = 'DEX';
    attackBonus = dexterityMod;
    damageBonus = dexterityMod;
  } else {
    modifier = 'STR';
    attackBonus = strengthMod;
    damageBonus = strengthMod;
  }

  return {
    attackBonus,
    damageBonus,
    modifier,
  };
}
