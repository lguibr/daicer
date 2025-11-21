/* eslint-disable no-underscore-dangle */
/**
 * Image generation service using Gemini Flash-image model
 * Merges functionality from gemini-image.ts and generation/gemini.ts
 */

import { GoogleGenAI, Modality } from '@google/genai';
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

const MODEL_NAME = 'gemini-2.5-flash-image';

type InlineDataPart = {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
  text?: string;
};



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

  return {
    parts,
  };
}

/**
 * Build response configuration
 */
function buildResponseConfig() {
  // Simplified config - imageConfig and temperature are not supported by the model
  return {
    responseModalities: [Modality.IMAGE],
  };
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

  // Check for transient errors (500, 503)
  if (message.includes('500') || message.includes('503') || message.includes('INTERNAL')) {
    return new ApiError(503, `Gemini API temporarily unavailable: ${message}`);
  }

  return new ApiError(502, `Gemini image generation failed: ${message}`);
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (400s)
      if (lastError instanceof ApiError && lastError.statusCode < 500) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`[GeminiImage] Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
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
    return await retryWithBackoff(async () => {
      const contents = buildContents(request.prompt, request.references);

      const response = await getClient().models.generateContent({
        model: MODEL_NAME,
        config: buildResponseConfig(),
        contents: contents as any, // Force match working implementation
      });

      const [candidate] = response.candidates ?? [];
      const part = candidate?.content?.parts?.find((p) => p.inlineData);
      const inlineData = part?.inlineData;

      if (inlineData?.data) {
        const mimeType = inlineData.mimeType ?? 'image/png';
        const buffer = Buffer.from(inlineData.data, 'base64');

        logger.info('[GeminiImage] Image generated successfully');
        return {
          buffer,
          mimeType,
          prompt: request.prompt,
        };
      }

      throw new ApiError(502, 'Gemini image generation returned no inline data');
    });
  } catch (error) {
    logger.error('[GeminiImage] Generation error after retries:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    const response = await getClient().models.generateContent({
      model: MODEL_NAME,
      config: buildResponseConfig(),
      contents: buildContents(prompt, [
        {
          data: base64Data,
          mimeType: 'image/png',
        },
      ]),
    });

    const [candidate] = response.candidates ?? [];
    const part = candidate?.content?.parts?.find((p) => p.inlineData);
    const inlineData = part?.inlineData;

    if (inlineData?.data) {
      const mimeType = inlineData.mimeType ?? 'image/png';
      const buffer = Buffer.from(inlineData.data, 'base64');

      logger.info('[GeminiImage] Image variation generated successfully');
      return {
        buffer,
        mimeType,
        prompt,
      };
    }

    throw new ApiError(502, 'Gemini image variation returned no inline data');
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
    const response = await getClient().models.generateContent({
      model: MODEL_NAME,
      config: buildResponseConfig(),
      contents: buildContents(prompt, [
        {
          data: base64Data,
          mimeType: 'image/png',
        },
      ]),
    });

    const [candidate] = response.candidates ?? [];
    const part = candidate?.content?.parts?.find((p) => p.inlineData);
    const inlineData = part?.inlineData;

    if (inlineData?.data) {
      const mimeType = inlineData.mimeType ?? 'image/png';
      const buffer = Buffer.from(inlineData.data, 'base64');

      logger.info('[GeminiImage] Image transformed successfully');
      return {
        buffer,
        mimeType,
        prompt,
      };
    }

    throw new ApiError(502, 'Gemini image transformation returned no inline data');
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
