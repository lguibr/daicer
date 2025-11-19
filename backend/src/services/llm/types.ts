/**
 * Shared types and configurations for LLM services
 */

import type { Language } from '@/types/index';

/**
 * Gemini model identifiers
 */
export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
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

/**
 * Image generation size options
 */
export type ImageSize = '768' | '1K' | '4K';

/**
 * Image generation configuration
 */
export interface ImageGenConfig {
  size?: ImageSize;
  temperature?: number;
}

/**
 * Reference image payload for multimodal generation
 */
export interface ReferenceImagePayload {
  data: string; // Base64 encoded image data
  mimeType: string;
}

/**
 * Image generation request
 */
export interface ImageGenerationRequest {
  prompt: string;
  references?: ReferenceImagePayload[];
  config?: ImageGenConfig;
}

/**
 * Image variation request
 */
export interface ImageVariationRequest {
  baseImage: Buffer;
  masterDescription: string;
  variationDescription: string;
  config?: ImageGenConfig;
}

/**
 * Image transformation request
 */
export interface ImageTransformRequest {
  baseImage: Buffer;
  transformPrompt: string;
  config?: ImageGenConfig;
}

/**
 * Generated image result
 */
export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
}

/**
 * Default configurations
 */
export const DEFAULT_TEXT_CONFIG: Required<GeminiConfig> = {
  temperature: 0.4,
  maxTokens: 4096,
  topP: 0.95,
  topK: 40,
};

export const DEFAULT_IMAGE_CONFIG: Required<ImageGenConfig> = {
  size: '1K',
  temperature: 0.7,
};
