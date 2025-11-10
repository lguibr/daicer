/**
 * Character Openings Node
 * Generates personalized opening narratives for each character
 */

import { task } from '@langchain/langgraph';
import { generateCharacterOpenings as generateOpeningsService } from '@/services/game';
import { logger } from '@/utils/logger';
import type { Message } from '@/types/index';

/**
 * Task: Generate character openings
 * Wrapped in task() for deterministic replay
 */
import type { Player } from '@/types/index';
import type { GameState } from '../state';

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
    return generateOpeningsService(
      params.worldDescription,
      params.players,
      lang
    );
  }
);

/**
 * Character openings node
 * Generates personalized introductions when all players are ready
 */
export async function characterOpeningsNode(state: GameState): Promise<Partial<GameState>> {
  const { openings, mainMessage } = await generateOpeningsTask({
    worldDescription: state.worldDescription,
    players: state.players as Player[],
    language: state.settings?.language ?? 'en',
  });

  // Create message objects
  const mainMsg: Message = {
    id: `msg-${Date.now()}-dm`,
    sender: 'DM',
    text: mainMessage,
    timestamp: Date.now(),
  };

  const personalMessages: Message[] = openings.map(opening => ({
    id: `msg-${Date.now()}-dm-${opening.playerId}`,
    sender: 'DM',
    text: opening.message,
    recipientId: opening.playerId,
    timestamp: Date.now(),
  }));

  logger.info('Character openings generated');

  return {
    messages: [mainMsg, ...personalMessages],
    phase: 'GAMEPLAY',
  };
}

