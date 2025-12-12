/**
 * Centralized structured output utilities for LangChain LLM calls
 * All LLM invocations should use these wrappers to enforce structured outputs
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { Language } from '../../types/index';
import { extractErrorDetails } from './gemini';
import { getGPT51Model, getGPT5MiniModel, getGPT5NanoModel, getGPT5ProModel } from './openai';
import { OpenAIModel, type TextGenConfig } from './types';
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
 * Internal structured generation with schema validation
 */
// Private function for structured generation
export async function generateStructured<T extends z.ZodType>(
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

  console.log('[LLM Structured] Generation requested', {
    language,
    model: config.model || 'flash-with-fallback',
    userId: config.userId,
    schema: schema.description || 'unnamed',
    tags: runnableConfig.tags,
  });

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
    const structuredModel = baseModel.withStructuredOutput(schema as any, {
      method: 'jsonSchema',
      strict: true,
      includeRaw: false,
    });

    try {
      let response;
      const streamId = config.metadata?.streamId as string | undefined;

      if (streamId) {
        const stream = await structuredModel.streamEvents(messages, {
          ...runnableConfig,
          version: 'v2',
        });

        let rootRunId: string | undefined;

        for await (const event of stream) {
          if (!rootRunId && event.event === 'on_chain_start') {
            rootRunId = event.run_id;
          }

          if (event.event === 'on_chat_model_stream') {
            const chunk = event.data.chunk;
            if (chunk.content) {
              streamManager.emitText(streamId, chunk.content.toString());
            } else if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
              const args = chunk.tool_call_chunks[0].args;
              if (args) streamManager.emitText(streamId, args);
            }
          }

          if (event.event === 'on_chain_end' && event.run_id === rootRunId) {
            response = event.data.output;
          }
        }

        if (!response) {
          throw new Error('Stream ended without output');
        }
      } else {
        response = await structuredModel.invoke(messages, runnableConfig);
      }

      console.debug('[LLM Structured] Response received');
      return response as z.infer<T>;
    } catch (error) {
      console.error(`[LLM Structured] ${config.model} failed:`, extractErrorDetails(error));
      throw error;
    }
  }

  // GPT-5 mini ONLY - fastest and cheapest that works well
  // We removed fallback logic for simplicity in CMS port for now, defaulting to OpenAI GPT-5 Mini
  // But we can add fallback if we implement Gemini structured later (Gemini structured works differently in LangChain)

  // For Gemini, structured output support changes.
  // The original code had fallback logic. I will simplify to just use GPT-5 Mini (OpenAI) as default since backend seemed to rely on it heavily for structured.
  // Actually, wait. Does backend use Gemini for structured?
  // `getFlashModel` doesn't support `withStructuredOutput` in the same way for all providers easily.
  // Original code logic:
  // const modelFactories = [{ name: 'GPT-5 Mini', factory: () => getGPT5MiniModel(config) }];

  // So it defaults to GPT-5 Mini. I'll stick to that.

  const baseModel = getGPT5MiniModel(config);
  const structuredModel = baseModel.withStructuredOutput(schema as any, {
    method: 'jsonSchema',
    strict: true,
    includeRaw: false,
  });

  try {
    const response = await structuredModel.invoke(messages, runnableConfig); // TODO: Add streaming support here if needed
    return response as z.infer<T>;
  } catch (e) {
    console.error('LLM Structured failed', e);
    throw e;
  }
}
