/**
 * @file frontend/src/services/spells.ts
 * @description Spell data service for frontend
 */

 
import spellsData from '../data/spells.json';
import type { SpellData } from '../types/spells';

const spells = spellsData as unknown as SpellData[];

export function getAllSpells(): SpellData[] {
  return spells;
}

export function getSpellById(id: string): SpellData | undefined {
  return spells.find((s) => s.id === id);
}

export function getSpellsByLevel(level: number): SpellData[] {
  return spells.filter((s) => s.level === level);
}

export function getSpellsByShape(shape: string): SpellData[] {
  return spells.filter((s) => s.effectShape === shape);
}

export function searchSpells(query: string): SpellData[] {
  const q = query.toLowerCase();
  return spells.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
}
