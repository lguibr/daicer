/**
 * @file backend/src/combat/spell-catalog.ts
 * @description Shared spell catalog loader for combat nodes and tools
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { SpellData } from '../types/spells';

function resolveSpellsPath(): string {
  const candidates = [
    '../seeds/game-data/spells.json',
    '../../seeds/game-data/spells.json',
    'seeds/game-data/spells.json',
  ].map((relativePath) => resolve(process.cwd(), relativePath));

  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error('Unable to locate seeds/game-data/spells.json for spell catalog.');
  }
  return match;
}

let spellCache: SpellData[] | null = null;

function loadSpellData(): SpellData[] {
  if (spellCache) {
    return spellCache;
  }

  const spellsPath = resolveSpellsPath();
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
