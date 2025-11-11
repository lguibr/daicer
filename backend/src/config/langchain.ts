/**
 * LangChain configuration for Google Gemini
 */

import { initChatModel } from 'langchain';

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
 * Get Gemini LLM model instance
 * @param config - Model configuration
 * @returns Gemini chat model instance
 */
export async function getLLMModel() {
  // if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not con1figured');
  return initChatModel('gpt-4.1-mini', DEFAULT_CONFIG);
}

export const { LANGSMITH_TRACING } = process.env;
export const { LANGSMITH_ENDPOINT } = process.env;
export const { LANGSMITH_API_KEY } = process.env;
export const { LANGSMITH_PROJECT } = process.env;

/**
 * Get fallback chain (only Gemini for now)
 * @returns Array with single Gemini model
 */
export async function getFallbackChain() {
  const model = await getLLMModel();
  return [model];
}

/**
 * Message types for LangChain
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
