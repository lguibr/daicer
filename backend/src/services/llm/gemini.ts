/**
 * Centralized Gemini model factory using LangChain
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { logger } from '@/utils/logger';
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
 * @param model - Model identifier (flash, pro, or flash-image)
 * @param config - Optional model configuration
 * @returns ChatGoogleGenerativeAI instance
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

  logger.debug('[Gemini] Creating model instance', {
    model,
    temperature: finalConfig.temperature,
    maxTokens: finalConfig.maxTokens,
  });

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: finalConfig.temperature,
    maxOutputTokens: finalConfig.maxTokens,
    topP: finalConfig.topP,
    topK: finalConfig.topK,
  });
}

/**
 * Extract error details from LLM errors
 */
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

/**
 * Get Flash model (fast, cheap)
 */
export function getFlashModel(config?: GeminiConfig): ChatGoogleGenerativeAI {
  return getGeminiModel(GeminiModel.FLASH, config);
}

/**
 * Get Pro model (powerful, complex reasoning)
 */
export function getProModel(config?: GeminiConfig): ChatGoogleGenerativeAI {
  return getGeminiModel(GeminiModel.PRO, config);
}

/**
 * Get Flash-image model (image generation)
 */
export function getFlashImageModel(config?: GeminiConfig): ChatGoogleGenerativeAI {
  return getGeminiModel(GeminiModel.FLASH_IMAGE, config);
}
