/**
 * Text generation service with LangChain and Gemini
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Language } from '@daicer/engine';
import { getFlashModel, extractErrorDetails } from './gemini';
import { TextGenConfig } from './types';
import { streamManager } from './stream-manager';
import { getPrompt } from '../prompt';

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
  systemPromptKeyOrContent: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('[LLM] No API key found, using mock text');
    return mockGenerator(config);
  }

  try {
    // 1. Fetch system prompt from DB (assuming arg is a key, falling back to using it as content)
    // We treat the argument as the default text if lookup fails, OR we can enforce it being a key.
    // Given the refactor request, let's assume the caller might pass a key like 'dm_system_instruction'.
    const systemInstruction = await getPrompt(systemPromptKeyOrContent, language, systemPromptKeyOrContent);

    const model = getFlashModel();
    const preamble = buildSystemPrompt(language, systemInstruction);

    // Create chain with system prompt and user prompt
    const messages = [new SystemMessage(preamble), new HumanMessage(userPrompt)];

    const response = await model.invoke(messages);
    const content = response.content.toString();

    // Stream result if streamId provided
    const streamId = config.metadata?.streamId as string | undefined;
    if (streamId) {
      // Stream in chunks to the frontend
      const chunks = content.split(/(?=[,.\n])/);
      for (const chunk of chunks) {
        if (chunk) {
          streamManager.emitText(streamId, chunk);
          await new Promise((r) => setTimeout(r, 20)); // Small delay for effect
        }
      }
    }

    return content;
  } catch (error) {
    console.error('[LLM] generateText Error:', extractErrorDetails(error));
    // Fallback to mock on error
    return mockGenerator(config);
  }
}

function mockGenerator(config: TextGenConfig): string {
  const mockText = `[MOCK] The adventure begins! 
  
  You find yourselves standing at the edge of the known world. The wind howls, carrying whispers of ancient secrets.
  
  What do you do?`;

  const streamId = config.metadata?.streamId as string | undefined;

  if (streamId) {
    const chunks = mockText.split(/(?=[,.\n])/);
    chunks.forEach((chunk, i) => {
      setTimeout(() => streamManager.emitText(streamId, chunk), i * 50);
    });
  }
  return mockText;
}
