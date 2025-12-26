import type { AvatarGenerationPayload, AvatarPreviewImage, ReferenceImagePayload } from '../../../types/assets';
import type { Room } from '../../../types/models';
import type { CharacterFormState } from './types';
import {
  MAX_PREVIEW_DIMENSION,
  PREVIEW_OUTPUT_MIME,
  PREVIEW_OUTPUT_QUALITY,
  PLACEHOLDER_REFERENCES,
} from './constants';

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function downscalePreviewImage(
  image: AvatarPreviewImage,
  maxDimension = MAX_PREVIEW_DIMENSION
): Promise<AvatarPreviewImage> {
  if (typeof window === 'undefined') {
    return image;
  }

  return new Promise<AvatarPreviewImage>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.width || 1;
      const originalHeight = img.height || 1;
      const largestSide = Math.max(originalWidth, originalHeight);
      const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

      const targetWidth = Math.max(1, Math.round(originalWidth * scale));
      const targetHeight = Math.max(1, Math.round(originalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to obtain canvas context for preview downscale'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL(PREVIEW_OUTPUT_MIME, PREVIEW_OUTPUT_QUALITY);
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        reject(new Error('Failed to extract base64 data from preview image'));
        return;
      }

      resolve({
        mimeType: PREVIEW_OUTPUT_MIME,
        data: base64Data,
        prompt: image.prompt,
        width: targetWidth,
        height: targetHeight,
      });
    };
    img.onerror = () => reject(new Error('Failed to load preview image for downscale'));
    img.src = `data:${image.mimeType};base64,${image.data}`;
  });
}

export const appendReference = (
  base: AvatarGenerationPayload,
  extra?: ReferenceImagePayload
): AvatarGenerationPayload => {
  if (!extra) {
    return base;
  }
  const existing = base.referenceImages ?? [];
  return {
    ...base,
    referenceImages: [...existing, extra],
  };
};

export async function loadPlaceholderReferences() {
  const entries = await Promise.all(
    Object.entries(PLACEHOLDER_REFERENCES).map(async ([key, config]) => {
      const response = await fetch(config.src);
      if (!response.ok) {
        throw new Error(`Failed to load placeholder ${key}`);
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const decodeDimensions = async (): Promise<{ width: number; height: number } | undefined> => {
        if (typeof createImageBitmap === 'function') {
          const bitmap = await createImageBitmap(blob);
          const result = { width: bitmap.width, height: bitmap.height };
          if (typeof bitmap.close === 'function') {
            bitmap.close();
          }
          return result;
        }

        if (typeof window === 'undefined') {
          return undefined;
        }

        return new Promise<{ width: number; height: number }>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            const result = { width: img.naturalWidth, height: img.naturalHeight };
            URL.revokeObjectURL(url);
            resolve(result);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to decode placeholder ${key}`));
          };
          img.src = url;
        });
      };

      const dimensions = await decodeDimensions();

      return {
        key: key as keyof import('../../../types/assets').AvatarPreviewResponse,
        reference: {
          mimeType: config.mimeType,
          data: base64,
          description: config.description,
        } satisfies ReferenceImagePayload,
        dimensions,
      };
    })
  );

  const refs: Partial<Record<keyof import('../../../types/assets').AvatarPreviewResponse, ReferenceImagePayload>> = {};
  const dims: Partial<
    Record<keyof import('../../../types/assets').AvatarPreviewResponse, { width: number; height: number }>
  > = {};

  entries.forEach(({ key, reference, dimensions }) => {
    refs[key] = reference;
    if (dimensions) {
      dims[key] = dimensions;
    }
  });

  return { refs, dims };
}

export function buildAvatarPayload(
  formData: CharacterFormState,
  room: Room,
  startingLevel: number,
  equippedItems?: Record<string, string | null>,
  equipmentItems?: Array<{ index: string; name: string; equipmentCategory: string }>
): AvatarGenerationPayload {
  const nilIfEmpty = (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const attributeSummary = Object.entries(formData.attributes)
    .map(([attr, score]) => `${attr.toUpperCase()}: ${score}`)
    .join(', ');

  const skillSummary = Object.entries(formData.skills || {})
    .filter(([, score]) => typeof score === 'number')
    .map(([skill, score]) => `${skill}: ${score}`)
    .join(', ');

  const appearanceBits = [
    formData.appearance.gender ? `${formData.appearance.gender}` : '',
    formData.appearance.age ? `age ${formData.appearance.age}` : '',
    formData.appearance.height ? `height ${formData.appearance.height}` : '',
    formData.appearance.weight ? `weight ${formData.appearance.weight}` : '',
    formData.appearance.eyes ? `eyes ${formData.appearance.eyes}` : '',
    formData.appearance.skin ? `skin ${formData.appearance.skin}` : '',
    formData.appearance.hair ? `hair ${formData.appearance.hair}` : '',
    formData.appearance.description || '',
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(', ');

  // Build equipment description for AI
  const equippedGear: string[] = [];
  if (equippedItems && equipmentItems) {
    Object.entries(equippedItems).forEach(([slot, itemIndex]) => {
      if (itemIndex) {
        const item = equipmentItems.find((i) => i.index === itemIndex);
        if (item) {
          equippedGear.push(`${item.name} (${slot})`);
        }
      }
    });
  }
  const equipmentSummary = equippedGear.length > 0 ? `Equipped with: ${equippedGear.join(', ')}.` : '';

  const worldSummary = room.worldDescription
    ? room.worldDescription.replace(/\s+/g, ' ').trim().slice(0, 800)
    : undefined;

  const baseSections = [
    `${formData.name}, a level ${startingLevel} ${formData.alignment} ${formData.race} ${formData.characterClass}.`,
    attributeSummary ? `Core attributes: ${attributeSummary}.` : null,
    skillSummary ? `Skill proficiencies: ${skillSummary}.` : null,
    appearanceBits ? `Physical appearance: ${appearanceBits}.` : null,
    equipmentSummary || null, // ✨ ADD EQUIPMENT TO PROMPT
    formData.personality.traits ? `Personality traits: ${formData.personality.traits}.` : null,
    formData.personality.ideals ? `Ideals: ${formData.personality.ideals}.` : null,
    formData.personality.bonds ? `Bonds: ${formData.personality.bonds}.` : null,
    formData.personality.flaws ? `Flaws: ${formData.personality.flaws}.` : null,
    formData.background ? `Backstory synopsis: ${formData.background}.` : null,
    worldSummary ? `World context: ${worldSummary}.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const basePrompt =
    baseSections.trim() ||
    `${formData.name}, a level ${startingLevel} ${formData.alignment} ${formData.race} ${formData.characterClass} hero.`;

  // Build attire string with equipment details
  const attireWithEquipment = [
    nilIfEmpty(formData.appearance.description),
    equippedGear.length > 0 ? `Wearing: ${equippedGear.map((g) => g.split(' (')[0]).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    name: formData.name,
    basePrompt,
    appearance: {
      race: formData.race,
      classRole: formData.characterClass,
      lineage: nilIfEmpty(formData.background),
      hair: nilIfEmpty(formData.appearance.hair),
      eyes: nilIfEmpty(formData.appearance.eyes),
      attire: attireWithEquipment || nilIfEmpty(formData.appearance.description),
      accessories: nilIfEmpty(formData.personality.bonds),
      notableFeatures: nilIfEmpty(formData.personality.traits),
    },
    artStyle: room.settings?.tone
      ? `${room.settings.tone} fantasy illustration`
      : 'High detail painterly fantasy illustration with dramatic lighting',
    tone: [formData.personality.traits, room.settings?.tone, formData.alignment]
      .filter((value) => value && value.trim().length > 0)
      .join(' | '),
    narrative: {
      worldSummary,
      currentScene: nilIfEmpty(formData.background.slice(0, 200)),
      playerIntent: nilIfEmpty(formData.personality.ideals),
    },
  };
}
