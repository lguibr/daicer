/* eslint-disable no-underscore-dangle */
/**
 * Image generation service using Gemini Flash-image model
 * Merges functionality from gemini-image.ts and generation/gemini.ts
 */

import { GoogleGenAI } from '@google/genai';
import { task } from '@langchain/langgraph';
import { ApiError } from '@/middleware/error';
import { logger } from '@/utils/logger';
import type {
  ImageGenerationRequest,
  ImageVariationRequest,
  ImageTransformRequest,
  GeneratedImage,
  ReferenceImagePayload,
  ImageGenConfig,
} from './types';
import { DEFAULT_IMAGE_CONFIG } from './types';

const MODEL_NAME = 'gemini-2.5-flash-image';

type InlineDataPart = {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: InlineDataPart[];
  };
};

type GeminiStreamChunk = {
  candidates?: GeminiCandidate[];
};

type GeminiStreamWrapper = {
  stream: AsyncIterable<unknown>;
};

const isGeminiStreamChunk = (value: unknown): value is GeminiStreamChunk => {
  if (typeof value !== 'object' || value === null || !('candidates' in value)) {
    return false;
  }
  const { candidates } = value as { candidates: unknown };
  return Array.isArray(candidates);
};

const isGeminiStreamWrapper = (value: unknown): value is GeminiStreamWrapper =>
  typeof value === 'object' && value !== null && 'stream' in value;

let client: GoogleGenAI | null = null;

/**
 * Get Google GenAI client instance
 */
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Gemini API key is not configured. Set GEMINI_API_KEY.');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Build contents for multimodal request
 */
function buildContents(prompt: string, references?: ReferenceImagePayload[]) {
  const parts: InlineDataPart[] = [];

  // Add reference images first
  for (const ref of references ?? []) {
    parts.push({
      inlineData: {
        data: ref.data,
        mimeType: ref.mimeType,
      },
    });
  }

  // Add text prompt
  parts.push({ text: prompt });

  return [
    {
      role: 'user' as const,
      parts,
    },
  ];
}

/**
 * Build response configuration
 */
function buildResponseConfig(config?: ImageGenConfig) {
  const finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...config };
  return {
    responseModalities: ['IMAGE' as const],
    imageConfig: {
      imageSize: finalConfig.size,
    },
    temperature: finalConfig.temperature,
  };
}

/**
 * Resolve inline image from stream
 */
async function resolveInlineImage(prompt: string, iterable: AsyncIterable<unknown>): Promise<GeneratedImage> {
  for await (const chunk of iterable) {
    if (isGeminiStreamChunk(chunk)) {
      const [candidate] = chunk.candidates ?? [];
      const part = candidate?.content?.parts?.find((p) => p.inlineData);
      const inlineData = part?.inlineData;
      if (inlineData?.data) {
        const mimeType = inlineData.mimeType ?? 'image/png';
        const buffer = Buffer.from(inlineData.data, 'base64');
        return {
          buffer,
          mimeType,
          prompt,
        };
      }
    }
  }

  throw new ApiError(502, 'Gemini image generation returned no inline data');
}

/**
 * Convert Gemini errors to ApiError
 */
function convertGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return new ApiError(429, 'Gemini quota exceeded. Retry later or upgrade your plan.');
  }

  if (message.toLowerCase().includes('api key')) {
    return new ApiError(401, 'Gemini API key invalid or missing. Check GEMINI_API_KEY env var.');
  }

  return new ApiError(502, `Gemini image generation failed: ${message}`);
}

/**
 * Internal image generation from text and optional references
 */
async function _generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
  logger.info('[GeminiImage] generateImage called', {
    promptPreview: request.prompt.slice(0, 100),
    referenceCount: request.references?.length ?? 0,
  });

  try {
    const response = await getClient().models.generateContentStream({
      model: MODEL_NAME,
      config: buildResponseConfig(request.config),
      contents: buildContents(request.prompt, request.references),
    });

    const stream = isGeminiStreamWrapper(response) ? response.stream : response;
    const result = await resolveInlineImage(request.prompt, stream);

    logger.info('[GeminiImage] Image generated successfully');
    return result;
  } catch (error) {
    logger.error('[GeminiImage] Generation error:', error);
    throw convertGeminiError(error);
  }
}

/**
 * Internal image variation generation
 */
async function _generateImageVariation(request: ImageVariationRequest): Promise<GeneratedImage> {
  logger.info('[GeminiImage] generateImageVariation called');

  const { baseImage, masterDescription, variationDescription } = request;

  if (!baseImage || !masterDescription || !variationDescription) {
    throw new Error('Base image, master description, and variation description are required');
  }

  const base64Data = baseImage.toString('base64');
  const prompt = `The user has provided an image of a character. The core identity of this character is: '${masterDescription}'.
Your task is to generate a new image that applies the following specific variation: '${variationDescription}'.
It is crucial that you maintain the exact same pose and a similar art style from the original image. The background must be simple and black. The output should be only the character image, without any extra space or borders.`;

  try {
    const response = await getClient().models.generateContentStream({
      model: MODEL_NAME,
      config: buildResponseConfig(request.config),
      contents: buildContents(prompt, [
        {
          data: base64Data,
          mimeType: 'image/png',
        },
      ]),
    });

    const stream = isGeminiStreamWrapper(response) ? response.stream : response;
    const result = await resolveInlineImage(prompt, stream);

    logger.info('[GeminiImage] Image variation generated successfully');
    return result;
  } catch (error) {
    logger.error('[GeminiImage] Image variation error:', error);
    throw convertGeminiError(error);
  }
}

/**
 * Internal image generation from text only
 */
async function _generateImageFromText(prompt: string, config?: ImageGenConfig): Promise<GeneratedImage> {
  logger.info('[GeminiImage] generateImageFromText called');

  return _generateImage({ prompt, config });
}

/**
 * Internal image transformation
 */
async function _transformImage(request: ImageTransformRequest): Promise<GeneratedImage> {
  logger.info('[GeminiImage] transformImage called');

  const { baseImage, transformPrompt } = request;

  if (!baseImage || !transformPrompt) {
    throw new Error('Base image and transform prompt are required');
  }

  const base64Data = baseImage.toString('base64');
  const prompt = `Apply the following transformation to this image: '${transformPrompt}'.
Maintain the same pose and art style from the original image. The background must be simple and black. The output should be only the transformed image, without any extra space or borders.`;

  try {
    const response = await getClient().models.generateContentStream({
      model: MODEL_NAME,
      config: buildResponseConfig(request.config),
      contents: buildContents(prompt, [
        {
          data: base64Data,
          mimeType: 'image/png',
        },
      ]),
    });

    const stream = isGeminiStreamWrapper(response) ? response.stream : response;
    const result = await resolveInlineImage(prompt, stream);

    logger.info('[GeminiImage] Image transformed successfully');
    return result;
  } catch (error) {
    logger.error('[GeminiImage] Image transformation error:', error);
    throw convertGeminiError(error);
  }
}

/**
 * Task-wrapped exports for LangGraph nodes (deterministic, checkpointed)
 */
export const generateImageTask = task('generateImage', _generateImage);
export const generateImageVariationTask = task('generateImageVariation', _generateImageVariation);
export const generateImageFromTextTask = task('generateImageFromText', _generateImageFromText);
export const transformImageTask = task('transformImage', _transformImage);

/**
 * Direct exports for non-graph usage (API endpoints, one-off calls)
 */
export const generateImage = _generateImage;
export const generateImageVariation = _generateImageVariation;
export const generateImageFromText = _generateImageFromText;
export const transformImage = _transformImage;
