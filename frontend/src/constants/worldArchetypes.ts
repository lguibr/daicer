/**
 * @file World Archetype Constants
 * @description Pre-defined world types with default settings
 */

import type { WorldType } from '../types/shared';

export type ArchetypeSigil = 'mountain' | 'tide' | 'dune' | 'frost' | 'ember' | 'grove' | 'sky' | 'abyss' | 'custom';

export interface WorldArchetype {
  type: WorldType;
  sigil: ArchetypeSigil;
  translationKey: string;
}

export const WORLD_ARCHETYPES: Record<WorldType, WorldArchetype> = {
  terra: {
    type: 'terra',
    sigil: 'mountain',
    translationKey: 'archetypes.terra',
  },
  water: {
    type: 'water',
    sigil: 'tide',
    translationKey: 'archetypes.water',
  },
  desert: {
    type: 'desert',
    sigil: 'dune',
    translationKey: 'archetypes.desert',
  },
  ice: {
    type: 'ice',
    sigil: 'frost',
    translationKey: 'archetypes.ice',
  },
  volcanic: {
    type: 'volcanic',
    sigil: 'ember',
    translationKey: 'archetypes.volcanic',
  },
  forest: {
    type: 'forest',
    sigil: 'grove',
    translationKey: 'archetypes.forest',
  },
  sky: {
    type: 'sky',
    sigil: 'sky',
    translationKey: 'archetypes.sky',
  },
  underground: {
    type: 'underground',
    sigil: 'abyss',
    translationKey: 'archetypes.underground',
  },
  custom: {
    type: 'custom',
    sigil: 'custom',
    translationKey: 'archetypes.custom',
  },
};
