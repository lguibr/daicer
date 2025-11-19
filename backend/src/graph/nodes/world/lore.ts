/**
 * World Lore Node
 * Generates main world description incorporating history
 */

import { task } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateText, streamText } from '@/services/llm';
import type { CharacterCreationState } from '../../state';
import { createStreamChannel } from '@/utils/stream-channel';

/**
 * Task: Generate world description with streaming
 * Wrapped in task() to ensure deterministic replay
 */
const generateWorldLoreTask = task(
  'generateWorldLore',
  async (
    params: {
      theme: string;
      setting: string;
      tone: string;
      playerCount: number;
      adventureLength: string;
      difficulty: string;
      startingLevel: number;
      language: string;
      roomId?: string;
      worldHistory?: string;
    },
    config?: LangGraphRunnableConfig
  ): Promise<string> => {
    const systemPrompt = `You are a creative Dungeon Master creating a rich D&D 5e world.`;

    let userPrompt = `Create a ${params.adventureLength} ${params.difficulty} adventure for ${params.playerCount} level ${params.startingLevel} characters.
Theme: ${params.theme}
Setting: ${params.setting}
Tone: ${params.tone}

`;

    // Include historical context if available
    if (params.worldHistory) {
      userPrompt += `**World History:**\n${params.worldHistory}\n\n`;
      userPrompt += `Use this rich history as context for your world description. Reference key events, structures, and themes from the history.\n\n`;
    }

    userPrompt += `Generate a compelling world description with:
1. The setting and atmosphere
2. The initial hook/quest
3. Key NPCs and factions
4. Potential challenges and encounters

Make it immersive and exciting!`;

    logger.info('[generateWorldLoreTask] Generating world description with streaming');
    const lang = params.language as 'en' | 'es' | 'pt-BR';

    // Check if streaming is supported via config
    const writer = config?.configurable?.writer;
    if (writer) {
      const stream = streamText(systemPrompt, userPrompt, lang, {
        tags: ['world-generation', params.roomId ? `room:${params.roomId}` : undefined].filter(Boolean) as string[],
      });

      let accumulated = '';

      for await (const chunk of stream) {
        if (!chunk.done) {
          accumulated += chunk.content;
          // Emit streaming chunk via LangGraph writer
          writer({
            type: 'world_lore_chunk',
            content: chunk.content,
            accumulated,
          });
        }
      }

      logger.info('[generateWorldLoreTask] World description generated with streaming', {
        length: accumulated.length,
      });
      return accumulated;
    }

    // Fallback to non-streaming
    return generateText(systemPrompt, userPrompt, lang);
  }
);

/**
 * Generate world lore/description
 * Creates main narrative description of the world
 */
export const worldLoreNode = async (
  state: CharacterCreationState,
  config?: LangGraphRunnableConfig
): Promise<Partial<CharacterCreationState>> => {
  const { roomId, settings, worldHistory } = state;

  logger.info('[world_lore] Generating world description', {
    roomId,
    hasHistory: !!worldHistory,
  });

  // Create stream channel
  const stream = createStreamChannel(config);

  // Emit phase start
  stream.emit({
    type: 'phase_start',
    phase: 'lore',
  });

  // Generate world description
  const worldDescription = await generateWorldLoreTask(
    {
      theme: settings!.theme,
      setting: settings!.setting,
      tone: settings!.tone,
      playerCount: settings!.playerCount,
      adventureLength: settings!.adventureLength,
      difficulty: settings!.difficulty,
      startingLevel: settings!.startingLevel || 1,
      language: settings!.language ?? 'en',
      roomId,
      worldHistory: worldHistory?.overallSummary,
    },
    config
  );

  logger.info('[world_lore] World description generated', {
    length: worldDescription.length,
  });

  // Emit phase complete
  stream.emit({
    type: 'phase_complete',
    phase: 'lore',
  });

  return {
    worldDescription,
    worldGenProgress: {
      phase: 'lore',
      error: null,
      retryCount: 0,
    },
    streamEvents: [
      {
        type: 'phase_complete',
        phase: 'lore',
        timestamp: Date.now(),
      },
    ],
  };
};
