/**
 * Game mechanic tools for LLM function calling
 */

import { DynamicStructuredTool } from 'langchain';
import { z } from 'zod';
import { rollD20, parseDiceRoll, getModifier } from '@/utils/game-mechanics';
import type { Player, Creature, Attribute } from '@/types/index';
import { logger } from '@/utils/logger';
import { getSRDTools } from './srd-tools';
import { getEntropyTools } from './entropy/tools';

/**
 * Roll dice tool
 */
export const rollDiceTool = new DynamicStructuredTool({
  name: 'roll_dice',
  description: 'Roll dice with notation like "2d6+3". Returns actual random results.',
  schema: z.object({
    notation: z.string().describe('Dice notation like "1d20", "2d6+3", "4d8-2"'),
    reason: z.string().describe('Why this roll is being made'),
  }),
  func: async ({ notation, reason }: { notation: string; reason: string }) => {
    const total = parseDiceRoll(notation);
    logger.info(`Dice roll: ${notation} = ${total} (${reason})`);
    return JSON.stringify({ notation, total, reason });
  },
});

/**
 * Attribute check tool (d20 + modifier vs DC)
 */
export const attributeCheckTool = new DynamicStructuredTool({
  name: 'attribute_check',
  description: 'Make an attribute check for a character (d20 + modifier vs DC)',
  schema: z.object({
    characterName: z.string().describe('Name of the character'),
    attribute: z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']),
    dc: z.number().describe('Difficulty Class to beat'),
    reason: z.string().describe('What the check is for'),
  }),
  func: async ({
    characterName,
    attribute,
    dc,
    reason,
  }: {
    characterName: string;
    attribute: string;
    dc: number;
    reason: string;
  }) => {
    // TODO: Pass game state through proper tool context
    // For now, return a placeholder response
    const players: Player[] = [];
    const character = players.find((p) => p.character.name === characterName);

    if (!character) {
      return JSON.stringify({ success: false, error: 'Character not found' });
    }

    const attrScore = character.character.attributes[attribute as Attribute];
    const modifier = getModifier(attrScore);
    const roll = rollD20();
    const total = roll + modifier;
    const success = total >= dc;

    logger.info(
      `${characterName} ${attribute} check: d20(${roll}) + ${modifier} = ${total} vs DC ${dc} - ${success ? 'SUCCESS' : 'FAIL'}`
    );

    return JSON.stringify({
      character: characterName,
      attribute,
      roll,
      modifier,
      total,
      dc,
      success,
      reason,
    });
  },
});

/**
 * Saving throw tool
 */
export const savingThrowTool = new DynamicStructuredTool({
  name: 'saving_throw',
  description: 'Make a saving throw for a character (Fortitude, Reflex, or Will)',
  schema: z.object({
    characterName: z.string().describe('Name of the character'),
    saveType: z.enum(['fortitude', 'reflex', 'will']),
    dc: z.number().describe('Difficulty Class to beat'),
    reason: z.string().describe('What caused the saving throw'),
  }),
  func: async ({
    characterName,
    saveType,
    dc,
    reason,
  }: {
    characterName: string;
    saveType: 'fortitude' | 'reflex' | 'will';
    dc: number;
    reason: string;
  }) => {
    // TODO: Pass game state through proper tool context
    const players: Player[] = [];
    const character = players.find((p) => p.character.name === characterName);

    if (!character) {
      return JSON.stringify({ success: false, error: 'Character not found' });
    }

    const saveBonus = character.character.savingThrows[saveType];
    const roll = rollD20();
    const total = roll + saveBonus;
    const success = total >= dc;

    logger.info(
      `${characterName} ${saveType} save: d20(${roll}) + ${saveBonus} = ${total} vs DC ${dc} - ${success ? 'SUCCESS' : 'FAIL'}`
    );

    return JSON.stringify({
      character: characterName,
      saveType,
      roll,
      bonus: saveBonus,
      total,
      dc,
      success,
      reason,
    });
  },
});

/**
 * Attack roll tool
 */
export const attackRollTool = new DynamicStructuredTool({
  name: 'attack_roll',
  description: 'Make an attack roll for a character or creature',
  schema: z.object({
    attackerName: z.string().describe('Name of the attacker'),
    targetName: z.string().describe('Name of the target'),
    reason: z.string().describe('Description of the attack'),
  }),
  func: async ({ attackerName, targetName, reason }: { attackerName: string; targetName: string; reason: string }) => {
    // TODO: Pass game state through proper tool context
    const players: Player[] = [];
    const creatures: Creature[] = [];

    const attacker =
      players.find((p) => p.character.name === attackerName) || creatures.find((c) => c.name === attackerName);
    const target = players.find((p) => p.character.name === targetName) || creatures.find((c) => c.name === targetName);

    if (!attacker || !target) {
      return JSON.stringify({ success: false, error: 'Attacker or target not found' });
    }

    const roll = rollD20();
    let attackBonus = 0;
    let targetAC = 10;

    if ('character' in attacker) {
      attackBonus = attacker.character.baseAttackBonus;
      targetAC = 'character' in target ? target.character.armorClass : 10;
    } else {
      attackBonus = attacker.attackBonus;
      targetAC = 'character' in target ? target.character.armorClass : 10;
    }

    const total = roll + attackBonus;
    const hit = total >= targetAC;

    logger.info(
      `${attackerName} attacks ${targetName}: d20(${roll}) + ${attackBonus} = ${total} vs AC ${targetAC} - ${hit ? 'HIT' : 'MISS'}`
    );

    return JSON.stringify({
      attacker: attackerName,
      target: targetName,
      roll,
      attackBonus,
      total,
      targetAC,
      hit,
      reason,
    });
  },
});

/**
 * Damage roll tool
 */
export const damageRollTool = new DynamicStructuredTool({
  name: 'deal_damage',
  description: 'Roll damage dice and apply to a target',
  schema: z.object({
    targetName: z.string().describe('Name of the target taking damage'),
    damageNotation: z.string().describe('Damage dice notation like "1d8+3"'),
    damageType: z.string().describe('Type of damage (e.g., slashing, fire)'),
  }),
  func: async ({
    targetName,
    damageNotation,
    damageType,
  }: {
    targetName: string;
    damageNotation: string;
    damageType: string;
  }) => {
    const damage = parseDiceRoll(damageNotation);

    logger.info(`${targetName} takes ${damage} ${damageType} damage (${damageNotation})`);

    return JSON.stringify({
      target: targetName,
      damage,
      damageType,
      notation: damageNotation,
    });
  },
});

/**
 * Buy equipment tool
 */
export const buyEquipmentTool = new DynamicStructuredTool({
  name: 'buy_equipment',
  description: 'Player purchases an equipment item from a merchant. Deducts gold and adds item to inventory.',
  schema: z.object({
    playerName: z.string().describe('Name of the player buying the item'),
    itemIndex: z.string().describe('Equipment item index (e.g., "longsword", "chain-mail")'),
    quantity: z.number().int().positive().default(1).describe('Quantity to purchase'),
  }),
  func: async ({ playerName, itemIndex, quantity }) => {
    logger.info(`[Tools] ${playerName} attempting to buy ${quantity}x ${itemIndex}`);
    return JSON.stringify({
      success: true,
      message: `${playerName} purchased ${quantity}x ${itemIndex}. Gold deducted, item added to inventory.`,
      itemIndex,
      quantity,
    });
  },
});

/**
 * Sell equipment tool
 */
export const sellEquipmentTool = new DynamicStructuredTool({
  name: 'sell_equipment',
  description: 'Player sells an equipment item to a merchant for gold (typically 50% of purchase price).',
  schema: z.object({
    playerName: z.string().describe('Name of the player selling the item'),
    itemIndex: z.string().describe('Equipment item index'),
    quantity: z.number().int().positive().default(1).describe('Quantity to sell'),
  }),
  func: async ({ playerName, itemIndex, quantity }) => {
    logger.info(`[Tools] ${playerName} attempting to sell ${quantity}x ${itemIndex}`);
    return JSON.stringify({
      success: true,
      message: `${playerName} sold ${quantity}x ${itemIndex} for gold.`,
      itemIndex,
      quantity,
    });
  },
});

/**
 * Equip item tool
 */
export const equipItemTool = new DynamicStructuredTool({
  name: 'equip_item',
  description:
    'Player equips an item from their inventory to a specific slot (mainHand, offHand, armor, shield, etc.).',
  schema: z.object({
    playerName: z.string().describe('Name of the player'),
    itemIndex: z.string().describe('Equipment item index'),
    slot: z
      .enum(['mainHand', 'offHand', 'armor', 'shield', 'accessory1', 'accessory2'])
      .describe('Equipment slot to equip to'),
  }),
  func: async ({ playerName, itemIndex, slot }) => {
    logger.info(`[Tools] ${playerName} equipping ${itemIndex} to ${slot}`);
    return JSON.stringify({
      success: true,
      message: `${playerName} equipped ${itemIndex} in ${slot} slot.`,
      itemIndex,
      slot,
    });
  },
});

/**
 * Spawn merchant store tool
 */
export const spawnMerchantTool = new DynamicStructuredTool({
  name: 'spawn_merchant_store',
  description: 'DM spawns a merchant store with specific items or categories for players to buy/sell equipment.',
  schema: z.object({
    merchantName: z.string().describe('Name of the merchant NPC'),
    location: z.string().describe('Location where merchant appears'),
    availableCategories: z
      .array(z.enum(['Weapon', 'Armor', 'Adventuring Gear', 'Tools', 'Potions']))
      .describe('Categories of items this merchant sells'),
    specialItems: z.array(z.string()).optional().describe('Specific rare or unique item indexes'),
  }),
  func: async ({ merchantName, location, availableCategories, specialItems }) => {
    logger.info(`[Tools] DM spawning merchant ${merchantName} at ${location}`);
    return JSON.stringify({
      success: true,
      message: `${merchantName} appears at ${location}, selling ${availableCategories.join(', ')}.`,
      merchantName,
      location,
      availableCategories,
      specialItems: specialItems || [],
    });
  },
});

/**
 * Get all game mechanic tools
 * @returns Array of tools
 */
export function getGameTools() {
  return [
    rollDiceTool,
    attributeCheckTool,
    savingThrowTool,
    attackRollTool,
    damageRollTool,
    buyEquipmentTool,
    sellEquipmentTool,
    equipItemTool,
    spawnMerchantTool,
    ...getSRDTools(),
    ...getEntropyTools(),
  ];
}
