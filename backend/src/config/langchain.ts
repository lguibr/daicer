/**
 * LangChain configuration for Google Gemini
 */

import { getFlashModel } from '../utils/llm/gemini';
import type { GeminiConfig } from '../utils/llm/types';

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
 */
export async function getLLMModel(config?: GeminiConfig) {
  return getFlashModel({ ...DEFAULT_CONFIG, ...config });
}
