/**
 * World Lore Node (Section 2: World Config)
 * Generates main world description incorporating history
 */

import { task } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import { generateText, streamText } from '@/services/llm';
import type { WorldConfigState } from '@daicer/shared/graph-states/world-config-state';
import { emitProgress } from '@/graph/shared-nodes/stream-progress';

/**
 * Task: Generate world description with streaming
 * Wrapped in task() to ensure deterministic replay
 */
const generateWorldLoreTask = task(
  'generateWorldLore',
  async (
    params: {
      roomId: string;
      worldHistory: string;
      structureCount: number;
      language: string;
    },
    config?: LangGraphRunnableConfig
  ): Promise<string> => {
    const systemPrompt = `You are a creative Dungeon Master creating a rich D&D 5e world.`;

    const userPrompt =
      `**World History:**\n${params.worldHistory}\n\n` +
      `Using this rich history as context, generate a compelling world description that brings the setting to life.\n\n` +
      `The world contains ${params.structureCount} significant structures from this history.\n\n` +
      `Generate a description with:\n` +
      `1. The current state of the world\n` +
      `2. Key locations and their significance\n` +
      `3. The atmosphere and tone\n` +
      `4. Potential hooks for adventure\n\n` +
      `Make it immersive and exciting!`;

    logger.info('[generateWorldLoreTask] Generating world description');
    const lang = params.language as 'en' | 'es' | 'pt-BR';

    // Check if streaming is supported
    const writer = config?.configurable?.writer;
    if (writer) {
      const stream = streamText(systemPrompt, userPrompt, lang, {
        tags: ['world-lore', `room:${params.roomId}`],
      });

      let accumulated = '';
      for await (const chunk of stream) {
        if (!chunk.done) {
          accumulated += chunk.content;
          writer({
            type: 'world_lore_chunk',
            content: chunk.content,
            accumulated,
          });
        }
      }
      return accumulated;
    }

    // Non-streaming fallback
    return await generateText(systemPrompt, userPrompt, lang, {
      tags: ['world-lore', `room:${params.roomId}`],
    });
  }
);

/**
 * Generate world lore
 * Final synthesizing node that creates overall world description
 * Uses worldHistory as fallback if LLM generation fails
 */
export const generateLoreNode = async (
  state: WorldConfigState,
  config?: LangGraphRunnableConfig
): Promise<Partial<WorldConfigState>> => {
  const { roomId, worldHistory, structures } = state;

  logger.info('[generate_lore] Generating world description', {
    roomId,
    historyLength: worldHistory.length,
    structureCount: structures.length,
  });

  // Emit progress
  emitProgress('node_start', { node: 'generate_lore' }, config);

  let worldDescription = worldHistory; // Fallback to history

  try {
    // Generate lore using task with 30s timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Lore generation timeout')), 30000)
    );

    const lorePromise = generateWorldLoreTask(
      {
        roomId,
        worldHistory,
        structureCount: structures.length,
        language: 'en', // TODO: Get from state
      },
      config
    );

    worldDescription = await Promise.race([lorePromise, timeoutPromise]);

    logger.info('[generate_lore] World description generated', {
      descriptionLength: worldDescription.length,
    });
  } catch (error) {
    logger.warn('[generate_lore] LLM generation failed, using history as description', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // worldDescription already set to worldHistory as fallback
  }

  // Emit completion
  emitProgress('node_complete', { node: 'generate_lore' }, config);

  return {
    worldDescription,
  };
};
