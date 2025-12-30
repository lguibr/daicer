/**
 * Centralized Gemini model factory using LangChain
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GeminiModel, GeminiConfig, DEFAULT_TEXT_CONFIG } from './types';
import { z } from 'zod';

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
    maxOutputTokens: finalConfig.maxTokens,
    temperature: finalConfig.temperature,
    topP: finalConfig.topP,
    topK: finalConfig.topK,
    // Ensure we can use safety settings if needed
  });
}

/**
 * Helper to get a model configured for structured output
 */
export function getStructuredGeminiModel(
  schema: z.ZodType,
  model: GeminiModel = GeminiModel.FLASH,
  config: GeminiConfig = {}
) {
  const rawModel = getGeminiModel(model, config);
  return rawModel.withStructuredOutput(schema);
}

export function extractErrorDetails(error: unknown): string {
  if (!error) return 'Unknown error';

  if (error instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errAny = error as any;
    const status = errAny.status || errAny.response?.status;
    const code = errAny.code;
    const details = errAny.response?.data;

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
