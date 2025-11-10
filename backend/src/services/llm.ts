/**
 * LLM service using LangChain for multi-provider support
 */

import { HumanMessage, SystemMessage, AIMessage } from 'langchain';
import { getLLMModel, getFallbackChain } from '@/config/langchain';
import { logger } from '@/utils/logger';
import type { Language } from '@/types/index';

const languageMap: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
};

/**
 * Generate text using primary LLM with fallback
 * @param systemPrompt - System instruction
 * @param userPrompt - User prompt
 * @param language - Response language
 * @returns Generated text
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en'
): Promise<string> {
  const languageName = languageMap[language] || 'English';
  const fullSystemPrompt = `${systemPrompt}

CRITICAL RULES:
- You are THE DUNGEON MASTER, not an AI assistant
- Respond entirely in ${languageName}
- NO meta-text like "Here is...", "Claro, aqui está...", "I'll generate...", "As requested..."
- START IMMEDIATELY with the narrative content
- Use markdown formatting generously

FORBIDDEN phrases:
❌ "Claro, aqui está"
❌ "Here is your"
❌ "I'll create"
❌ "As you requested"
❌ "Let me generate"

CORRECT approach:
✅ Start directly with ### Header or narrative text`;

  const messages = [new SystemMessage(fullSystemPrompt), new HumanMessage(userPrompt)];

  const models = await getFallbackChain();

  for (let i = 0; i < models.length; i += 1) {
    try {
      const model = models[i];
      logger.info(`Attempting LLM generation with provider ${i + 1}/${models.length}`);

      const response = await model.invoke(messages);
      return response.content.toString();
    } catch (error) {
      logger.error(`LLM provider ${i + 1} failed:`, error);

      if (i === models.length - 1) {
        throw new Error('All LLM providers failed');
      }
    }
  }

  throw new Error('All LLM providers failed');
}

/**
 * Generate text with conversation history
 * @param systemPrompt - System instruction
 * @param history - Conversation history
 * @param userMessage - New user message
 * @param language - Response language
 * @returns Generated text
 */
export async function generateWithHistory(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  language: Language = 'en'
): Promise<string> {
  const languageName = languageMap[language] || 'English';
  const fullSystemPrompt = `${systemPrompt}\n\nIMPORTANT: Respond entirely in ${languageName}.`;

  const messages = [
    new SystemMessage(fullSystemPrompt),
    ...history.map((msg) => (msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content))),
    new HumanMessage(userMessage),
  ];

  const model = await getLLMModel();
  try {
    // Generate content
    const response = await model.invoke([messages]);
    const { content } = response.generations[0].message;
    return content.toString();
  } catch (error) {
    logger.error('Error generating text with retry:', error);
    throw new Error('Failed to generate text with history');
  }
}
