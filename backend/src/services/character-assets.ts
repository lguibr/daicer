import { randomUUID } from 'crypto';
import mime from 'mime';

import { buildAvatarPrompt, type AvatarView } from '@/services/asset-prompts';
import { generateImage } from '@/services/llm';
import { saveAsset } from '@/services/asset-storage';
import type { CharacterSheet } from '@/types/index';
import type {
  AvatarAssetResponse,
  AvatarGenerationPayload,
  AppearanceAttributes,
  AvatarPreviewResponse,
  AvatarPreviewImage,
  ReferenceImagePayload,
} from '@/types/assets';
import { optimizeImage } from '@/utils/image';

const VIEW_VARIANTS: Array<{ view: AvatarView; key: keyof AvatarAssetResponse }> = [
  { view: 'portrait', key: 'portrait' },
  { view: 'upper-body', key: 'upperBody' },
  { view: 'full-body', key: 'fullBody' },
];

const TARGET_SPECS: Record<keyof AvatarAssetResponse, { width?: number; height?: number; fit?: 'cover' | 'contain' }> =
  {
    portrait: { width: 512, height: 512, fit: 'cover' },
    upperBody: { width: 576, height: 768, fit: 'cover' },
    fullBody: { width: 640, fit: 'contain' },
  };

const sanitizeSegment = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-');

const isBucketConfigured = Boolean(process.env.FIREBASE_STORAGE_BUCKET ?? process.env.STORAGE_BUCKET);

const buildFolderPath = (character: CharacterSheet): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nameSegment = sanitizeSegment(character.name || 'character');
  return `characters/${timestamp}-${nameSegment}-${randomUUID()}`;
};

const buildAppearanceAttributes = (character: CharacterSheet): AppearanceAttributes => ({
  race: character.race,
  lineage: character.background,
  classRole: character.characterClass,
  genderPresentation: undefined,
  hair: character.appearance.hair,
  eyes: character.appearance.eyes,
  attire: character.appearance.description || character.equipment,
  accessories: character.equipment,
  notableFeatures: character.features,
});

const firstKeyEvent = (character: CharacterSheet): string | undefined =>
  character.backgroundDetails?.keyEvents?.[0] ??
  character.backgroundDetails?.keyEvents?.find((event) => event.trim().length > 0);

const summarizeAttributes = (character: CharacterSheet): string =>
  Object.entries(character.attributes)
    .map(([attr, score]) => `${attr.toUpperCase()}: ${score}`)
    .join(', ');

const summarizeSkills = (character: CharacterSheet): string =>
  (character.skillDetails ?? [])
    .map((skill) => `${skill.name} (${skill.proficiency}, ${skill.modifier >= 0 ? '+' : ''}${skill.modifier})`)
    .join('; ');

const summarizeAppearance = (character: CharacterSheet): string =>
  [
    character.appearance.age ? `age ${character.appearance.age}` : '',
    character.appearance.height ? `height ${character.appearance.height}` : '',
    character.appearance.weight ? `weight ${character.appearance.weight}` : '',
    character.appearance.eyes ? `eyes ${character.appearance.eyes}` : '',
    character.appearance.skin ? `skin ${character.appearance.skin}` : '',
    character.appearance.hair ? `hair ${character.appearance.hair}` : '',
    character.appearance.description || '',
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(', ');

const summarizeCurrency = (character: CharacterSheet): string =>
  Object.entries(character.currency)
    .map(([denom, value]) => `${denom.toUpperCase()}:${value}`)
    .join(', ');

const summarizeResourcePools = (character: CharacterSheet): string =>
  character.resourcePools
    .map(
      (pool) =>
        `${pool.name} ${pool.current}/${pool.max} (${pool.refresh})${pool.description ? ` - ${pool.description}` : ''}`
    )
    .join('; ');

const summarizeTalents = (character: CharacterSheet): string =>
  character.talents.map((talent) => `${talent.name} [${talent.category}] - ${talent.description}`).join('; ');

const summarizeExpertises = (character: CharacterSheet): string => character.expertises.join(', ');

const buildAvatarPayload = (character: CharacterSheet): AvatarGenerationPayload => {
  const sections: string[] = [];

  sections.push(
    `${character.name}, a level ${character.level} ${character.alignment} ${character.race} ${character.characterClass}.`
  );

  const attributeSummary = summarizeAttributes(character);
  if (attributeSummary) sections.push(`Core attributes: ${attributeSummary}.`);

  const skillSummary = summarizeSkills(character);
  if (skillSummary) sections.push(`Skill proficiencies: ${skillSummary}.`);

  const appearanceSummary = summarizeAppearance(character);
  if (appearanceSummary) sections.push(`Physical appearance: ${appearanceSummary}.`);

  if (character.personality.traits) sections.push(`Personality traits: ${character.personality.traits}.`);
  if (character.personality.ideals) sections.push(`Ideals: ${character.personality.ideals}.`);
  if (character.personality.bonds) sections.push(`Bonds: ${character.personality.bonds}.`);
  if (character.personality.flaws) sections.push(`Flaws: ${character.personality.flaws}.`);

  const expertises = summarizeExpertises(character);
  if (expertises) sections.push(`Expertises: ${expertises}.`);

  const talents = summarizeTalents(character);
  if (talents) sections.push(`Talents: ${talents}.`);

  if (character.features) sections.push(`Features: ${character.features}.`);
  if (character.proficienciesAndLanguages)
    sections.push(`Languages & proficiencies: ${character.proficienciesAndLanguages}.`);
  if (character.equipment) sections.push(`Equipment: ${character.equipment}.`);

  const currency = summarizeCurrency(character);
  if (currency) sections.push(`Currency: ${currency}.`);

  const resourcePools = summarizeResourcePools(character);
  if (resourcePools) sections.push(`Resource pools: ${resourcePools}.`);

  if (character.treasure) sections.push(`Treasure: ${character.treasure}.`);
  if (character.backstory) sections.push(`Backstory synopsis: ${character.backstory}.`);

  const basePrompt = sections.join(' ');

  return {
    name: character.name,
    basePrompt,
    narrative: {
      worldSummary: character.backstory || character.background,
      currentScene: firstKeyEvent(character),
      playerIntent: character.personality.ideals,
    },
    appearance: buildAppearanceAttributes(character),
    artStyle: 'High detail painterly fantasy illustration with dramatic lighting',
    tone:
      [character.personality.traits, character.alignment]
        .filter((value) => value && value.trim().length > 0)
        .join(' | ') || undefined,
  };
};

const resolveVariantName = (variant: keyof AvatarAssetResponse): string => {
  if (variant === 'upperBody') {
    return 'upper-body';
  }
  if (variant === 'fullBody') {
    return 'full-body';
  }
  return variant;
};

const buildFilename = (variant: keyof AvatarAssetResponse): string => sanitizeSegment(resolveVariantName(variant));

const saveVariantAsset = async (
  preview: AvatarPreviewImage,
  folder: string,
  variant: keyof AvatarAssetResponse
): Promise<AvatarAssetResponse[keyof AvatarAssetResponse]> => {
  const buffer = Buffer.from(preview.data, 'base64');
  const optimized = await optimizeImage(buffer, preview.mimeType, { target: TARGET_SPECS[variant] });

  if (!isBucketConfigured) {
    return {
      id: randomUUID(),
      mimeType: optimized.mimeType,
      storagePath: '',
      publicUrl: `data:${optimized.mimeType};base64,${optimized.buffer.toString('base64')}`,
      prompt: preview.prompt,
      createdAt: new Date().toISOString(),
    };
  }

  const extension = mime.getExtension(optimized.mimeType) ?? 'png';
  const stored = await saveAsset({
    buffer: optimized.buffer,
    contentType: optimized.mimeType,
    folder,
    filename: `${buildFilename(variant)}.${extension}`,
    metadata: {
      prompt: preview.prompt,
      variant,
    },
  });

  return {
    id: randomUUID(),
    mimeType: optimized.mimeType,
    storagePath: stored.path,
    publicUrl: stored.url,
    prompt: preview.prompt,
    createdAt: new Date().toISOString(),
  };
};

const toReferenceImage = (preview: AvatarPreviewImage, description: string): ReferenceImagePayload => ({
  mimeType: preview.mimeType,
  data: preview.data,
  description,
});

const storeOrInlineAsset = async (
  result: { buffer: Buffer; mimeType: string; prompt: string },
  folder: string,
  variant: keyof AvatarAssetResponse
) => {
  if (!isBucketConfigured) {
    return {
      id: randomUUID(),
      mimeType: result.mimeType,
      storagePath: '',
      publicUrl: `data:${result.mimeType};base64,${result.buffer.toString('base64')}`,
      prompt: result.prompt,
      createdAt: new Date().toISOString(),
    };
  }

  const extension = mime.getExtension(result.mimeType) ?? 'png';
  const stored = await saveAsset({
    buffer: result.buffer,
    contentType: result.mimeType,
    folder,
    filename: `${buildFilename(variant)}.${extension}`,
    metadata: {
      prompt: result.prompt,
      variant,
    },
  });

  return {
    id: randomUUID(),
    mimeType: result.mimeType,
    storagePath: stored.path,
    publicUrl: stored.url,
    prompt: result.prompt,
    createdAt: new Date().toISOString(),
  };
};

export const generateCharacterAvatars = async (character: CharacterSheet): Promise<AvatarAssetResponse> => {
  const payload = buildAvatarPayload(character);
  const folder = buildFolderPath(character);

  const portraitPrompt = buildAvatarPrompt(payload, 'portrait');
  const portraitResult = await generateImage({
    prompt: portraitPrompt,
    config: {
      size: '768',
    },
  });
  const optimizedPortrait = await optimizeImage(portraitResult.buffer, portraitResult.mimeType, {
    target: TARGET_SPECS.portrait,
  });
  const portraitPreview: AvatarPreviewImage = {
    mimeType: optimizedPortrait.mimeType,
    data: optimizedPortrait.buffer.toString('base64'),
    prompt: portraitPrompt,
    width: optimizedPortrait.width,
    height: optimizedPortrait.height,
  };
  const portraitReference = toReferenceImage(portraitPreview, 'Frontal face portrait reference');

  const upperBodyPrompt = buildAvatarPrompt(payload, 'upper-body');
  const upperBodyResult = await generateImage({
    prompt: upperBodyPrompt,
    references: [portraitReference],
    config: {
      size: '768',
    },
  });
  const optimizedUpperBody = await optimizeImage(upperBodyResult.buffer, upperBodyResult.mimeType, {
    target: TARGET_SPECS.upperBody,
  });
  const upperBodyPreview: AvatarPreviewImage = {
    mimeType: optimizedUpperBody.mimeType,
    data: optimizedUpperBody.buffer.toString('base64'),
    prompt: upperBodyPrompt,
    width: optimizedUpperBody.width,
    height: optimizedUpperBody.height,
  };
  const upperBodyReference = toReferenceImage(upperBodyPreview, 'Upper-body reference');

  const fullBodyPrompt = buildAvatarPrompt(payload, 'full-body');
  const fullBodyResult = await generateImage({
    prompt: fullBodyPrompt,
    references: [portraitReference, upperBodyReference],
    config: {
      size: '768',
    },
  });
  const optimizedFullBody = await optimizeImage(fullBodyResult.buffer, fullBodyResult.mimeType, {
    target: TARGET_SPECS.fullBody,
  });

  const assets: Partial<AvatarAssetResponse> = {};
  assets.portrait = await storeOrInlineAsset(
    { buffer: optimizedPortrait.buffer, mimeType: optimizedPortrait.mimeType, prompt: portraitPrompt },
    folder,
    'portrait'
  );
  assets.upperBody = await storeOrInlineAsset(
    { buffer: optimizedUpperBody.buffer, mimeType: optimizedUpperBody.mimeType, prompt: upperBodyPrompt },
    folder,
    'upperBody'
  );
  assets.fullBody = await storeOrInlineAsset(
    { buffer: optimizedFullBody.buffer, mimeType: optimizedFullBody.mimeType, prompt: fullBodyPrompt },
    folder,
    'fullBody'
  );

  return assets as AvatarAssetResponse;
};

export const storeCharacterAvatarPreviews = async (
  character: CharacterSheet,
  previews: AvatarPreviewResponse
): Promise<AvatarAssetResponse> => {
  const folder = buildFolderPath(character);
  const assets: Partial<AvatarAssetResponse> = {};

  const previewMap: Record<keyof AvatarAssetResponse, AvatarPreviewImage> = {
    portrait: previews.portrait,
    upperBody: previews.upperBody,
    fullBody: previews.fullBody,
  };

  for (const { key } of VIEW_VARIANTS) {
    const preview = previewMap[key];
    assets[key] = await saveVariantAsset(preview, folder, key);
  }

  return assets as AvatarAssetResponse;
};
