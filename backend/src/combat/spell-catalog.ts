/**
 * @file backend/src/combat/spell-catalog.ts
 * @description Shared spell catalog loader for combat nodes and tools
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SpellData } from '../types/spells';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

let spellCache: SpellData[] | null = null;

function loadSpellData(): SpellData[] {
  if (spellCache) {
    return spellCache;
  }

  const spellsPath = join(__dirname, '../../../seeds/game-data/spells.json');
  const raw = readFileSync(spellsPath, 'utf-8');
  spellCache = JSON.parse(raw) as SpellData[];
  return spellCache;
}

export function getAllSpells(): SpellData[] {
  return loadSpellData();
}

export function getSpellById(spellId: string): SpellData | undefined {
  return loadSpellData().find((spell) => spell.id === spellId);
}

export function getSpellByIdOrThrow(spellId: string): SpellData {
  const spell = getSpellById(spellId);
  if (!spell) {
    throw new Error(`Spell not found: ${spellId}`);
  }
  return spell;
}
