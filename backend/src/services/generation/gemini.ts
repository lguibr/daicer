/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gemini AI Service
 *
 * Handles AI model and image generation using Google's Gemini API
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import { ModelData, ModelGenerationRequest, ImageGenerationRequest } from './types';
import { buildModelPrompt, validateModelData } from './promptBuilder';
import { logger } from '../../utils/logger';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn('GEMINI_API_KEY not set - asset generation features will be disabled');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const GENERATION_MODEL = 'gemini-2.5-pro';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TEMPERATURE = 0.05;

/**
 * Generate a 3D voxel model from text description
 */
export async function generateModel(request: ModelGenerationRequest): Promise<ModelData> {
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('[GeminiService] generateModel called:', request);
  const { assetType, description, name } = request;
  const { systemInstruction, userPrompt } = buildModelPrompt({
    assetType,
    description,
    name,
    tone: 'fantasy',
    detailLevel: 'standard',
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          description: 'Voxel model definition made of primitive parts',
          required: ['name', 'parts'],
          properties: {
            name: {
              type: Type.STRING,
              description: 'A descriptive name for the model.',
            },
            parts: {
              type: Type.ARRAY,
              description: 'Primitive building blocks that compose the model.',
              items: {
                type: Type.OBJECT,
                required: ['shape', 'position', 'scale', 'rotation', 'color'],
                properties: {
                  shape: {
                    type: Type.STRING,
                    description: 'Primitive geometry identifier.',
                    enum: ['box', 'sphere', 'cylinder', 'cone', 'capsule'],
                  },
                  position: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'Translation offset [x, y, z] in voxels.',
                  },
                  scale: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'Scale factors [x, y, z] applied to the primitive.',
                  },
                  rotation: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'Rotation in radians [x, y, z] applied to the primitive.',
                  },
                  color: {
                    type: Type.STRING,
                    description: 'Hex color string formatted as #RRGGBB.',
                  },
                },
              },
            },
            rotation: {
              type: Type.ARRAY,
              description: 'Optional global rotation in radians [x, y, z].',
              items: { type: Type.NUMBER },
              nullable: true,
            },
          },
        },
        temperature: TEMPERATURE,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response received from AI model.');
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(text) as unknown;
    } catch (parseError) {
      logger.error('[GeminiService] Malformed JSON received:', parseError);
      throw new Error('Received malformed JSON from AI model.');
    }

    const validated = validateModelData(parsedPayload);

    logger.info('[GeminiService] Model generated successfully');
    return {
      ...validated,
      name,
    };
  } catch (error: any) {
    logger.error('[GeminiService] Generation error:', error);

    if (error?.error?.code === 403) {
      throw new Error(
        "API key doesn't have permission to access Gemini. Get a new key at https://aistudio.google.com/app/apikey"
      );
    }

    if (error instanceof Error) {
      throw new Error(`Model generation failed: ${error.message}`);
    }
    throw new Error('Failed to generate model with Gemini API');
  }
}

/**
 * Generate an image variation based on a base image
 */
export async function generateImageVariation(request: ImageGenerationRequest): Promise<Buffer> {
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('[GeminiService] generateImageVariation called');

  const { baseImage, masterDescription, variationDescription } = request;

  if (!baseImage || !masterDescription || !variationDescription) {
    throw new Error('Base image, master description, and variation description are required');
  }

  const base64Data = baseImage.toString('base64');
  const imagePart = {
    inlineData: { data: base64Data, mimeType: 'image/png' },
  };

  const prompt = `The user has provided an image of a character. The core identity of this character is: '${masterDescription}'.
    Your task is to generate a new image that applies the following specific variation: '${variationDescription}'.
    It is crucial that you maintain the exact same pose and a similar art style from the original image. The background must be simple and black. The output should be only the character image, without any extra space or borders.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [imagePart, { text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const [firstCandidate] = response.candidates ?? [];
    const candidateParts = firstCandidate?.content?.parts ?? [];

    for (const part of candidateParts) {
      const data = part.inlineData?.data;
      if (data) {
        return Buffer.from(data, 'base64');
      }
    }

    throw new Error('No image data found in Gemini response');
  } catch (error: any) {
    logger.error('[GeminiService] Image generation error:', error);

    if (error?.error?.code === 403) {
      throw new Error("API key doesn't have permission. Get a new key at https://aistudio.google.com/app/apikey");
    }

    throw new Error(`Failed to generate image: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate an image from text prompt only
 */
export async function generateImageFromText(prompt: string): Promise<Buffer> {
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('[GeminiService] generateImageFromText called');

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const [firstCandidate] = response.candidates ?? [];
    const candidateParts = firstCandidate?.content?.parts ?? [];

    for (const part of candidateParts) {
      const data = part.inlineData?.data;
      if (data) {
        logger.info('[GeminiService] Image generated successfully');
        return Buffer.from(data, 'base64');
      }
    }

    throw new Error('No image data found in Gemini response');
  } catch (error: any) {
    logger.error('[GeminiService] Image generation error:', error);

    if (error?.error?.code === 403) {
      throw new Error("API key doesn't have permission. Get a new key at https://aistudio.google.com/app/apikey");
    }

    throw new Error(`Failed to generate image: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Transform an existing image with a prompt
 */
export async function transformImage(baseImage: Buffer, transformPrompt: string): Promise<Buffer> {
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('[GeminiService] transformImage called');

  const base64Data = baseImage.toString('base64');
  const imagePart = {
    inlineData: { data: base64Data, mimeType: 'image/png' },
  };

  const prompt = `Apply the following transformation to this image: '${transformPrompt}'.
    Maintain the same pose and art style from the original image. The background must be simple and black. The output should be only the transformed image, without any extra space or borders.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [imagePart, { text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const [firstCandidate] = response.candidates ?? [];
    const candidateParts = firstCandidate?.content?.parts ?? [];

    for (const part of candidateParts) {
      const data = part.inlineData?.data;
      if (data) {
        return Buffer.from(data, 'base64');
      }
    }

    throw new Error('No image data found in Gemini response');
  } catch (error: any) {
    logger.error('[GeminiService] Image transformation error:', error);
    throw new Error(`Failed to transform image: ${error?.message || 'Unknown error'}`);
  }
}
