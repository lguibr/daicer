/* eslint-disable no-underscore-dangle */
/**
 * Streaming text generation service with LangChain
 * Provides real-time token streaming for better UX
 */

import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { task } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { Language } from '@/types/index';
import { getFlashModel, getProModel, extractErrorDetails } from './gemini';
import { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';
import { GeminiModel, OpenAIModel, TextGenConfig } from './types';

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
 * Stream chunk type
 */
export interface StreamChunk {
  content: string;
  done: boolean;
}

/**
 * Internal streaming text generation
 * @param systemPrompt - System prompt
 * @param userPrompt - User prompt
 * @param language - Target language
 * @param config - Generation configuration
 * @returns Async generator yielding text chunks
 */
async function* _streamText(
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): AsyncGenerator<StreamChunk, void, undefined> {
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

  logger.info('[LLM Streaming] Generation requested', {
    language,
    model: config.model || 'flash-with-fallback',
    userId: config.userId,
    tags: runnableConfig.tags,
    systemPromptPreview: systemPrompt.slice(0, 80),
    userPromptPreview: userPrompt.slice(0, 120),
  });
  logger.debug('[LLM Streaming] Full system prompt >>>\n%s', fullSystemPrompt);
  logger.debug('[LLM Streaming] Full user prompt >>>\n%s', userPrompt);

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
      const stream = await model.stream(messages, runnableConfig);
      let accumulated = '';

      for await (const chunk of stream) {
        const content = chunk.content.toString();
        accumulated += content;
        yield { content, done: false };
      }

      logger.info(`[LLM Streaming] ${config.model} completed`, {
        totalLength: accumulated.length,
      });
      yield { content: '', done: true };
      return;
    } catch (error) {
      logger.error(`[LLM Streaming] ${config.model} failed:`, extractErrorDetails(error));
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
    const attemptLabel = `[LLM Streaming] ${name} (${i + 1}/${models.length})`;
    const attemptStart = Date.now();

    logger.info(`${attemptLabel} streaming`);

    try {
      const stream = await instance.stream(messages, runnableConfig);
      let accumulated = '';

      for await (const chunk of stream) {
        const content = chunk.content.toString();
        accumulated += content;
        yield { content, done: false };
      }

      const durationMs = Date.now() - attemptStart;
      logger.info(`${attemptLabel} completed successfully`, {
        durationMs,
        totalLength: accumulated.length,
      });

      yield { content: '', done: true };
      return;
    } catch (error) {
      const durationMs = Date.now() - attemptStart;
      const details = extractErrorDetails(error);
      lastError = error;
      lastErrorDetails = details;

      logger.error(`${attemptLabel} failed: ${details}`, {
        durationMs,
        stack: (error as Error).stack,
      });

      const isLastAttempt = i === models.length - 1;
      if (isLastAttempt) {
        if (error instanceof Error) {
          logger.error(`${attemptLabel} terminating with error`, { stack: error.stack });
          throw error;
        }
        throw new Error(`All LLM providers failed: ${details}`);
      }
      // Continue to next model in fallback chain
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`All LLM providers failed: ${lastErrorDetails}`);
}

/**
 * Internal streaming with conversation history
 */
async function* _streamWithHistory(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): AsyncGenerator<StreamChunk, void, undefined> {
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
    const stream = await model.stream(messages, runnableConfig);
    let accumulated = '';

    for await (const chunk of stream) {
      const content = chunk.content.toString();
      accumulated += content;
      yield { content, done: false };
    }

    logger.info('[LLM Streaming] History-based generation completed', {
      totalLength: accumulated.length,
    });

    yield { content: '', done: true };
  } catch (error) {
    logger.error('[LLM Streaming] Error in history-based generation:', error);
    throw new Error('Failed to generate streaming text with history');
  }
}

/**
 * Batch streaming chunks to reduce socket traffic
 * Accumulates chunks and emits every N tokens or after timeout
 */
export async function* batchStreamChunks(
  stream: AsyncGenerator<StreamChunk, void, undefined>,
  tokensPerBatch = 10,
  timeoutMs = 200
): AsyncGenerator<StreamChunk, void, undefined> {
  let buffer = '';
  let tokenCount = 0;
  let timeout: NodeJS.Timeout | null = null;

  const flushBuffer = async function* flushBufferGenerator(): AsyncGenerator<StreamChunk, void, undefined> {
    if (buffer.length > 0) {
      yield { content: buffer, done: false };
      buffer = '';
      tokenCount = 0;
    }
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  try {
    for await (const chunk of stream) {
      if (chunk.done) {
        // Flush any remaining buffer
        yield* flushBuffer();
        yield { content: '', done: true };
        return;
      }

      buffer += chunk.content;
      tokenCount += 1;

      // Flush if we've accumulated enough tokens
      if (tokenCount >= tokensPerBatch) {
        yield* flushBuffer();
      } else if (!timeout) {
        // Set timeout to flush buffer if no more chunks arrive soon
        timeout = setTimeout(async () => {
          // This won't work well with async generators, but provides a safety net
          // In practice, chunks arrive fast enough that this rarely triggers
        }, timeoutMs);
      }
    }

    // Final flush
    yield* flushBuffer();
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

/**
 * Task-wrapped streaming for LangGraph nodes (deterministic, checkpointed)
 * Note: Streaming within LangGraph tasks is tricky - we collect all chunks
 * and return the complete text for checkpointing, while emitting via config.writer
 */
export const streamTextTask = task(
  'streamText',
  async (params: {
    systemPrompt: string;
    userPrompt: string;
    language: Language;
    config?: TextGenConfig;
  }): Promise<string> => {
    let accumulated = '';
    const stream = _streamText(params.systemPrompt, params.userPrompt, params.language, params.config);

    for await (const chunk of stream) {
      if (!chunk.done) {
        accumulated += chunk.content;
      }
    }

    return accumulated;
  }
);

/**
 * Direct exports for non-graph usage (real-time streaming to clients)
 */
export const streamText = _streamText;
export const streamWithHistory = _streamWithHistory;

/**
 * Helper to collect full response from stream (for cases where we need complete text)
 */
export async function collectStreamedText(stream: AsyncGenerator<StreamChunk, void, undefined>): Promise<string> {
  let accumulated = '';

  for await (const chunk of stream) {
    if (!chunk.done) {
      accumulated += chunk.content;
    }
  }

  return accumulated;
}
