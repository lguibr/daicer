/**
 * Assets service
 */

import { Core } from '@strapi/strapi';
import { generateImageGemini } from '../../../utils/llm/image';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import { getFlashModel } from '../../../utils/llm/gemini';
import { HumanMessage } from '@langchain/core/messages';

export default () => ({
  async generatePortrait(payload: any) {
    try {
      const {
        name,
        appearance, // { race, classRole, hair, eyes, attire, ... }
        basePrompt, // "luisiin, a level 1..."
        artStyle,
        tone,
        referenceImages, // [{ mimeType, data }]
        aspectRatio = '1:1', // Default to square
        framingContext: overrideFraming, // Optional override
      } = payload;

      let framingContext = overrideFraming;
      // Default framing if not provided
      if (!framingContext) {
        framingContext = await getPrompt('image_framing_portrait', 'en', 'Close-up portrait');
      }

      // 1. Skip Analysis, use raw images.
      // We no longer analyze the image to get a text description.
      // Instead, we pass the image data directly to the model.

      // 2. Construct Master Prompt using Gemini Flash Lite (Nano replacement)
      const model = getFlashModel();
      const defaultConstruction = `
      Create a highly detailed image generation prompt for a fantasy RPG character portrait.
      Target Model: Imagen 3 / Gemini Image Generation.
      
      Character Name: ${name}
      Race/Class: ${appearance?.race} ${appearance?.classRole}
      
      Physical Description (JSON):
      Hair: ${appearance?.hair}
      Eyes: ${appearance?.eyes}
      Attire: ${appearance?.attire}
      Features: ${appearance?.notableFeatures}
      
      Base Description: "${basePrompt}"
      
      Art Style: ${artStyle || 'Fantasy Digital Painting'}
      Tone: ${tone}
      
      The prompt should be descriptive, focusing on lighting, texture, and facial expression. ${framingContext}.
      IMPORTANT: A reference image is being provided to the generation model. You must output a prompt that ALIGNS with the visual style of that reference image, but strictly enforces the physical description above.
      
      Output ONLY the final prompt string.
      `;

      let constructionPrompt = await getPrompt('image_generation_master_prompt', 'en', defaultConstruction);

      // Format the prompt
      const referenceAnalysisSection = 'Refer to the attached image for style and consistency.';

      if (constructionPrompt.includes('{{name}}')) {
        constructionPrompt = formatPrompt(constructionPrompt, {
          name: name || '',
          race: appearance?.race || '',
          classRole: appearance?.classRole || '',
          hair: appearance?.hair || '',
          eyes: appearance?.eyes || '',
          attire: appearance?.attire || '',
          features: appearance?.notableFeatures || '',
          basePrompt: basePrompt || '',
          artStyle: artStyle || 'Fantasy Digital Painting',
          tone: tone || '',
          referenceAnalysisSection,
          framingContext: framingContext || '',
        });
      }

      const response = await model.invoke([new HumanMessage(constructionPrompt)]);
      const finalPrompt = response.content.toString();
      console.log('Generated Prompt:', finalPrompt);

      // 3. Generate Image using Gemini (2.5 Flash Image / Imagen)
      const result = await generateImageGemini({
        prompt: finalPrompt,
        aspectRatio: aspectRatio as any,
        referenceImages: referenceImages,
      });

      // Expect url to be "data:mime;base64,data"
      const url = result.url;
      const matches = url.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let mimeType = 'image/png';
      let base64Data = '';

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        // Fallback or error if format is unexpected
        console.warn('Unexpected URL format from Gemini:', url.substring(0, 50));
      }

      return {
        mimeType: mimeType,
        data: base64Data,
        prompt: finalPrompt,
        revised_prompt: result.revised_prompt,
      };
    } catch (err) {
      console.error('generatePortrait Error:', err);
      // Fallback or rethrow
      throw new Error('Failed to generate portrait: ' + (err instanceof Error ? err.message : String(err)));
    }
  },

  async generateUpperBody(input: any) {
    // Input structure from controller: { payload, portrait, referenceImage }
    // We strictly want to use the 'portrait' (AvatarPreviewImage) as the primary reference
    const { payload, portrait } = input;

    // Safety check if payload is nested or flat (handle both just in case)
    const effectivePayload = payload || input;

    let refImages = effectivePayload.referenceImages || [];

    // Prepend generated portrait if available
    if (portrait && portrait.data) {
      refImages = [{ mimeType: portrait.mimeType || 'image/png', data: portrait.data }, ...refImages];
    } else if (input.referenceImage) {
      // Fallback for legacy string reference
      refImages = [{ mimeType: 'image/png', data: input.referenceImage }, ...refImages];
    }

    const framingContext = await getPrompt(
      'image_framing_upper_body',
      'en',
      'Upper body shot, from waist up. Focus on costume details and upper body posture.'
    );

    return this.generatePortrait({
      ...effectivePayload,
      basePrompt:
        (effectivePayload.basePrompt || '') +
        ' Upper body framing. Maintain character visual consistency from reference.',
      referenceImages: refImages,
      aspectRatio: '3:4',
      framingContext,
    });
  },

  async generateFullBody(input: any) {
    // Input structure from controller: { payload, portrait, upperBody, referenceImage }
    const { payload, upperBody } = input;
    const effectivePayload = payload || input;

    let refImages = effectivePayload.referenceImages || [];

    // Prepend generated upper body if available
    if (upperBody && upperBody.data) {
      refImages = [{ mimeType: upperBody.mimeType || 'image/png', data: upperBody.data }, ...refImages];
    }

    const framingContext = await getPrompt(
      'image_framing_full_body',
      'en',
      'Full body shot, head to toe. Show legs and footwear. Vertical cinematic composition.'
    );

    return this.generatePortrait({
      ...effectivePayload,
      basePrompt:
        (effectivePayload.basePrompt || '') +
        ' Full body cinematic framing. Maintain visual consistency from reference.',
      referenceImages: refImages,
      aspectRatio: '9:16',
      framingContext,
    });
  },
});
