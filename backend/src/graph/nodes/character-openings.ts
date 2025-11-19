/**
 * Character Openings Node
 * Generates personalized opening narratives for each character
 */

import { task } from '@langchain/langgraph';
import { generateCharacterOpenings as generateOpeningsService } from '@/services/game';
import { logger } from '@/utils/logger';
import type { Message, Player } from '@/types/index';
import type { CharacterCreationState } from '../state';

/**
 * Task: Generate character openings
 * Wrapped in task() for deterministic replay
 */

const generateOpeningsTask = task(
  'generateCharacterOpenings',
  async (params: {
    worldDescription: string;
    players: Player[];
    language: string;
  }): Promise<{
    openings: Array<{ playerId: string; message: string }>;
    mainMessage: string;
  }> => {
    logger.info('Generating character openings');
    const lang = params.language as 'en' | 'es' | 'pt-BR';
    return generateOpeningsService(params.worldDescription, params.players, lang);
  }
);

/**
 * Character openings node (wrapped with tracing)
 * Generates personalized introductions when all players are ready
 */
export const characterOpeningsNode = async (
  state: CharacterCreationState
): Promise<Partial<CharacterCreationState>> => {
  // Get language from settings with fallback chain
  const language = state.settings?.language || 'en';

  logger.info(`Character openings using language: ${language}`);

  const { openings, mainMessage } = await generateOpeningsTask({
    worldDescription: state.worldDescription,
    players: state.players as Player[],
    language,
  });

  // Create message objects
  const mainMsg: Message = {
    id: `msg-${Date.now()}-dm`,
    sender: 'DM',
    text: mainMessage,
    timestamp: Date.now(),
  };

  const personalMessages: Message[] = openings.map((opening) => ({
    id: `msg-${Date.now()}-dm-${opening.playerId}`,
    sender: 'DM',
    text: opening.message,
    recipientId: opening.playerId,
    timestamp: Date.now(),
  }));

  logger.info('Character openings generated');

  return {
    messages: [mainMsg, ...personalMessages],
  };
};
