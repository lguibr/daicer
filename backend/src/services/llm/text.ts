/* eslint-disable no-underscore-dangle */
/**
 * Text generation service with LangChain and Gemini
 *
 * @deprecated This module provides legacy unstructured text generation.
 * For new code, use generateStructured from './structured' with a Zod schema.
 *
 * Migration path:
 * - generateText() → generateStructured(NarrativeResponseSchema, ...)
 * - generateTextWithModel() → generateStructuredWithModel(schema, model, ...)
 */

import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { Language } from '@/types/index';
import { getFlashModel, getProModel, extractErrorDetails } from './gemini';
import { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';
import { GeminiModel, OpenAIModel, TextGenConfig } from './types';
import { streamManager } from './stream-manager';

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

/**
 * Internal text generation with fallback
 */
async function _generateText(
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<string> {
  const fullSystemPrompt = buildSystemPrompt(language, systemPrompt);
  const messages = [new SystemMessage(fullSystemPrompt), new HumanMessage(userPrompt)];

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

  logger.info('[LLM] Generation requested', {
    language,
    model: config.model || 'flash-with-fallback',
    userId: config.userId,
    tags: runnableConfig.tags,
    systemPromptPreview: systemPrompt.slice(0, 80),
    userPromptPreview: userPrompt.slice(0, 120),
  });
  logger.debug('[LLM] Full system prompt >>>\n%s', fullSystemPrompt);
  logger.debug('[LLM] Full user prompt >>>\n%s', userPrompt);

  // If explicit model specified, use it without fallback
  if (config.model) {
    let model;

    // OpenAI GPT-5 models (with strict JSON mode)
    if (config.model === OpenAIModel.GPT_5_1) {
      model = getGPT51Model(config);
    } else if (config.model === OpenAIModel.GPT_5_MINI) {
      model = getGPT5MiniModel(config);
    } else if (config.model === OpenAIModel.GPT_5_NANO) {
      model = getGPT5NanoModel(config);
    } else if (config.model === OpenAIModel.GPT_5_PRO) {
      model = getGPT5ProModel(config);
    } else {
      // Default to GPT-5 mini
      model = getGPT5MiniModel(config);
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
      logger.error(`[LLM] ${config.model} failed:`, extractErrorDetails(error));
      throw error;
    }
  }

  // GPT-5 mini ONLY - fastest and cheapest that works well
  const models = [{ name: 'GPT-5 Mini', instance: getGPT5MiniModel(config) }];

  let lastError: unknown;
  let lastErrorDetails = 'Unknown error';

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    // eslint-disable-next-line no-continue
    if (!model) continue;

    const { name, instance } = model;
    const attemptLabel = `[LLM] ${name} (${i + 1}/${models.length})`;
    const attemptStart = Date.now();

    logger.info(`${attemptLabel} invoking`);

    try {
      const streamId = config.metadata?.streamId as string | undefined;

      if (streamId) {
        let fullText = '';
        const stream = await instance.stream(messages, runnableConfig);

        for await (const chunk of stream) {
          const content = chunk.content.toString();
          fullText += content;
          streamManager.emitText(streamId, content);
        }

        const durationMs = Date.now() - attemptStart;
        logger.info(`${attemptLabel} succeeded (streaming)`, { durationMs });
        logger.debug(`${attemptLabel} raw response >>>\n%s`, fullText);
        return fullText;
      }

      const response = await instance.invoke(messages, runnableConfig);
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
 * Internal text generation with explicit model
 */
async function _generateTextWithModel(
  model: GeminiModel.FLASH | GeminiModel.PRO,
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<string> {
  return _generateText(systemPrompt, userPrompt, language, { ...config, model });
}

/**
 * Internal text generation with conversation history
 */
async function _generateWithHistory(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<string> {
  const languageName = languageMap[language] || 'English';
  const fullSystemPrompt = `${systemPrompt}\n\nIMPORTANT: Respond entirely in ${languageName}.`;

  const messages = [
    new SystemMessage(fullSystemPrompt),
    ...history.map((msg) => (msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content))),
    new HumanMessage(userMessage),
  ];

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

  const model = config.model === GeminiModel.PRO ? getProModel(config) : getFlashModel(config);

  try {
    const response = await model.invoke(messages, runnableConfig);
    return response.content.toString();
  } catch (error) {
    logger.error('Error generating text with history:', error);
    throw new Error('Failed to generate text with history');
  }
}

/**
 * Task-wrapped exports for LangGraph nodes (deterministic, checkpointed)
 */
export const generateTextTask = task('generateText', _generateText);
export const generateTextWithModelTask = task('generateTextWithModel', _generateTextWithModel);
export const generateWithHistoryTask = task('generateWithHistory', _generateWithHistory);

/**
 * Direct exports for non-graph usage (API endpoints, one-off calls)
 */
export const generateText = _generateText;
export const generateTextWithModel = _generateTextWithModel;
export const generateWithHistory = _generateWithHistory;
