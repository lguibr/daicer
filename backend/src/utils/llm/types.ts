/**
 * Shared types and configurations for LLM services
 */

import type { Language } from '../../types/index';

/**
 * Gemini model identifiers
 */
export enum GeminiModel {
  FLASH = 'gemini-2.0-flash', // Still valid for stable fast
  PRO = 'gemini-1.5-pro', // Base Pro
  FLASH_IMAGE = 'gemini-2.5-flash-image', // USER REQUESTED: Image generation
  PRO_PREVIEW_3 = 'gemini-3-preview', // USER REQUESTED: Strong model (Gemini 3 Pro Preview - actual name usually gemini-exp-1121 or similar, but using user string if valid or mapping)
  FLASH_LATEST = 'gemini-2.0-flash-exp', // USER REQUESTED: "Mini" replacement
  FLASH_LITE_LATEST = 'gemini-2.0-flash-lite-preview-02-05', // USER REQUESTED: "Nano" replacement
}

/**
 * OpenAI GPT-5 model identifiers (with strict JSON support)
 */
export enum OpenAIModel {
  GPT_5_1 = 'gpt-5.1', // Best for coding and agentic tasks with configurable reasoning
  GPT_5_MINI = 'gpt-5-mini', // Faster, cost-efficient version of GPT-5
  GPT_5_NANO = 'gpt-5-nano', // Fastest, most cost-efficient version of GPT-5
  GPT_5_PRO = 'gpt-5-pro', // Smarter and more precise responses
  GPT_5 = 'gpt-5', // Previous intelligent reasoning model
}

/**
 * Base configuration for Gemini models
 */
export interface GeminiConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Text generation configuration
 */
export interface TextGenConfig extends GeminiConfig {
  model?: GeminiModel.FLASH | GeminiModel.PRO | OpenAIModel;
  language?: Language;
  enableFallback?: boolean;
  /** User ID for tracking purposes */
  userId?: string;
  /** Custom tags for grouping traces in LangSmith */
  tags?: string[];
  /** Additional metadata for traces */
  metadata?: Record<string, unknown>;
}

export const DEFAULT_TEXT_CONFIG: Required<GeminiConfig> = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.8,
  topK: 40,
  timeout: 0,
};
