/**
 * LangChain configuration for Google Gemini
 */

import { getFlashModel, getProModel } from '@/services/llm/gemini';
import type { GeminiConfig } from '@/services/llm/types';

/**
 * Default model configuration
 */
const DEFAULT_CONFIG: GeminiConfig = {
  temperature: 0.4,
  maxTokens: 64000,
  topP: 0.95,
};

/**
 * Get Gemini LLM model instance (Flash by default)
 * @param config - Model configuration
 * @returns Gemini chat model instance
 */
export async function getLLMModel(config?: GeminiConfig) {
  return getFlashModel({ ...DEFAULT_CONFIG, ...config });
}

/**
 * Get fallback chain: Flash → Pro
 * @returns Array with Flash and Pro models
 */
export async function getFallbackChain(config?: GeminiConfig) {
  const flashModel = getFlashModel({ ...DEFAULT_CONFIG, ...config });
  const proModel = getProModel({ ...DEFAULT_CONFIG, ...config });
  return [flashModel, proModel];
}

/**
 * LangSmith configuration exports
 */
export const { LANGSMITH_TRACING } = process.env;
export const { LANGSMITH_ENDPOINT } = process.env;
export const { LANGSMITH_API_KEY } = process.env;
export const { LANGSMITH_PROJECT } = process.env;

/**
 * Message types for LangChain
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
