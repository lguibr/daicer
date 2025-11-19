/**
 * Character Openings Node (Section 3: Character Setup)
 * Generates personalized opening narrative for a single character
 */

import { task } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateText } from '@/services/llm';
import type { CharacterState } from '@daicer/shared/graph-states';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Task: Generate character opening narrative
 * Wrapped in task() for deterministic replay
 */
const generateOpeningTask = task(
  'generateCharacterOpening',
  async (params: {
    character: any;
    worldHistory: string;
    worldDescription: string;
    language: string;
  }): Promise<string> => {
    const systemPrompt = `You are a Dungeon Master introducing a new character to the campaign.`;

    const userPrompt = `Character: ${params.character.name}, ${params.character.race} ${params.character.characterClass}
Background: ${params.character.background}

World: ${params.worldDescription}

History: ${params.worldHistory}

Create a 2-3 sentence introduction that:
1. Places this character in the world
2. Hints at their background and personality
3. Sets the stage for adventure

Make it immersive and personal!`;

    logger.info('[generateOpeningTask] Generating character opening');
    const lang = params.language as 'en' | 'es' | 'pt-BR';

    return await generateText(systemPrompt, userPrompt, lang, {
      tags: ['character-opening', `character:${params.character.name}`],
    });
  }
);

/**
 * Character openings node
 * Generates personalized introduction for one character
 */
export const characterOpeningsNode = async (
  state: CharacterState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterState>> => {
  const { playerId, character, worldHistory, worldDescription } = state;

  logger.info('[character_openings] Generating opening for character', {
    playerId,
    characterName: character.name,
  });

  // Emit progress
  emitProgress('node_start', { node: 'character_openings', playerId }, config);

  // Generate opening using task
  const openingNarrative = await generateOpeningTask({
    character,
    worldHistory,
    worldDescription,
    language: 'en', // TODO: Get from state if added
  });

  logger.info('[character_openings] Opening generated', {
    playerId,
    narrativeLength: openingNarrative.length,
  });

  // Emit completion
  emitProgress('node_complete', { node: 'character_openings', playerId }, config);

  return {
    openingNarrative,
  };
};
