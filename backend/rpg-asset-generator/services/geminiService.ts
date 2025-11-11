import { GoogleGenAI, Modality } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBase64FromResponse = (response: GenerateContentResponse): string => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error('No image data found in response');
};

// Centralized API error handler
const handleApiError = (error: unknown): never => {
  console.error('Gemini API Error:', error);
  let message = 'An unknown error occurred. Please check the console for details.';

  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
    message =
      "You've exceeded your request limit. Please wait a minute and try again. This is often related to free-tier usage limits.";
  } else if (errorMessage.toLowerCase().includes('api key not valid')) {
    message = 'Your API key is not valid. Please ensure it is correctly configured.';
  } else {
    message =
      'Failed to generate image. The AI may have refused the request due to safety policies or an invalid prompt.';
  }

  throw new Error(message);
};

export const generateImage = async (prompt: string, temperature?: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        ...(temperature !== undefined && { temperature }),
      },
    });
    return getBase64FromResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};

export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  temperature?: number
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        ...(temperature !== undefined && { temperature }),
      },
    });
    return getBase64FromResponse(response);
  } catch (error) {
    handleApiError(error);
  }
};
