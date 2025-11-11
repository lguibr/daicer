import type { CombatState, CombatCharacter } from '@/graph/state';
import { createCombatSession } from '../graph';

export interface CombatSimulationStep {
  index: number;
  timestamp: number;
  description: string;
  state: CombatState;
}

export interface CombatSimulationResult {
  id: string;
  title: string;
  description: string;
  focus: string;
  seed: number;
  rounds: number;
  steps: CombatSimulationStep[];
  finalState: CombatState;
  createdAt: number;
}

export interface CombatSimulationSummary {
  id: string;
  title: string;
  description: string;
  focus: string;
}

type SimulationAction =
  | {
      type: 'startTurn';
      expectedActorId?: string;
      description: string;
    }
  | {
      type: 'move';
      actorId: string;
      position: { x: number; y: number };
      description: string;
    }
  | {
      type: 'attack';
      actorId: string;
      targetId: string;
      weaponDamage?: string;
      damageType?: string;
      description: string;
    }
  | {
      type: 'endTurn';
      description: string;
    }
  | {
      type: 'note';
      description: string;
    };

interface SimulationDefinition {
  id: string;
  title: string;
  description: string;
  focus: string;
  seed: number;
  turnOrder: string[];
  createCharacters: () => CombatCharacter[];
  actions: SimulationAction[];
}

function cloneState(state: CombatState): CombatState {
  return JSON.parse(JSON.stringify(state)) as CombatState;
}

function basePlayerFighter(partial?: Partial<CombatCharacter>): CombatCharacter {
  return {
    id: 'player-fighter',
    name: 'Sir Amaranth',
    hp: 36,
    maxHp: 36,
    tempHp: 0,
    armorClass: 18,
    position: { x: 2, y: 2 },
    initiative: 0,
    avatar: 'player-fighter',
    isPlayer: true,
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 11,
    charisma: 10,
    proficiencyBonus: 3,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 6,
    conditions: [],
    ...partial,
  };
}

function basePlayerWizard(partial?: Partial<CombatCharacter>): CombatCharacter {
  return {
    id: 'player-wizard',
    name: 'Lyra the Bright',
    hp: 22,
    maxHp: 22,
    tempHp: 0,
    armorClass: 14,
    position: { x: 2, y: 4 },
    initiative: 0,
    avatar: 'player-wizard',
    isPlayer: true,
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 14,
    charisma: 12,
    proficiencyBonus: 3,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 6,
    conditions: [],
    ...partial,
  };
}

function baseGoblin(id: string, name: string, position: { x: number; y: number }): CombatCharacter {
  return {
    id,
    name,
    hp: 14,
    maxHp: 14,
    tempHp: 0,
    armorClass: 13,
    position,
    initiative: 0,
    avatar: id,
    isPlayer: false,
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
    proficiencyBonus: 2,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 6,
    conditions: [],
  };
}

function hobgoblinCaptain(): CombatCharacter {
  return {
    id: 'enemy-hobgoblin',
    name: 'Hobgoblin Captain',
    hp: 45,
    maxHp: 45,
    tempHp: 0,
    armorClass: 17,
    position: { x: 7, y: 6 },
    initiative: 0,
    avatar: 'enemy-hobgoblin',
    isPlayer: false,
    strength: 17,
    dexterity: 13,
    constitution: 14,
    intelligence: 12,
    wisdom: 10,
    charisma: 12,
    proficiencyBonus: 3,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 6,
    conditions: [],
  };
}

function goblinArcher(): CombatCharacter {
  return {
    id: 'enemy-archer',
    name: 'Goblin Sharpshooter',
    hp: 18,
    maxHp: 18,
    tempHp: 0,
    armorClass: 14,
    position: { x: 9, y: 3 },
    initiative: 0,
    avatar: 'enemy-archer',
    isPlayer: false,
    strength: 8,
    dexterity: 16,
    constitution: 12,
    intelligence: 10,
    wisdom: 10,
    charisma: 8,
    proficiencyBonus: 2,
    speed: 6,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 6,
    conditions: [],
  };
}

function battleRogue(): CombatCharacter {
  return {
    id: 'player-rogue',
    name: 'Selene Quickstep',
    hp: 28,
    maxHp: 28,
    tempHp: 0,
    armorClass: 15,
    position: { x: 2, y: 8 },
    initiative: 0,
    avatar: 'player-rogue',
    isPlayer: true,
    strength: 10,
    dexterity: 18,
    constitution: 12,
    intelligence: 13,
    wisdom: 12,
    charisma: 14,
    proficiencyBonus: 3,
    speed: 8,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 8,
    conditions: [],
  };
}

function ranger(): CombatCharacter {
  return {
    id: 'player-ranger',
    name: 'Kael Swiftwind',
    hp: 30,
    maxHp: 30,
    tempHp: 0,
    armorClass: 16,
    position: { x: 2, y: 6 },
    initiative: 0,
    avatar: 'player-ranger',
    isPlayer: true,
    strength: 12,
    dexterity: 18,
    constitution: 12,
    intelligence: 11,
    wisdom: 15,
    charisma: 10,
    proficiencyBonus: 3,
    speed: 7,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 7,
    conditions: [],
  };
}

function cleric(partial?: Partial<CombatCharacter>): CombatCharacter {
  return {
    id: 'player-cleric',
    name: 'Brother Alden',
    hp: 32,
    maxHp: 32,
    tempHp: 0,
    armorClass: 18,
    position: { x: 2, y: 8 },
    initiative: 0,
    avatar: 'player-cleric',
    isPlayer: true,
    strength: 14,
    dexterity: 10,
    constitution: 14,
    intelligence: 12,
    wisdom: 17,
    charisma: 12,
    proficiencyBonus: 3,
    speed: 5,
    reach: 1,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 5,
    conditions: [],
    ...partial,
  };
}

function ogre(): CombatCharacter {
  return {
    id: 'enemy-ogre',
    name: 'Ogre Brute',
    hp: 59,
    maxHp: 59,
    tempHp: 0,
    armorClass: 11,
    position: { x: 9, y: 6 },
    initiative: 0,
    avatar: 'enemy-ogre',
    isPlayer: false,
    strength: 19,
    dexterity: 8,
    constitution: 16,
    intelligence: 5,
    wisdom: 7,
    charisma: 7,
    proficiencyBonus: 2,
    speed: 4,
    reach: 2,
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: 4,
    conditions: [],
  };
}

const SCENARIOS: SimulationDefinition[] = [
  {
    id: 'demo-classic',
    title: 'Heroes vs Goblins',
    description: 'Two heroes engage a goblin duo illustrating melee advance, retaliation, and flank strikes.',
    focus: 'Balanced melee exchange',
    seed: 1337,
    turnOrder: ['player-fighter', 'enemy-goblin-1', 'player-wizard', 'enemy-goblin-2'],
    createCharacters: () => [
      basePlayerFighter({ position: { x: 2, y: 3 } }),
      basePlayerWizard({ position: { x: 2, y: 5 } }),
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
      {
        type: 'attack',
        actorId: 'player-wizard',
        targetId: 'enemy-goblin-1',
        weaponDamage: '1d10+3',
        damageType: 'fire',
        description: 'Lyra hurls a fire bolt to finish the skirmisher.',
      },
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
      basePlayerFighter({ id: 'player-fighter', position: { x: 2, y: 6 }, name: 'Captain Iria' }),
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
      {
        type: 'attack',
        actorId: 'player-rogue',
        targetId: 'enemy-hobgoblin',
        weaponDamage: '1d6+4',
        damageType: 'piercing',
        description: 'Selene punctures the captain with a precise sneak attack.',
      },
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
    createCharacters: () => [ranger(), ogre(), cleric({ position: { x: 3, y: 8 } })],
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

const SCENARIO_MAP = new Map<string, SimulationDefinition>(SCENARIOS.map((scenario) => [scenario.id, scenario]));
const simulationCache = new Map<string, CombatSimulationResult>();

async function executeAction(
  session: ReturnType<typeof createCombatSession>,
  action: SimulationAction,
  timeline: CombatSimulationStep[],
  baseTimestamp: number
): Promise<void> {
  const recordStep = (description: string) => {
    const stateSnap = cloneState(session.getState());
    timeline.push({
      index: timeline.length,
      timestamp: baseTimestamp + timeline.length,
      description,
      state: stateSnap,
    });
  };

  switch (action.type) {
    case 'note': {
      recordStep(action.description);
      break;
    }
    case 'startTurn': {
      await session.startTurn();
      let active = session.getActiveCharacter();
      if (action.expectedActorId && active?.id !== action.expectedActorId) {
        const order = session.getState().turnOrder;
        let safety = order.length + 2;
        while (action.expectedActorId && active?.id !== action.expectedActorId && safety > 0) {
          await session.endTurn();
          await session.startTurn();
          active = session.getActiveCharacter();
          safety -= 1;
        }
      }
      recordStep(action.description);
      break;
    }
    case 'move': {
      await session.moveCharacter(action.actorId, action.position);
      recordStep(action.description);
      break;
    }
    case 'attack': {
      await session.attack(action.actorId, action.targetId, {
        weaponDamage: action.weaponDamage,
        damageType: action.damageType,
      });
      recordStep(action.description);
      break;
    }
    case 'endTurn': {
      await session.endTurn();
      recordStep(action.description);
      break;
    }
    default: {
      const exhaustive: never = action;
      throw new Error(`Unhandled simulation action type ${(exhaustive as SimulationAction).type}`);
    }
  }
}

async function runSimulationDefinition(definition: SimulationDefinition): Promise<CombatSimulationResult> {
  const session = createCombatSession(definition.id, definition.seed);
  const characters = definition.createCharacters();

  await session.startCombat(characters);

  // Override initiative order for deterministic scripting
  const state = session.getState();
  state.turnOrder = [...definition.turnOrder];
  state.activeCharacterId = null;
  state.round = 1;

  const timeline: CombatSimulationStep[] = [];
  const baseTimestamp = Date.now();

  for (const action of definition.actions) {
    if (session.isCombatOver()) break;
    // eslint-disable-next-line no-await-in-loop
    await executeAction(session, action, timeline, baseTimestamp);
  }

  const finalState = cloneState(session.getState());

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    focus: definition.focus,
    seed: definition.seed,
    rounds: finalState.round,
    steps: timeline,
    finalState,
    createdAt: baseTimestamp,
  };
}

export function listSimulations(): CombatSimulationSummary[] {
  return SCENARIOS.map(({ id, title, description, focus }) => ({
    id,
    title,
    description,
    focus,
  }));
}

export async function getSimulationById(simulationId: string): Promise<CombatSimulationResult | null> {
  const definition = SCENARIO_MAP.get(simulationId);
  if (!definition) return null;

  if (simulationCache.has(simulationId)) {
    return simulationCache.get(simulationId) ?? null;
  }

  const result = await runSimulationDefinition(definition);
  simulationCache.set(simulationId, result);
  return result;
}
