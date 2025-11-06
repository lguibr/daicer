/**
 * LangChain configuration for multi-provider LLM support
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LLMProvider } from '@/types/index.js';

/**
 * LangChain model configuration
 */
interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
}

const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.4,
  maxTokens: 4096,
  topP: 0.95,
};

/**
 * Create Gemini chat model
 * @param config - Model configuration
 * @returns Gemini chat model instance
 */
function createGeminiModel(config: ModelConfig = DEFAULT_CONFIG): BaseChatModel {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: 'gemini-2.5-pro',
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    topP: config.topP,
  });
}

/**
 * Create OpenAI chat model
 * @param config - Model configuration
 * @returns OpenAI chat model instance
 */
function createOpenAIModel(config: ModelConfig = DEFAULT_CONFIG): BaseChatModel {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4-turbo-preview',
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    topP: config.topP,
  });
}

/**
 * Create Anthropic chat model
 * @param config - Model configuration
 * @returns Anthropic chat model instance
 */
function createAnthropicModel(config: ModelConfig = DEFAULT_CONFIG): BaseChatModel {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  return new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    modelName: 'claude-3-opus-20240229',
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    topP: config.topP,
  });
}

/**
 * Get LLM model based on provider
 * @param provider - LLM provider name
 * @param config - Model configuration
 * @returns Chat model instance
 */
export function getLLMModel(
  provider: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'gemini',
  config: ModelConfig = DEFAULT_CONFIG
): BaseChatModel {
  switch (provider) {
    case 'gemini':
      return createGeminiModel(config);
    case 'openai':
      return createOpenAIModel(config);
    case 'anthropic':
      return createAnthropicModel(config);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Get fallback chain of LLM models
 * @returns Array of chat models in fallback order
 */
export function getFallbackChain(): BaseChatModel[] {
  const chain = process.env.LLM_FALLBACK_CHAIN?.split(',') || ['gemini'];
  const models: BaseChatModel[] = [];

  for (const provider of chain) {
    try {
      models.push(getLLMModel(provider.trim() as LLMProvider));
    } catch (error) {
      console.warn(`Failed to initialize ${provider}:`, error);
    }
  }

  if (models.length === 0) {
    throw new Error('No LLM providers available');
  }

  return models;
}

