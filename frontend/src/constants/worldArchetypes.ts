/**
 * @file World Archetype Constants
 * @description Pre-defined world types with default settings
 */

import type { WorldType } from '@daicer/engine';

export type ArchetypeSigil = 'mountain' | 'tide' | 'dune' | 'frost' | 'ember' | 'grove' | 'sky' | 'abyss' | 'custom';

export interface WorldArchetype {
  type: WorldType;
  sigil: ArchetypeSigil;
  translationKey: string;
  theme: string;
  setting: string;
  tone: string;
  background: string;
  description: string;
  mood: string;
}

export const WORLD_ARCHETYPES: Record<WorldType, WorldArchetype> = {
  terra: {
    type: 'terra',
    sigil: 'mountain',
    translationKey: 'archetypes.terra',
    theme: 'High fantasy frontier',
    setting: 'Border kingdoms and ancient ruins',
    tone: 'Adventurous',
    background: 'The Verdant Expanse wrestles with rising noble houses and forgotten magic.',
    description: 'Balanced realm of cities, wilderness, and mystery.',
    mood: 'Heroic',
  },
  water: {
    type: 'water',
    sigil: 'tide',
    translationKey: 'archetypes.water',
    theme: 'Oceanic saga',
    setting: 'Storm-churned archipelagos and coral citadels',
    tone: 'Swashbuckling',
    background: 'Fleets contest shattered isles while leviathans stir beneath the waves.',
    description: 'Naval intrigue, sea monsters, and pirate legends.',
    mood: 'Bold',
  },
  desert: {
    type: 'desert',
    sigil: 'dune',
    translationKey: 'archetypes.desert',
    theme: 'Sun-scorched empires',
    setting: 'Endless dunes hiding buried metropolises',
    tone: 'Mythic',
    background: 'Once-mighty sultanates now battle over dwindling oases and relics.',
    description: 'Harsh survival, mysticism, and caravan intrigue.',
    mood: 'Gritty',
  },
  ice: {
    type: 'ice',
    sigil: 'frost',
    translationKey: 'archetypes.ice',
    theme: 'Frozen twilight',
    setting: 'Glacial fjords and aurora-lit tundra',
    tone: 'Stoic',
    background: 'Tribes, giants, and spirits vie as ancient ice walls crack.',
    description: 'Survival tales amid biting cold and primal magic.',
    mood: 'Haunting',
  },
  volcanic: {
    type: 'volcanic',
    sigil: 'ember',
    translationKey: 'archetypes.volcanic',
    theme: 'Infernal crucible',
    setting: 'Molten calderas and basalt fortresses',
    tone: 'Intense',
    background: 'Firesworn cults awaken titans beneath the lava seas.',
    description: 'Explosive conflicts and cataclysmic power.',
    mood: 'Fierce',
  },
  forest: {
    type: 'forest',
    sigil: 'grove',
    translationKey: 'archetypes.forest',
    theme: 'Enchanted wilds',
    setting: 'Living woods and crystal-clear glades',
    tone: 'Wonderous',
    background: 'Ancient courts of fae and druids contest mortal expansion.',
    description: 'Mystic nature tales with trickster spirits.',
    mood: 'Serene',
  },
  sky: {
    type: 'sky',
    sigil: 'sky',
    translationKey: 'archetypes.sky',
    theme: 'Cloudborne kingdoms',
    setting: 'Floating citadels and skyship routes',
    tone: 'Daring',
    background: 'Aerial guilds and storm giants vie for dominion above.',
    description: 'High-altitude adventures with vertiginous stakes.',
    mood: 'Exhilarating',
  },
  underground: {
    type: 'underground',
    sigil: 'abyss',
    translationKey: 'archetypes.underground',
    theme: 'Subterranean labyrinths',
    setting: 'Cavernous empires and luminous fungi forests',
    tone: 'Tense',
    background: 'Deep clans broker fragile truces against aberrant horrors.',
    description: 'Claustrophobic journeys through endless tunnels.',
    mood: 'Brooding',
  },
  custom: {
    type: 'custom',
    sigil: 'custom',
    translationKey: 'archetypes.custom',
    theme: 'Tailored concept',
    setting: 'Define your own realm',
    tone: 'Adaptive',
    background: 'A blank canvas awaiting collaborative worldbuilding.',
    description: 'Start from scratch with bespoke lore and style.',
    mood: 'Flexible',
  },
};
