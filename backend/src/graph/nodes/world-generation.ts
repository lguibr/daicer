/**
 * World Generation Node
 * Generates world description using LLM (wrapped in task for determinism)
 */

import { task } from '@langchain/langgraph';
import { generateText } from '@/services/llm';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../state';

/**
 * Task: Generate world description
 * Wrapped in task() to ensure deterministic replay
 */
const generateWorldTask = task(
  'generateWorld',
  async (params: {
    theme: string;
    setting: string;
    tone: string;
    playerCount: number;
    adventureLength: string;
    difficulty: string;
    startingLevel: number;
    language: string;
  }): Promise<string> => {
    const systemPrompt = `You are a creative Dungeon Master creating a rich D&D 5e world.`;

    const userPrompt = `Create a ${params.adventureLength} ${params.difficulty} adventure for ${params.playerCount} level ${params.startingLevel} characters.
Theme: ${params.theme}
Setting: ${params.setting}
Tone: ${params.tone}

Generate a compelling world description with:
1. The setting and atmosphere
2. The initial hook/quest
3. Key NPCs and factions
4. Potential challenges and encounters

Make it immersive and exciting!`;

    logger.info('Generating world description');
    const lang = params.language as 'en' | 'es' | 'pt-BR';
    return generateText(systemPrompt, userPrompt, lang);
  }
);

/**
 * World generation node
 */
export async function worldGenerationNode(state: CharacterCreationState): Promise<Partial<CharacterCreationState>> {
  const { settings } = state;
  if (!settings) {
    logger.error('No settings found for world generation');
    return {};
  }

  const worldDescription = await generateWorldTask({
    theme: settings.theme,
    setting: settings.setting,
    tone: settings.tone,
    playerCount: settings.playerCount,
    adventureLength: settings.adventureLength,
    difficulty: settings.difficulty,
    startingLevel: settings.startingLevel,
    language: settings.language ?? 'en',
  });

  logger.info('World description generated');

  return {
    worldDescription,
  };
}
