import type { CharacterSheet } from '@/types/index';
import { characterSheetSchema } from '@/schemas/character';

function mergeRecords(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      target[key] = structuredClone(value);
      continue;
    }

    if (value && typeof value === 'object') {
      const current = target[key];
      const base =
        current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
      mergeRecords(base, value as Record<string, unknown>);
      target[key] = base;
      continue;
    }

    target[key] = value;
  }
}

export function mergeCharacterSheet(base: CharacterSheet, updates?: Partial<CharacterSheet>): CharacterSheet {
  const clone = structuredClone(base) as Record<string, unknown>;
  if (updates) {
    mergeRecords(clone, updates as Record<string, unknown>);
  }

  return characterSheetSchema.parse(clone as CharacterSheet);
}
