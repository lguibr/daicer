/**
 * OpenAI GPT model factory using LangChain
 */

import { ChatOpenAI } from '@langchain/openai';
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

export function getOpenAIModel(model: OpenAIModel = OpenAIModel.GPT_5_MINI, config: GeminiConfig = {}): ChatOpenAI {
  const apiKey = getApiKey();
  const temperature = 1.0;
  const timeout = config.timeout ?? 30000;

  return new ChatOpenAI({
    apiKey,
    model,
    temperature,
    maxTokens: config.maxTokens ?? 4096,
    topP: config.topP,
    timeout,
  });
}

export function getGPT51Model(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_1, config);
}

export function getGPT5MiniModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_MINI, config);
}

export function getGPT5NanoModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_NANO, config);
}

export function getGPT5ProModel(config?: GeminiConfig): ChatOpenAI {
  return getOpenAIModel(OpenAIModel.GPT_5_PRO, config);
}
