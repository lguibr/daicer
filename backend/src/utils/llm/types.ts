/**
 * Shared types and configurations for LLM services
 */

import type { Language } from '../../types/index';

/**
 * Gemini model identifiers
 */
export enum GeminiModel {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
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
  model?: GeminiModel.FLASH | GeminiModel.PRO;
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
