/**
 * Unlock Character Creation Node
 * Allows room owner to unlock character creation after world review
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { getDb } from '@/config/firebase';
import type { RoomManagementState } from '../state';

/**
 * Unlock character creation
 * Updates room state to allow players to create characters
 */
export const unlockCharacterCreationNode = async (
  state: RoomManagementState,
  config?: LangGraphRunnableConfig
): Promise<Partial<RoomManagementState>> => {
  const { roomId } = state;

  logger.info('[unlock_character_creation] Unlocking character creation', { roomId });

  // Update Firestore - set phase to CHARACTER_CREATION
  const db = getDb();
  await db.collection('rooms').doc(roomId).update({
    characterCreationLocked: false,
    phase: 'CHARACTER_CREATION',
    updatedAt: Date.now(),
  });

  logger.info('[unlock_character_creation] Character creation unlocked, phase set to CHARACTER_CREATION', { roomId });

  return {
    characterCreationLocked: false,
    updatedAt: Date.now(),
  };
};
