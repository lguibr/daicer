import { DEFAULT_WORLD_SETTINGS } from '@/constants';
import type { WorldSettings } from '@/types/index';

export const processingRooms = new Set<string>();

export function resolveWorldSettings(settings: Partial<WorldSettings> | null | undefined): WorldSettings {
  const base = settings ?? {};

  return {
    ...DEFAULT_WORLD_SETTINGS,
    ...base,
    startingLevel: typeof base.startingLevel === 'number' ? base.startingLevel : DEFAULT_WORLD_SETTINGS.startingLevel,
    attributePointBudget:
      typeof base.attributePointBudget === 'number'
        ? base.attributePointBudget
        : DEFAULT_WORLD_SETTINGS.attributePointBudget,
  };
}
