import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

/**
 * Initialize the Google GenAI client
 */
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured');
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
}

export interface ImageGenerationOptions {
  prompt: string;
  // Gemini/Imagen options might differ, but mapping vaguely
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  sampleCount?: number;
  referenceImages?: { mimeType: string; data: string }[];
}

export interface ImageAnalysisOptions {
  imageBase64: string; // Base64 encoded image content
  mimeType?: string; // e.g. image/png
  prompt?: string;
}

/**
 * User specified model: 'gemini-2.5-flash-image' or 'gemini-3-pro-image-preview'
 */
export async function generateImageGemini(
  options: ImageGenerationOptions,
  modelName: string = 'gemini-2.5-flash-image'
): Promise<{ url: string; revised_prompt: string }> {
  const ai = getClient();
  const model = modelName;

  try {
    // Basic Part interface based on usage
    interface Part {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }
    const parts: Part[] = [{ text: options.prompt }];

    if (options.referenceImages && options.referenceImages.length > 0) {
      options.referenceImages.forEach((img) => {
        // Clean base64 if present, though usually passed raw here from service
        const cleanData = img.data.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/png',
            data: cleanData,
          },
        });
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: parts,
        },
      ],
      config: {
        // responseModalities might not be in the strict types yet for all versions but is in docs
        // responseModalities: ['IMAGE'], // Commenting out as mixed Text/Image input might require different output handling or defaults.
        // Actually, if we want an image, we should probably hint it, but default usually works for 'generate-image' models.
        // Let's keep it if it was working for txt2img.
        responseModalities: ['IMAGE'],
        // imageConfig might be experimental in some SDK versions
        imageConfig: {
          aspectRatio: options.aspectRatio || '1:1',
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const firstCandidate = candidates[0];
    const responseParts = firstCandidate.content?.parts;

    // Look for inlineData (image)
    const imagePart = responseParts?.find((p) => p.inlineData);

    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      const base64Data = imagePart.inlineData.data;

      return {
        url: `data:${mimeType};base64,${base64Data}`,
        revised_prompt: options.prompt, // SDK doesn't always return the revised prompt in the same way
      };
    }

    console.error('Gemini Image Gen - No inlineData found. Candidate parts:', JSON.stringify(responseParts, null, 2));
    console.error('Full Candidate:', JSON.stringify(firstCandidate, null, 2));
    throw new Error('No image data found in Gemini response');
  } catch (error) {
    console.error('Gemini Image Generation Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini Image Gen failed: ${message}`);
  }
}

/**
 * Analyze an image using Gemini Vision (Gemini 2.0 Flash Exp) via Google GenAI SDK
 */
export async function describeImageGemini(options: ImageAnalysisOptions): Promise<string> {
  const ai = getClient();
  const model = 'gemini-2.5-flash';

  const prompt = options.prompt || 'Describe this character.';
  const mimeType = options.mimeType || 'image/png';

  // Clean base64 just in case
  const cleanBase64 = options.imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
    });

    const textPart = response.candidates?.[0]?.content?.parts?.find((p) => p.text);
    return textPart?.text || 'No description generated.';
  } catch (error) {
    console.error('Gemini Vision Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini Vision failed: ${message}`);
  }
}
