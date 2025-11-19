/**
 * Centralized structured output utilities for LangChain LLM calls
 * All LLM invocations should use these wrappers to enforce structured outputs
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { task } from '@langchain/langgraph';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import type { Language } from '@/types/index';
import { getFlashModel, getProModel, extractErrorDetails } from './gemini';
import { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';
import { GeminiModel, OpenAIModel, type TextGenConfig } from './types';
import { createMetricsTracker } from '@/middleware/llm-metrics';

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
 * Note: No need to mention JSON - function calling handles structure
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
 * Internal structured generation with schema validation
 */
// Private function for structured generation
async function internalGenerateStructured<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<z.infer<T>> {
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

  logger.info('[LLM Structured] Generation requested', {
    language,
    model: config.model || 'flash-with-fallback',
    userId: config.userId,
    schema: schema.description || 'unnamed',
    tags: runnableConfig.tags,
    systemPromptPreview: systemPrompt.slice(0, 80),
    userPromptPreview: userPrompt.slice(0, 120),
  });
  logger.debug('[LLM Structured] Full system prompt >>>\n%s', fullSystemPrompt);
  logger.debug('[LLM Structured] Full user prompt >>>\n%s', userPrompt);

  // If explicit model specified, use it without fallback
  if (config.model) {
    let baseModel;

    // OpenAI GPT-5 models (with strict JSON mode)
    if (config.model === OpenAIModel.GPT_5_1) {
      baseModel = getGPT51Model(config);
    } else if (config.model === OpenAIModel.GPT_5_MINI) {
      baseModel = getGPT5MiniModel(config);
    } else if (config.model === OpenAIModel.GPT_5_NANO) {
      baseModel = getGPT5NanoModel(config);
    } else if (config.model === OpenAIModel.GPT_5_PRO) {
      baseModel = getGPT5ProModel(config);
    } else {
      // Default to GPT-5 mini if unknown model
      baseModel = getGPT5MiniModel(config);
    }

    // Use Structured Outputs with strict: true for OpenAI models
    // This ensures schema adherence without hallucinations
    const structuredModel = baseModel.withStructuredOutput(schema, {
      method: 'jsonSchema',
      strict: true,
      includeRaw: false,
    });

    // Track metrics
    const metrics = createMetricsTracker(
      'generateStructured',
      config.model,
      runnableConfig.tags as string[],
      config.userId
    );

    try {
      // LangChain's withStructuredOutput() already validates against the Zod schema
      const response = await structuredModel.invoke(messages, runnableConfig);
      logger.debug('[LLM Structured] Response >>>\n%s', JSON.stringify(response, null, 2));

      // Log success metrics
      metrics.logSuccess(response);

      // Response is already validated and typed by LangChain
      return response as z.infer<T>;
    } catch (error) {
      logger.error(`[LLM Structured] ${config.model} failed:`, extractErrorDetails(error));

      // Log failure metrics
      metrics.logFailure(error as Error);

      throw error;
    }
  }

  // GPT-5 mini ONLY - fastest and cheapest that works well
  const modelFactories = [{ name: 'GPT-5 Mini', factory: () => getGPT5MiniModel(config) }];

  let lastError: unknown;
  let lastErrorDetails = 'Unknown error';

  // Track metrics across retries
  const metrics = createMetricsTracker(
    'generateStructured',
    'GPT-5 Mini (with fallback)',
    runnableConfig.tags as string[],
    config.userId
  );

  for (let i = 0; i < modelFactories.length; i += 1) {
    const modelFactory = modelFactories[i];
    const { name, factory } = modelFactory;

    const attemptLabel = `[LLM Structured] ${name} (${i + 1}/${modelFactories.length})`;
    const attemptStart = Date.now();

    logger.info(`${attemptLabel} invoking`);

    // Track retry count
    if (i > 0) {
      metrics.incrementRetry();
    }

    try {
      // Lazy creation - only create model when needed
      const instance = factory();
      logger.debug(`${attemptLabel} model instance created`);

      // OpenAI GPT-5 models use Structured Outputs with strict: true
      // This ensures the output always adheres to the Zod schema
      logger.debug(`${attemptLabel} configuring structured output...`);
      const structuredModel = instance.withStructuredOutput(schema, {
        method: 'jsonSchema',
        strict: true,
        includeRaw: false,
      });
      logger.debug(`${attemptLabel} structured output configured, invoking model...`);

      // LangChain's withStructuredOutput() already validates against the Zod schema
      const response = await structuredModel.invoke(messages, runnableConfig);
      const durationMs = Date.now() - attemptStart;

      logger.info(`${attemptLabel} succeeded`, { durationMs });
      logger.debug(`${attemptLabel} raw response >>>\n%s`, JSON.stringify(response, null, 2));

      // Log success metrics
      metrics.logSuccess(response);

      // Response is already validated and typed by LangChain
      return response as z.infer<T>;
    } catch (error) {
      const durationMs = Date.now() - attemptStart;
      const details = extractErrorDetails(error);

      lastError = error;
      lastErrorDetails = details;

      logger.error(`${attemptLabel} failed: ${details}`, { durationMs, stack: (error as Error).stack });

      const isLastAttempt = i === modelFactories.length - 1;
      if (isLastAttempt) {
        // Log failure metrics on final attempt
        metrics.logFailure(error as Error);

        if (error instanceof Error) {
          logger.error(`${attemptLabel} terminating with error`, { stack: error.stack });
          throw error;
        }
        throw new Error(`All LLM providers failed: ${details}`);
      }

      logger.info(`${attemptLabel} falling back to next model`);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`All LLM providers failed: ${lastErrorDetails}`);
}

/**
 * Internal structured generation with explicit model
 */
// Private function for structured generation with specific model
async function internalGenerateStructuredWithModel<T extends z.ZodType>(
  schema: T,
  model: GeminiModel.FLASH | GeminiModel.PRO,
  systemPrompt: string,
  userPrompt: string,
  language: Language = 'en',
  config: TextGenConfig = {}
): Promise<z.infer<T>> {
  return internalGenerateStructured(schema, systemPrompt, userPrompt, language, { ...config, model });
}

/**
 * Task-wrapped exports for LangGraph nodes (deterministic, checkpointed)
 */
export const generateStructuredTask = task('generateStructured', internalGenerateStructured);
export const generateStructuredWithModelTask = task('generateStructuredWithModel', internalGenerateStructuredWithModel);

/**
 * Direct exports for non-graph usage (API endpoints, one-off calls)
 */
export const generateStructured = internalGenerateStructured;
export const generateStructuredWithModel = internalGenerateStructuredWithModel;
