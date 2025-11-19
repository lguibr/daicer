export interface CombatDemoGridConfig {
  width: number;
  height: number;
}

export interface CombatDemoGridPosition {
  x: number;
  y: number;
}

export type CombatDemoTarget =
  | {
      type: 'point';
      x: number;
      y: number;
    }
  | {
      type: 'direction';
      direction: number;
    };

export interface CombatDemoSpellScript {
  spellId: string;
  casterId: string;
  description: string;
  target: CombatDemoTarget;
  obstacles?: CombatDemoGridPosition[];
  grid?: CombatDemoGridConfig;
}

export type CombatDemoSpellLoadouts = Record<string, CombatDemoSpellScript[]>;

export const combatDemoSpellLoadouts: CombatDemoSpellLoadouts = {
  'demo-classic': [
    {
      spellId: 'fireball',
      casterId: 'player-wizard',
      description: 'Lyra hurls a Fireball toward the clustered goblins.',
      target: { type: 'point', x: 7, y: 5 },
    },
    {
      spellId: 'magic-missile',
      casterId: 'player-wizard',
      description: 'Lyra follows up with Magic Missile to finish the stragglers.',
      target: { type: 'point', x: 7, y: 4 },
    },
  ],
  'demo-flank-assault': [
    {
      spellId: 'faerie-fire',
      casterId: 'player-rogue',
      description: 'Selene cracks an alchemical charge mimicking Faerie Fire.',
      target: { type: 'direction', direction: 6 },
      obstacles: [
        { x: 6, y: 5 },
        { x: 6, y: 6 },
      ],
      grid: { width: 14, height: 12 },
    },
  ],
  'demo-kiting': [
    {
      spellId: 'guiding-bolt',
      casterId: 'player-cleric',
      description: 'Brother Alden fires a Guiding Bolt to mark the ogre.',
      target: { type: 'point', x: 6, y: 6 },
      grid: { width: 16, height: 12 },
    },
  ],
};
