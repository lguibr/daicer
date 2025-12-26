import type { AdventureLength, Difficulty, WorldSize } from '@daicer/engine';

export const ADVENTURE_LENGTH_VALUES: AdventureLength[] = ['flash', 'short', 'medium', 'long', 'epic', 'legendary'];

export const ADVENTURE_LENGTH_FALLBACK: Record<
  AdventureLength,
  { label: string; detail: string; description: string }
> = {
  flash: { label: 'Flash', detail: '~1 session', description: 'Tightly scoped mission or prologue.' },
  short: { label: 'Short', detail: '2-3 sessions', description: 'Mini-arc with a singular objective.' },
  medium: { label: 'Standard', detail: '4-6 sessions', description: 'Season-length arc with side beats.' },
  long: { label: 'Long', detail: '8-12 sessions', description: 'Sprawling campaign with layered threats.' },
  epic: { label: 'Epic', detail: '12-18 sessions', description: 'World-shaping saga with multiple acts.' },
  legendary: { label: 'Legendary', detail: '20+ sessions', description: 'Generation-spanning chronicle.' },
};

export const DIFFICULTY_VALUES: Difficulty[] = ['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly'];

export const DIFFICULTY_FALLBACK: Record<Difficulty, { label: string; detail: string; description: string }> = {
  storyteller: { label: 'Storyteller', detail: 'Fail-forward', description: 'Conflict favors narrative beats.' },
  easy: { label: 'Relaxed', detail: 'Gentle stakes', description: 'Encounters rarely lethal; heroic tone.' },
  medium: { label: 'Standard', detail: 'Balanced risk', description: 'Tactical depth with fair danger.' },
  challenging: { label: 'Challenging', detail: 'Earned victories', description: 'Frequent pressure, limited rests.' },
  gritty: { label: 'Gritty', detail: 'Hard choices', description: 'Attrition matters; wounds linger.' },
  deadly: { label: 'Deadly', detail: 'High stakes', description: 'Relentless peril; failure has weight.' },
};

export const WORLD_SIZE_VALUES: WorldSize[] = ['intimate', 'small', 'medium', 'large', 'vast', 'epic'];

export const WORLD_SIZE_FALLBACK: Record<WorldSize, { label: string; detail: string; description: string }> = {
  intimate: { label: 'Intimate', detail: 'Local', description: 'One village, one dungeon, personal stakes.' },
  small: { label: 'Small', detail: 'Province', description: 'A handful of regions with linked politics.' },
  medium: { label: 'Standard', detail: 'Kingdom', description: 'Diverse biomes with faction influence.' },
  large: {
    label: 'Large',
    detail: 'Continent',
    description: 'Multiple empires, shifting alliances, sprawling threats.',
  },
  vast: { label: 'Vast', detail: 'Multiplanar', description: 'Planes, realms, and cosmic agendas.' },
  epic: {
    label: 'Epic',
    detail: 'Cosmology',
    description: 'Universe-spanning intrigue, divine conflicts, reality at stake.',
  },
};

export const PARTY_SIZE_VALUES = Array.from({ length: 8 }, (_, index) => index + 1);

export const STARTING_LEVEL_VALUES = Array.from({ length: 20 }, (_, index) => index + 1);

export function findDescription<T extends { value: string; description: string }>(
  collection: T[],
  value: string
): string {
  return collection.find((item) => item.value === value)?.description ?? '';
}

export function findDetail<T extends { value: string; detail: string }>(collection: T[], value: string): string {
  return collection.find((item) => item.value === value)?.detail ?? '';
}
