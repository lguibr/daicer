import { combatDemoSpellLoadouts, type CombatDemoSpellScript } from '@/shared/spellLoadouts';

import {
  baseGoblin,
  basePlayerFighter,
  basePlayerWizard,
  battleRogue,
  cleric,
  goblinArcher,
  hobgoblinCaptain,
  ogre,
  ranger,
} from './demoCharacters';
import type { SimulationAction, SimulationDefinition } from './types';

const getSpellScriptsForScenario = (scenarioId: string): CombatDemoSpellScript[] =>
  combatDemoSpellLoadouts[scenarioId] ?? [];

const classicSpellScripts = getSpellScriptsForScenario('demo-classic');
const flankSpellScripts = getSpellScriptsForScenario('demo-flank-assault');
const kitingSpellScripts = getSpellScriptsForScenario('demo-kiting');

export const SCENARIOS: SimulationDefinition[] = [
  {
    id: 'demo-classic',
    title: 'Heroes vs Goblins',
    description: 'Two heroes engage a goblin duo illustrating melee advance, retaliation, and flank strikes.',
    focus: 'Balanced melee exchange',
    seed: 1337,
    turnOrder: ['player-fighter', 'enemy-goblin-1', 'player-wizard', 'enemy-goblin-2'],
    createCharacters: () => [
      basePlayerFighter({ position: { x: 2, y: 3, z: 0 } }),
      basePlayerWizard({ position: { x: 2, y: 5, z: 0 } }),
      baseGoblin('enemy-goblin-1', 'Goblin Skirmisher', { x: 7, y: 4 }),
      baseGoblin('enemy-goblin-2', 'Goblin Sneak', { x: 8, y: 6 }),
    ],
    actions: [
      { type: 'startTurn', expectedActorId: 'player-fighter', description: 'Round 1 begins as Sir Amaranth charges.' },
      {
        type: 'move',
        actorId: 'player-fighter',
        position: { x: 4, y: 4 },
        description: 'Sir Amaranth advances to intercept the frontline goblin.',
      },
      {
        type: 'attack',
        actorId: 'player-fighter',
        targetId: 'enemy-goblin-1',
        weaponDamage: '1d8+4',
        damageType: 'slashing',
        description: 'Sir Amaranth swings his longsword at the skirmisher.',
      },
      { type: 'endTurn', description: 'Sir Amaranth holds position, ending his turn.' },
      { type: 'startTurn', expectedActorId: 'enemy-goblin-1', description: 'The wounded skirmisher retaliates.' },
      {
        type: 'attack',
        actorId: 'enemy-goblin-1',
        targetId: 'player-fighter',
        weaponDamage: '1d6+2',
        damageType: 'slashing',
        description: 'Goblin Skirmisher slashes back with a scimitar.',
      },
      { type: 'endTurn', description: 'Goblin Skirmisher disengages to regroup.' },
      { type: 'startTurn', expectedActorId: 'player-wizard', description: 'Lyra repositions for a clean shot.' },
      {
        type: 'move',
        actorId: 'player-wizard',
        position: { x: 3, y: 6 },
        description: 'Lyra strides to gain line of sight.',
      },
      ...(classicSpellScripts[0]
        ? ([
            {
              type: 'spellPreview',
              casterId: classicSpellScripts[0].casterId,
              spellId: classicSpellScripts[0].spellId,
              description: 'Lyra charts the Fireball blast radius before committing.',
              target: classicSpellScripts[0].target,
              obstacles: classicSpellScripts[0].obstacles,
              grid: classicSpellScripts[0].grid,
            },
            {
              type: 'spellCast',
              casterId: classicSpellScripts[0].casterId,
              spellId: classicSpellScripts[0].spellId,
              description: 'Lyra unleashes a Fireball that detonates amid the goblins.',
              target: classicSpellScripts[0].target,
              obstacles: classicSpellScripts[0].obstacles,
              grid: classicSpellScripts[0].grid,
            },
          ] satisfies SimulationAction[])
        : []),
      { type: 'endTurn', description: 'Lyra steadies herself after the spell.' },
      {
        type: 'startTurn',
        expectedActorId: 'enemy-goblin-2',
        description: 'The sneaking goblin lunges at the wizard.',
      },
      {
        type: 'move',
        actorId: 'enemy-goblin-2',
        position: { x: 5, y: 6 },
        description: 'Goblin Sneak darts forward to pressure Lyra.',
      },
      {
        type: 'attack',
        actorId: 'enemy-goblin-2',
        targetId: 'player-wizard',
        weaponDamage: '1d6+2',
        damageType: 'piercing',
        description: 'Goblin Sneak attempts a dagger strike on Lyra.',
      },
      { type: 'endTurn', description: 'Goblin Sneak snarls, expecting support.' },
    ],
  },
  {
    id: 'demo-flank-assault',
    title: 'Coordinated Flank',
    description: 'Fighter and rogue coordinate to flank a hobgoblin captain while an archer peppers the frontline.',
    focus: 'Positioning and advantage setup',
    seed: 2024,
    turnOrder: ['player-fighter', 'player-rogue', 'enemy-hobgoblin', 'enemy-archer'],
    createCharacters: () => [
      basePlayerFighter({ id: 'player-fighter', position: { x: 2, y: 6, z: 0 }, name: 'Captain Iria' }),
      battleRogue(),
      hobgoblinCaptain(),
      goblinArcher(),
    ],
    actions: [
      {
        type: 'startTurn',
        expectedActorId: 'player-fighter',
        description: 'Round 1: Captain Iria advances to draw the hobgoblin attention.',
      },
      {
        type: 'move',
        actorId: 'player-fighter',
        position: { x: 4, y: 6 },
        description: 'Captain Iria closes the distance with shield raised.',
      },
      {
        type: 'attack',
        actorId: 'player-fighter',
        targetId: 'enemy-hobgoblin',
        weaponDamage: '1d8+4',
        damageType: 'slashing',
        description: 'Captain Iria strikes the hobgoblin captain with a heavy slash.',
      },
      { type: 'endTurn', description: 'Captain Iria braces for retaliation.' },
      {
        type: 'startTurn',
        expectedActorId: 'player-rogue',
        description: 'Selene darts in, using the opening to flank.',
      },
      {
        type: 'move',
        actorId: 'player-rogue',
        position: { x: 5, y: 7 },
        description: 'Selene Quickstep slides into position behind the captain.',
      },
      ...(flankSpellScripts[0]
        ? ([
            {
              type: 'spellPreview',
              casterId: flankSpellScripts[0].casterId,
              spellId: flankSpellScripts[0].spellId,
              description: 'Selene tosses alchemical dust to outline the captain.',
              target: flankSpellScripts[0].target,
              obstacles: flankSpellScripts[0].obstacles,
              grid: flankSpellScripts[0].grid,
            },
            {
              type: 'spellCast',
              casterId: flankSpellScripts[0].casterId,
              spellId: flankSpellScripts[0].spellId,
              description: 'Faerie Fire ignites, granting advantage for the flank.',
              target: flankSpellScripts[0].target,
              obstacles: flankSpellScripts[0].obstacles,
              grid: flankSpellScripts[0].grid,
            },
          ] satisfies SimulationAction[])
        : []),
      { type: 'endTurn', description: 'Selene disengages lightly, poised to strike again.' },
      {
        type: 'startTurn',
        expectedActorId: 'enemy-hobgoblin',
        description: 'The hobgoblin captain roars, swinging at Captain Iria.',
      },
      {
        type: 'attack',
        actorId: 'enemy-hobgoblin',
        targetId: 'player-fighter',
        weaponDamage: '1d10+3',
        damageType: 'slashing',
        description: 'Hobgoblin Captain retaliates with a longsword slash.',
      },
      { type: 'endTurn', description: 'Hobgoblin Captain issues orders to the archer.' },
      {
        type: 'startTurn',
        expectedActorId: 'enemy-archer',
        description: 'Goblin sharpshooter takes aim at the rogue.',
      },
      {
        type: 'attack',
        actorId: 'enemy-archer',
        targetId: 'player-rogue',
        weaponDamage: '1d8+2',
        damageType: 'piercing',
        description: 'Goblin Sharpshooter fires an arrow at Selene.',
      },
      { type: 'endTurn', description: 'Goblin Sharpshooter reloads for the next volley.' },
    ],
  },
  {
    id: 'demo-kiting',
    title: 'Ranger Kiting Ogre',
    description: 'A ranger and cleric coordinate to kite an ogre, showing ranged focus and tactical retreat.',
    focus: 'Ranged kiting and support',
    seed: 4096,
    turnOrder: ['player-ranger', 'enemy-ogre', 'player-cleric'],
    createCharacters: () => [ranger(), ogre(), cleric({ position: { x: 3, y: 8, z: 0 } })],
    actions: [
      {
        type: 'startTurn',
        expectedActorId: 'player-ranger',
        description: 'Round 1: Kael opens with a ranged volley while keeping distance.',
      },
      {
        type: 'attack',
        actorId: 'player-ranger',
        targetId: 'enemy-ogre',
        weaponDamage: '1d8+4',
        damageType: 'piercing',
        description: 'Kael fires an arrow into the ogre.',
      },
      {
        type: 'move',
        actorId: 'player-ranger',
        position: { x: 3, y: 6 },
        description: 'Kael sidesteps to maintain spacing.',
      },
      { type: 'endTurn', description: 'Kael signals Brother Alden to stay ready.' },
      { type: 'startTurn', expectedActorId: 'enemy-ogre', description: 'The ogre stomps forward to close the gap.' },
      {
        type: 'move',
        actorId: 'enemy-ogre',
        position: { x: 6, y: 6 },
        description: 'Ogre Brute lumbers forward, shaking the ground.',
      },
      {
        type: 'attack',
        actorId: 'enemy-ogre',
        targetId: 'player-ranger',
        weaponDamage: '2d8+4',
        damageType: 'bludgeoning',
        description: 'Ogre swings its greatclub toward Kael.',
      },
      { type: 'endTurn', description: 'Ogre bellows in frustration.' },
      {
        type: 'startTurn',
        expectedActorId: 'player-cleric',
        description: 'Brother Alden reinforces Kael with radiant support.',
      },
      {
        type: 'note',
        description: 'Brother Alden channels divine power to bolster Kael (flavor note).',
      },
      ...(kitingSpellScripts[0]
        ? ([
            {
              type: 'spellPreview',
              casterId: kitingSpellScripts[0].casterId,
              spellId: kitingSpellScripts[0].spellId,
              description: 'Brother Alden lines up a Guiding Bolt across the ruins.',
              target: kitingSpellScripts[0].target,
              obstacles: kitingSpellScripts[0].obstacles,
              grid: kitingSpellScripts[0].grid,
            },
            {
              type: 'spellCast',
              casterId: kitingSpellScripts[0].casterId,
              spellId: kitingSpellScripts[0].spellId,
              description: 'Radiant energy streaks toward the ogre.',
              target: kitingSpellScripts[0].target,
              obstacles: kitingSpellScripts[0].obstacles,
              grid: kitingSpellScripts[0].grid,
            },
          ] satisfies SimulationAction[])
        : []),
      {
        type: 'move',
        actorId: 'player-cleric',
        position: { x: 4, y: 8 },
        description: 'Brother Alden shifts to keep the ranger within reach.',
      },
      { type: 'endTurn', description: 'Brother Alden prepares a warding prayer.' },
    ],
  },
];
