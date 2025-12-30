/**
 * Centralized structured output utilities for LangChain LLM calls
 * All LLM invocations should use these wrappers to enforce structured outputs
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { Language } from '@daicer/engine';
import { extractErrorDetails, getGeminiModel } from './gemini';
import { type TextGenConfig, GeminiModel } from './types';
import { getPrompt, formatPrompt } from '../prompt';

/**
 * Language name mappings
 */
const languageMap: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
};

/**
 * Build system prompt with language instructions
 */
async function buildSystemPrompt(language: Language, basePrompt: string): Promise<string> {
  const languageName = languageMap[language] || 'English';

  const defaultRules = `

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

  const rulesTemplate = await getPrompt('structured_output_rules', language, defaultRules);

  if (rulesTemplate.includes('{{languageName}}')) {
    const rules = formatPrompt(rulesTemplate, { languageName });
    return `${basePrompt}${rules}`;
  }

  return `${basePrompt}${rulesTemplate}`;
}

/**
 * Internal structured generation with schema validation
 */
// Private function for structured generation
export async function generateStructured<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig & { images?: Buffer[] } = {}
): Promise<z.infer<T>> {
  const fullSystemPrompt = await buildSystemPrompt(language, systemPrompt);

  let messageContent: { type: string; text?: string; image_url?: string }[] = [{ type: 'text', text: userPrompt }];

  if (config.images && config.images.length > 0) {
    messageContent = [
      { type: 'text', text: userPrompt },
      ...config.images.map((img) => ({
        type: 'image_url',
        image_url: `data:image/png;base64,${img.toString('base64')}`,
      })),
    ];
  }

  const messages = [new SystemMessage(fullSystemPrompt), new HumanMessage({ content: messageContent })];

  // Build RunnableConfig for LangChain with metadata and tags
  const runnableConfig: Record<string, unknown> = {};

  if (config.tags || config.userId) {
    const tags = [...(config.tags || [])];
    if (config.userId) {
      tags.push(`user:${config.userId}`);
    }
    runnableConfig.tags = tags;
  }

  if (config.metadata || config.userId) {
    runnableConfig.metadata = {
      ...config.metadata,
      ...(config.userId && { userId: config.userId }),
    };
  }

  // Default to FLASH if not specified or arbitrary string provided
  let geminiModelToken = GeminiModel.FLASH;

  if (config.model) {
    if (Object.values(GeminiModel).includes(config.model as GeminiModel)) {
      geminiModelToken = config.model as GeminiModel;
    }
  }

  const baseModel = getGeminiModel(geminiModelToken, config);
  // Deep type instantiation with Zod/LangChain
  const structuredModel = baseModel.withStructuredOutput(schema);

  try {
    const response = await structuredModel.invoke(messages, runnableConfig);
    return response as z.infer<T>;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[LLM Structured] Gemini ${geminiModelToken} failed:`, extractErrorDetails(error));
    throw error;
  }
}
