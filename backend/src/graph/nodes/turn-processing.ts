/**
 * Turn Processing Node
 * Processes player actions and generates DM response
 */

import { task } from '@langchain/langgraph';
import { processTurn as processTurnService } from '@/services/game';
import { logger } from '@/utils/logger';
import type { Message, Player, Creature } from '@/types/index';
import type { GameplayState } from '../state';
import { entropyAdvancementNode } from './entropy-advancement';

/**
 * Task: Process game turn with LLM
 * Wrapped in task() for deterministic replay
 */

const processTurnTask = task(
  'processGameTurn',
  async (params: {
    worldDescription: string;
    messages: Message[];
    players: Player[];
    creatures: Creature[];
    language: string;
    worldConditions?: any[];
  }): Promise<{
    overall_summary: string;
    player_perspectives: Array<{ playerName: string; perspective: string }>;
  }> => {
    logger.info('Processing turn with LLM');
    const lang = params.language as 'en' | 'es' | 'pt-BR';
    return processTurnService(
      params.worldDescription,
      params.messages,
      params.players,
      params.creatures,
      lang,
      undefined,
      params.worldConditions
    );
  }
);

/**
 * Turn processing node (wrapped with tracing)
 * Generates DM response based on player actions
 */
export const turnProcessingNode = async (state: GameplayState): Promise<Partial<GameplayState>> => {
  // Add player action messages first
  const players = state.players as Player[];
  const messages = state.messages as Message[];
  const creatures = state.creatures as Creature[];

  const actionMessages: Message[] = players
    .filter((p) => p.action)
    .map((p) => ({
      id: `msg-${Date.now()}-${p.id}`,
      sender: p.character.name,
      text: p.action!,
      timestamp: Date.now(),
    }));

  // Get language from settings with fallback
  const language = state.settings?.language || 'en';

  logger.info(`Turn processing using language: ${language}`);

  // Process turn with LLM
  const dmResponse = await processTurnTask({
    worldDescription: state.worldDescription,
    messages: [...messages, ...actionMessages],
    players,
    creatures,
    language,
    worldConditions: state.worldConditions || [],
  });

  // Create DM message
  const summaryMessage: Message = {
    id: `msg-${Date.now()}-dm-summary`,
    sender: 'DM',
    text: dmResponse.overall_summary,
    timestamp: Date.now(),
  };

  // Create perspective messages
  const perspectiveMessages: Message[] = dmResponse.player_perspectives.map((p) => {
    const player = players.find((pl) => pl.character.name === p.playerName);
    return {
      id: `msg-${Date.now()}-dm-perspective-${player?.id}`,
      sender: 'DM',
      text: p.perspective,
      recipientId: player?.id,
      timestamp: Date.now(),
    };
  });

  // Clear player actions
  const updatedPlayers = players.map((p) => ({
    ...p,
    action: null,
  }));

  logger.info('Turn processed successfully');

  // Advance entropy system
  const entropyUpdates = await entropyAdvancementNode(state);

  return {
    messages: [...actionMessages, summaryMessage, ...perspectiveMessages],
    players: updatedPlayers,
    ...entropyUpdates,
  };
};
