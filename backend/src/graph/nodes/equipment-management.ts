/**
 * Equipment Management Node
 *
 * Applies equipment stat bonuses to character sheets through the LangGraph flow.
 * This ensures all equipment-related state changes follow Rule 4: All State Transitions are Graph Nodes.
 */

import type { GraphState } from '../state';
import { calculateStatModifiers } from '@/services/equipment/equipmentService';
import { logger } from '@/utils/logger';

/**
 * Equipment Management Node
 * Applies equipment stat bonuses to character sheet
 *
 * @param state - Current graph state
 * @returns Partial state with updated players
 */
export async function equipmentManagementNode(state: GraphState): Promise<Partial<GraphState>> {
  logger.info('[EquipmentNode] Processing equipment for all players');

  const updatedPlayers = state.players.map((player) => {
    const character = player.character;

    // Skip if no equipment or old string format
    if (!character.equipment || typeof character.equipment === 'string') {
      logger.debug(`[EquipmentNode] Skipping player ${player.id} - no structured equipment`);
      return player;
    }

    try {
      // Calculate equipment modifiers
      const statMods = calculateStatModifiers(character.equipment.equippedItems);

      logger.info(
        `[EquipmentNode] Player ${player.name}: AC+${statMods.acBonus}, ${statMods.attackBonuses.length} attacks, ${statMods.totalWeight}lb`
      );

      // Apply bonuses (additive, not replacement)
      const updatedCharacter = {
        ...character,
        armorClass: character.armorClass + statMods.acBonus,
        attacks: [...character.attacks, ...statMods.attackBonuses],
        equipment: {
          ...character.equipment,
          totalWeight: statMods.totalWeight,
        },
      };

      return {
        ...player,
        character: updatedCharacter,
      };
    } catch (error) {
      logger.error(`[EquipmentNode] Error processing equipment for player ${player.id}:`, error);
      return player; // Return unchanged on error
    }
  });

  return { players: updatedPlayers };
}
