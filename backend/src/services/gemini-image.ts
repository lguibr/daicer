import { GoogleGenAI } from '@google/genai';

import { ApiError } from '@/middleware/error';
import type { ReferenceImagePayload } from '@/types/assets';

const MODEL_NAME = 'gemini-2.5-flash-image';

export interface ImageGenerationConfig {
  size?: '768' | '1K' | '4K';
  temperature?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  references?: ReferenceImagePayload[];
  config?: ImageGenerationConfig;
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
}

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

const getClient = (): GoogleGenAI => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Gemini API key is not configured. Set GEMINI_API_KEY.');
    }

    client = new GoogleGenAI({ apiKey });
  }

  return client;
};

const buildContents = (request: ImageGenerationRequest) => {
  const parts: InlineDataPart[] = [];

  for (const ref of request.references ?? []) {
    parts.push({
      inlineData: {
        data: ref.data,
        mimeType: ref.mimeType,
      },
    });
  }

  parts.push({ text: request.prompt });

  return [
    {
      role: 'user' as const,
      parts,
    },
  ];
};

const buildResponseConfig = (config?: ImageGenerationConfig) => ({
  responseModalities: ['IMAGE' as const],
  imageConfig: {
    imageSize: config?.size ?? '1K',
  },
  ...(config?.temperature !== undefined && { temperature: config.temperature }),
});

const resolveInlineImage = async (
  request: ImageGenerationRequest,
  iterable: AsyncIterable<unknown>
): Promise<GeneratedImage> => {
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
          prompt: request.prompt,
        };
      }
    }
  }

  throw new ApiError(502, 'Gemini image generation returned no inline data');
};

const convertGeminiError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return new ApiError(429, 'Gemini quota exceeded. Retry later or upgrade your plan.');
  }

  if (message.toLowerCase().includes('api key')) {
    return new ApiError(401, 'Gemini API key invalid or missing. Check GEMINI_API_KEY env var.');
  }

  return new ApiError(502, `Gemini image generation failed: ${message}`);
};

export const generateImage = async (request: ImageGenerationRequest): Promise<GeneratedImage> => {
  try {
    const response = await getClient().models.generateContentStream({
      model: MODEL_NAME,
      config: buildResponseConfig(request.config),
      contents: buildContents(request),
    });

    const stream = isGeminiStreamWrapper(response) ? response.stream : response;

    return await resolveInlineImage(request, stream);
  } catch (error) {
    throw convertGeminiError(error);
  }
};
