import type { SkillDetail } from '@daicer/engine';

export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
export type PortraitView = 'portrait' | 'upperBody' | 'fullBody';

export const ABILITY_LABELS: Array<{ key: AbilityKey; label: string; short: string }> = [
  { key: 'strength', label: 'Strength', short: 'STR' },
  { key: 'dexterity', label: 'Dexterity', short: 'DEX' },
  { key: 'constitution', label: 'Constitution', short: 'CON' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT' },
  { key: 'wisdom', label: 'Wisdom', short: 'WIS' },
  { key: 'charisma', label: 'Charisma', short: 'CHA' },
];

export const PORTRAIT_LABELS: Record<PortraitView, string> = {
  portrait: 'Face',
  upperBody: 'Upper Body',
  fullBody: 'Full Body',
};

export const SECTION_TITLE_CLASSES = 'text-xs uppercase tracking-[0.3em] text-shadow-400 font-semibold';

export const PROFICIENCY_LABEL_MAP: Record<SkillDetail['proficiency'], string> = {
  none: 'Untrained',
  trained: 'Trained',
  proficient: 'Proficient',
  expertise: 'Expertise',
};

export const PROFICIENCY_STYLE_MAP: Record<SkillDetail['proficiency'], string> = {
  none: 'border border-shadow-700 bg-shadow-900/60 text-shadow-300',
  trained: 'border border-midnight-400/50 bg-midnight-500/20 text-shadow-100',
  proficient: 'border border-aurora-400/60 bg-aurora-500/15 text-aurora-100',
  expertise: 'border border-nebula-400/60 bg-nebula-500/15 text-nebula-100',
};

export const formatModifier = (score: number): string => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export const formatSigned = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export const formatLabel = (value: string): string =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
