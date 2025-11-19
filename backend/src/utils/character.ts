import type { CharacterSheet } from '@/types/index';
import { characterSheetSchema } from '@/schemas/character';

function mergeRecords(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  let result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) {
      // Skip undefined values
    } else if (Array.isArray(value)) {
      result = {
        ...result,
        [key]: structuredClone(value),
      };
    } else if (value && typeof value === 'object') {
      const current = result[key];
      const base =
        current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
      result = {
        ...result,
        [key]: mergeRecords(base, value as Record<string, unknown>),
      };
    } else {
      result = {
        ...result,
        [key]: value,
      };
    }
  }

  return result;
}

export function mergeCharacterSheet(base: CharacterSheet, updates?: Partial<CharacterSheet>): CharacterSheet {
  const clone = structuredClone(base) as unknown as Record<string, unknown>;
  const merged = updates ? mergeRecords(clone, structuredClone(updates) as unknown as Record<string, unknown>) : clone;

  const parsed = characterSheetSchema.parse(merged);
  return parsed as CharacterSheet;
}
