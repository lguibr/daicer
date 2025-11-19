/**
 * Equipment Management Node (Section 3: Character Setup)
 * Applies equipment stat bonuses to character sheet
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { calculateStatModifiers } from '@/services/equipment/equipmentService';
import type { CharacterState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Equipment management node
 * Calculates and applies equipment bonuses to character stats
 */
export const equipmentManagementNode = async (
  state: CharacterState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterState>> => {
  const { playerId, character } = state;

  logger.info('[equipment_management] Processing equipment for character', {
    playerId,
    characterName: character.name,
  });

  // Emit progress
  emitProgress('node_start', { node: 'equipment_management', playerId }, config);

  // Skip if no equipment or old string format
  if (!character.equipment || typeof character.equipment === 'string') {
    logger.debug('[equipment_management] Skipping - no structured equipment', { playerId });

    emitProgress('node_complete', { node: 'equipment_management', playerId, skipped: true }, config);

    return {};
  }

  try {
    // Calculate equipment modifiers (check if equipment has equippedItems structure)
    const equipment = character.equipment as any;
    if (!equipment.equippedItems) {
      logger.debug('[equipment_management] No equippedItems found', { playerId });
      return {};
    }

    const statMods = calculateStatModifiers(equipment.equippedItems);

    logger.info('[equipment_management] Equipment modifiers calculated', {
      playerId,
      acBonus: statMods.acBonus,
      attackBonuses: statMods.attackBonuses.length,
      totalWeight: statMods.totalWeight,
    });

    // Apply bonuses (additive, not replacement)
    const updatedCharacter = {
      ...character,
      armorClass: character.armorClass + statMods.acBonus,
      attacks: [...character.attacks, ...statMods.attackBonuses],
      equipment:
        typeof character.equipment === 'string'
          ? character.equipment
          : {
              ...(character.equipment as any),
              totalWeight: statMods.totalWeight,
            },
    };

    // Emit completion
    emitProgress('node_complete', { node: 'equipment_management', playerId, acBonus: statMods.acBonus }, config);

    return {
      character: updatedCharacter,
    };
  } catch (error) {
    logger.error('[equipment_management] Error processing equipment:', error);

    emitProgress('node_error', { node: 'equipment_management', playerId, error: String(error) }, config);

    return {}; // Return unchanged on error
  }
};
