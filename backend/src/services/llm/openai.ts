/**
 * OpenAI GPT model factory using LangChain
 */

import { ChatOpenAI } from '@langchain/openai';
import { logger } from '@/utils/logger';
import { OpenAIModel, type GeminiConfig } from './types';

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return apiKey;
}

/**
 * Create an OpenAI model instance
 * Note: GPT-5 models only support temperature=1.0 (default)
 * Structured Outputs with strict: true is used for schema validation
 */
export function getOpenAIModel(model: OpenAIModel = OpenAIModel.GPT_5_MINI, config: GeminiConfig = {}): ChatOpenAI {
  const apiKey = getApiKey();

  // GPT-5 models only support temperature=1.0 (default)
  const temperature = 1.0;

  // Default timeout: 30s, but allow override (world-gen needs 120s)
  const timeout = config.timeout ?? 30000;

  logger.debug('[OpenAI] Creating model instance', {
    model,
    temperature,
    maxTokens: config.maxTokens,
    timeout,
  });

  return new ChatOpenAI({
    apiKey,
    model,
    temperature,
    maxTokens: config.maxTokens ?? 4096,
    topP: config.topP,
    timeout,
    maxRetries: 2,
  });
}

/**
 * Get GPT-5.1 model (best for coding and agentic tasks)
 */
export function getGPT51Model(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_1, config);
}

/**
 * Get GPT-5 mini model (faster, cost-efficient)
 */
export function getGPT5MiniModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_MINI, config);
}

/**
 * Get GPT-5 nano model (fastest, most cost-efficient)
 */
export function getGPT5NanoModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_NANO, config);
}

/**
 * Get GPT-5 pro model (smarter, more precise)
 */
export function getGPT5ProModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_PRO, config);
}
