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

function extractErrorDetails(error: unknown): string {
  if (!error) return 'Unknown error';

  if (error instanceof Error) {
    const status =
      (error as { status?: number }).status ?? (error as { response?: { status?: number } }).response?.status;
    const { code } = error as { code?: string };
    const details = (error as { response?: { data?: unknown } }).response?.data;

    const parts = [
      error.name,
      status ? `status=${status}` : null,
      code ? `code=${code}` : null,
      error.message ? `message=${error.message}` : null,
      details ? `details=${JSON.stringify(details)}` : null,
    ].filter(Boolean);

    return parts.join(' | ');
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
}

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
  const fullSystemPrompt = buildSystemPrompt(language, systemPrompt);
  const messages = [new SystemMessage(fullSystemPrompt), new HumanMessage(userPrompt)];

  logger.info('[LLM] Generation requested', {
    language,
    systemPromptPreview: systemPrompt.slice(0, 80),
    userPromptPreview: userPrompt.slice(0, 120),
  });
  logger.debug('[LLM] Full system prompt >>>\n%s', fullSystemPrompt);
  logger.debug('[LLM] Full user prompt >>>\n%s', userPrompt);

  const models = await getFallbackChain();
  let lastError: unknown;
  let lastErrorDetails = 'Unknown error';

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    const attemptLabel = `[LLM] Provider ${i + 1}/${models.length}`;

    if (!model) {
      logger.warn(`${attemptLabel} missing model instance`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const attemptStart = Date.now();
    logger.info(`${attemptLabel} invoking`);

    try {
      const response = await model.invoke(messages);
      const durationMs = Date.now() - attemptStart;

      logger.info(`${attemptLabel} succeeded`, { durationMs });
      const content = response.content.toString();
      logger.debug(`${attemptLabel} raw response >>>\n%s`, content);
      return content;
    } catch (error) {
      const durationMs = Date.now() - attemptStart;
      const details = extractErrorDetails(error);
      lastError = error;
      lastErrorDetails = details;

      logger.error(`${attemptLabel} failed: ${details}`, { durationMs, stack: (error as Error).stack });

      const isLastAttempt = i === models.length - 1;
      if (isLastAttempt) {
        if (error instanceof Error) {
          logger.error(`${attemptLabel} terminating with error`, { stack: error.stack });
          throw error;
        }
        throw new Error(`All LLM providers failed: ${details}`);
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`All LLM providers failed: ${lastErrorDetails}`);
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
    const response = await model.invoke(messages);
    return response.content.toString();
  } catch (error) {
    logger.error('Error generating text with retry:', error);
    throw new Error('Failed to generate text with history');
  }
}
