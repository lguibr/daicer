/**
 * Text generation service with LangChain and Gemini
 */

import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import type { Language } from '../../types/index';
import { getFlashModel, getProModel, extractErrorDetails } from './gemini';
import { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';
import { GeminiModel, OpenAIModel, TextGenConfig } from './types';
import { streamManager } from './stream-manager';

const languageMap: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  'pt-BR': 'Brazilian Portuguese',
};

function buildSystemPrompt(language: Language, basePrompt: string): string {
  const languageName = languageMap[language] || 'English';
  return `${basePrompt}

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
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<string> {
  const fullSystemPrompt = buildSystemPrompt(language, systemPrompt);
  const messages = [new SystemMessage(fullSystemPrompt), new HumanMessage(userPrompt)];

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

  console.log('[LLM] Generation requested', {
    language,
    model: config.model || 'flash-with-fallback',
  });

  // Simplified Model Selection Logic for Port
  let model;
  if (config.model && Object.values(OpenAIModel).includes(config.model as any)) {
    model = getGPT5MiniModel(config); // Simplified mapping
  } else {
    // Default to Gemini Flash
    model = getFlashModel(config);
  }

  try {
    const streamId = config.metadata?.streamId as string | undefined;

    if (streamId) {
      let fullText = '';
      const stream = await model.stream(messages, runnableConfig);

      for await (const chunk of stream) {
        const content = chunk.content.toString();
        fullText += content;
        streamManager.emitText(streamId, content);
      }
      return fullText;
    }

    const response = await model.invoke(messages, runnableConfig);
    return response.content.toString();
  } catch (error) {
    console.error(`[LLM] failed:`, extractErrorDetails(error));
    throw error;
  }
}
