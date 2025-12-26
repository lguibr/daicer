/**
 * Centralized Gemini model factory using LangChain
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GeminiModel, GeminiConfig, DEFAULT_TEXT_CONFIG } from './types';

/**
 * Get Gemini API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return apiKey;
}

/**
 * Create a Gemini model instance
 */
export function getGeminiModel(
  model: GeminiModel = GeminiModel.FLASH,
  config: GeminiConfig = {}
): ChatGoogleGenerativeAI {
  const apiKey = getApiKey();

  const finalConfig = {
    ...DEFAULT_TEXT_CONFIG,
    ...config,
  };

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: finalConfig.temperature,
    maxOutputTokens: finalConfig.maxTokens,
    topP: finalConfig.topP,
    topK: finalConfig.topK,
  });
}

export function extractErrorDetails(error: unknown): string {
  if (!error) return 'Unknown error';

  if (error instanceof Error) {
    const status =
      (error as { status?: number }).status ?? (error as { response?: { status?: number } }).response?.status;
    const { code } = error as { code?: string };
    const details = (error as { response?: { data?: unknown } }).response?.data;

    const parts = [
      error.name,
      status ? `status=${status}` : null,
      code ? `code=${code}` : null,
      error.message ? `message=${error.message}` : null,
      details ? `details=${JSON.stringify(details)}` : null,
    ].filter(Boolean);

    return parts.join(' | ');
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
}

export function getFlashModel(config?: GeminiConfig): ChatGoogleGenerativeAI {
  return getGeminiModel(GeminiModel.FLASH, config);
}

export function getProModel(config?: GeminiConfig): ChatGoogleGenerativeAI {
  return getGeminiModel(GeminiModel.PRO, config);
}
