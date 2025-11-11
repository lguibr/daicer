import type {
  ActionFramePayload,
  AppearanceAttributes,
  AvatarGenerationPayload,
  GridBackgroundPayload,
} from '@/types/assets';

const cleanSentence = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
};

const joinSentences = (parts: Array<string | undefined>): string => {
  return parts
    .map((part) => cleanSentence(part))
    .filter((part) => part.length > 0)
    .join(' ');
};

const formatAppearance = (appearance?: AppearanceAttributes): string => {
  if (!appearance) {
    return '';
  }

  const details: string[] = [];
  if (appearance.race) details.push(`Race: ${appearance.race}`);
  if (appearance.lineage) details.push(`Lineage: ${appearance.lineage}`);
  if (appearance.classRole) details.push(`Class: ${appearance.classRole}`);
  if (appearance.genderPresentation) details.push(`Gender presentation: ${appearance.genderPresentation}`);
  if (appearance.hair) details.push(`Hair: ${appearance.hair}`);
  if (appearance.eyes) details.push(`Eyes: ${appearance.eyes}`);
  if (appearance.attire) details.push(`Outfit: ${appearance.attire}`);
  if (appearance.accessories) details.push(`Accessories: ${appearance.accessories}`);
  if (appearance.notableFeatures) details.push(`Notable features: ${appearance.notableFeatures}`);

  return details.length > 0 ? `Appearance details -> ${details.join('; ')}` : '';
};

const describeNarrative = (payload: AvatarGenerationPayload | ActionFramePayload): string => {
  const narrative = payload.narrative;
  if (!narrative) {
    return '';
  }

  const summary = narrative.worldSummary ? `World: ${narrative.worldSummary}` : '';
  const scene = narrative.currentScene ? `Current scene: ${narrative.currentScene}` : '';
  const player = narrative.playerIntent ? `Player intent: ${narrative.playerIntent}` : '';

  return joinSentences(['Narrative context:', summary, scene, player]);
};

export type AvatarView = 'portrait' | 'upper-body' | 'full-body';

const viewDirectives: Record<AvatarView, string> = {
  portrait: 'Tight portrait framing. Show the head and shoulders only.',
  'upper-body': 'Mid-shot framing. Show the character from head to waist, including arms.',
  'full-body': 'Full body framing. Show boots, stance, and weaponry if present.',
};

export const buildAvatarPrompt = (payload: AvatarGenerationPayload, view: AvatarView): string => {
  const nameLine = payload.name ? `Character name: ${payload.name}.` : '';
  const artStyle = payload.artStyle
    ? `Art style goal: ${payload.artStyle}.`
    : 'High fidelity, painterly fantasy rendering.';
  const tone = payload.tone ? `Mood and tone: ${payload.tone}.` : 'Mood: heroic, adventurous, cinematic lighting.';

  return joinSentences([
    'Generate a single fantasy RPG character illustration.',
    `Base concept: ${payload.basePrompt}`,
    nameLine,
    formatAppearance(payload.appearance),
    describeNarrative(payload),
    viewDirectives[view],
    'Ensure cohesive lighting across variants and consistent costume details.',
    artStyle,
    tone,
    'Disable text overlays and watermarks.',
  ]);
};

export const buildGridPrompt = (payload: GridBackgroundPayload): string => {
  const biomeLine = payload.biome ? `Biome: ${payload.biome}.` : '';
  const lighting = payload.lighting
    ? `Lighting: ${payload.lighting}.`
    : 'Lighting: dramatic top-down with soft shadows.';
  const mood = payload.mood ? `Mood: ${payload.mood}.` : 'Mood: immersive, inviting exploration.';

  return joinSentences([
    'Generate an isometric RPG battle map tile background.',
    `Theme: ${payload.themePrompt}`,
    `Grid size columns=${payload.gridSize.columns}, rows=${payload.gridSize.rows}.`,
    biomeLine,
    lighting,
    mood,
    'Keep grid lines subtle but readable. Provide rich environmental storytelling details.',
    'No characters or UI; background only.',
  ]);
};

export const buildActionFramePrompt = (payload: ActionFramePayload): string => {
  const stakes = payload.stakes ? `Narrative stakes: ${payload.stakes}.` : '';
  const camera = payload.cameraAngle
    ? `Camera angle: ${payload.cameraAngle}.`
    : 'Camera angle: dynamic, three-quarter perspective.';
  const motion = payload.motionStyle
    ? `Motion style: ${payload.motionStyle}.`
    : 'Depict vivid motion blur and spell effects.';

  return joinSentences([
    'Generate a cinematic action frame illustration highlighting a climactic RPG moment.',
    `Focus: ${payload.basePrompt}`,
    describeNarrative(payload),
    stakes,
    camera,
    motion,
    'Balance clarity of main character with energetic particle effects.',
    'No UI elements or borders. Provide cohesive color grading.',
  ]);
};
