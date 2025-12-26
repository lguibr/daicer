import type { Attribute } from '../@daicer/engine';
import type { AvatarPreviewResponse } from '../../../types/assets';

export const ATTRIBUTES: Attribute[] = [
  'Strength' as Attribute,
  'Dexterity' as Attribute,
  'Constitution' as Attribute,
  'Intelligence' as Attribute,
  'Wisdom' as Attribute,
  'Charisma' as Attribute,
];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const EYE_COLOR_OPTIONS = ['Amber', 'Blue', 'Brown', 'Gray', 'Green', 'Hazel', 'Violet'];
export const SKIN_TONE_OPTIONS = ['Pale', 'Fair', 'Olive', 'Sun-kissed', 'Bronze', 'Deep', 'Otherworldly'];
export const HAIR_STYLE_OPTIONS = ['Black', 'Brown', 'Blonde', 'Red', 'White', 'Silver', 'Bald', 'Vibrant'];

export const DEFAULT_APPEARANCE_AGE = 24;
export const DEFAULT_APPEARANCE_HEIGHT = 170;
export const DEFAULT_APPEARANCE_WEIGHT = 72;

export const MAX_PREVIEW_DIMENSION = 512;
export const PREVIEW_OUTPUT_MIME = 'image/webp';
export const PREVIEW_OUTPUT_QUALITY = 0.85;

export const previewPlaceholders: Array<{ key: keyof AvatarPreviewResponse; src: string; labelKey: string }> = [
  {
    key: 'portrait',
    src: '/face.png',
    labelKey: 'characterCreation.portraits.labels.portrait',
  },
  {
    key: 'upperBody',
    src: '/upper.png',
    labelKey: 'characterCreation.portraits.labels.upperBody',
  },
  {
    key: 'fullBody',
    src: '/full.png',
    labelKey: 'characterCreation.portraits.labels.fullBody',
  },
];

export const PLACEHOLDER_REFERENCES: Record<
  keyof AvatarPreviewResponse,
  { src: string; description: string; mimeType: string }
> = {
  portrait: { src: '/face.png', description: 'Portrait framing reference', mimeType: 'image/png' },
  upperBody: { src: '/upper.png', description: 'Upper body framing reference', mimeType: 'image/png' },
  fullBody: { src: '/full.png', description: 'Full body framing reference', mimeType: 'image/png' },
};
