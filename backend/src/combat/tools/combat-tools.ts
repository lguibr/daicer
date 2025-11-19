import { tool } from '@langchain/core/tools';
import { Command } from '@langchain/langgraph';
import type { CombatCharacter, GameplayState } from '@/graph/state';
import { v4 as uuidv4 } from 'uuid';
import { getCombatSession } from './session';
import {
  StartCombatSchema,
  AttackSchema,
  MoveSchema,
  EndTurnSchema,
  EndCombatSchema,
  SpellPreviewSchema,
  SpellCastSchema,
} from './schemas';
import { getSpellByIdOrThrow } from '../spell-catalog';
import type { GridPosition } from '../../types/spells';

export const startCombatTool = tool(
  async ({ playerIds, enemyNames }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return JSON.stringify({
        success: false,
        message: 'Error: No game state available',
        error: 'STATE_NOT_FOUND',
      });
    }

    const { roomId } = state;
    const players = state.players || [];
    const creatures = state.creatures || [];

    const playerCharacters: CombatCharacter[] = playerIds
      .map((playerId) => {
        const player = players.find((p) => p.id === playerId);
        if (!player || !player.character) return null;

        const char = player.character;
        const dexModifier = Math.floor(((char.attributes?.Dexterity ?? 10) - 10) / 2);
        const armorClass = char.armorClass ?? 10 + dexModifier;
        const speed = 30; // Default speed

        return {
          id: uuidv4(),
          playerId: player.id,
          name: char.name,
          avatar: '',
          hp: char.hp ?? char.maxHp ?? 10,
          maxHp: char.maxHp ?? 10,
          tempHp: char.temporaryHp ?? 0,
          armorClass,
          initiative: dexModifier,
          position: { x: 0, y: 0 },
          isPlayer: true,
          strength: char.attributes?.Strength ?? 10,
          dexterity: char.attributes?.Dexterity ?? 10,
          constitution: char.attributes?.Constitution ?? 10,
          intelligence: char.attributes?.Intelligence ?? 10,
          wisdom: char.attributes?.Wisdom ?? 10,
          charisma: char.attributes?.Charisma ?? 10,
          proficiencyBonus: Math.floor((char.level - 1) / 4) + 2,
          speed,
          reach: 1,
          hasMoved: false,
          hasActed: false,
          hasReaction: true,
          hasBonusAction: true,
          movementRemaining: speed,
          conditions: [],
          deathSaves: {
            successes: 0,
            failures: 0,
          },
        };
      })
      .filter((c): c is Exclude<typeof c, null> => c !== null);

    const enemyCharacters: CombatCharacter[] = enemyNames
      .map((enemyName, index) => {
        const creature = creatures.find((c) => c.name === enemyName);

        const defaultSpeed = 30;

        if (!creature) {
          return {
            id: uuidv4(),
            name: enemyName,
            avatar: '',
            hp: 20,
            maxHp: 20,
            tempHp: 0,
            armorClass: 12,
            initiative: 0,
            position: { x: 9, y: index },
            isPlayer: false,
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            proficiencyBonus: 2,
            speed: defaultSpeed,
            reach: 1,
            hasMoved: false,
            hasActed: false,
            hasReaction: true,
            hasBonusAction: true,
            movementRemaining: defaultSpeed,
            conditions: [],
          };
        }

        return {
          id: uuidv4(),
          name: creature.name,
          avatar: '',
          hp: creature.hp,
          maxHp: creature.maxHp ?? creature.hp,
          tempHp: 0,
          armorClass: 12, // Default AC
          initiative: 0, // Default initiative
          position: { x: 9, y: index },
          isPlayer: false,
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          proficiencyBonus: 2,
          speed: defaultSpeed,
          reach: 1,
          hasMoved: false,
          hasActed: false,
          hasReaction: true,
          hasBonusAction: true,
          movementRemaining: defaultSpeed,
          conditions: [],
        };
      })
      .filter((c): c is Exclude<typeof c, null> => c !== null);

    const allCharacters = [...playerCharacters, ...enemyCharacters];
    const session = getCombatSession(roomId);
    const combatState = await session.startCombat(allCharacters);

    return new Command({
      update: { combatState } as Partial<GameplayState>,
      goto: 'combat_node',
    });
  },
  {
    name: 'start_combat',
    description: 'Initiate tactical combat with specific players and enemies',
    schema: StartCombatSchema,
  }
);

export const attackTool = tool(
  async ({ attackerName, targetName, weaponDamage, damageType }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);
    const combatState = session.getState();

    const attacker = combatState.characters.find((c: CombatCharacter) => c.name === attackerName);
    const target = combatState.characters.find((c: CombatCharacter) => c.name === targetName);

    if (!attacker || !target) {
      return `Error: Could not find ${!attacker ? 'attacker' : 'target'}`;
    }

    const updatedState = await session.attack(attacker.id, target.id, {
      weaponDamage,
      damageType,
    });

    return new Command({
      update: { combatState: updatedState } as Partial<GameplayState>,
    });
  },
  {
    name: 'attack',
    description: 'Execute an attack action in combat',
    schema: AttackSchema,
  }
);

export const moveTool = tool(
  async ({ characterName, targetX, targetY }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);
    const combatState = session.getState();

    const character = combatState.characters.find((c: CombatCharacter) => c.name === characterName);

    if (!character) {
      return `Error: Character ${characterName} not found`;
    }

    const updatedState = await session.moveCharacter(character.id, { x: targetX, y: targetY });

    return new Command({
      update: { combatState: updatedState } as Partial<GameplayState>,
    });
  },
  {
    name: 'move',
    description: 'Move a character to a new position on the combat grid',
    schema: MoveSchema,
  }
);

export const endTurnTool = tool(
  async (_, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);
    const updatedState = await session.endTurn();

    return new Command({
      update: { combatState: updatedState } as Partial<GameplayState>,
    });
  },
  {
    name: 'end_turn',
    description: 'End the current character turn and advance initiative',
    schema: EndTurnSchema,
  }
);

export const endCombatTool = tool(
  async (_data, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);

    // End combat by setting isCombatOver flag
    const finalState = await session.endTurn();

    return new Command({
      update: {
        combatState: { ...finalState, isCombatOver: true },
        waitingForAction: false,
      } as Partial<GameplayState>,
      goto: 'gameplay_node',
    });
  },
  {
    name: 'end_combat',
    description: 'End combat and return to narrative gameplay',
    schema: EndCombatSchema,
  }
);

export const spellPreviewTool = tool(
  async ({ casterName, spellId, target, scenario }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);
    const combatState = session.getState();

    const caster = combatState.characters.find((c: CombatCharacter) => c.name === casterName);
    if (!caster) {
      return `Error: Caster ${casterName} not found`;
    }

    const spell = getSpellByIdOrThrow(spellId);

    // eslint-disable-next-line no-nested-ternary
    const spellTarget = target
      ? target.type === 'direction'
        ? { type: 'direction' as const, direction: target.direction ?? 6 }
        : { type: 'point' as const, position: { x: target.x ?? 0, y: target.y ?? 0 } as GridPosition }
      : undefined;

    const result = await session.previewSpell({
      casterId: caster.id,
      spell,
      target: spellTarget,
      obstacles: scenario?.obstacles,
      gridWidth: scenario?.gridWidth,
      gridHeight: scenario?.gridHeight,
    });

    return JSON.stringify(result, null, 2);
  },
  {
    name: 'spell_preview',
    description: 'Preview a spell effect before casting',
    schema: SpellPreviewSchema,
  }
);

export const spellCastTool = tool(
  async ({ casterName, spellId, target, scenario }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;
    const session = getCombatSession(roomId);
    const combatState = session.getState();

    const caster = combatState.characters.find((c: CombatCharacter) => c.name === casterName);
    if (!caster) {
      return `Error: Caster ${casterName} not found`;
    }

    const spell = getSpellByIdOrThrow(spellId);

    // eslint-disable-next-line no-nested-ternary
    const spellTarget = target
      ? target.type === 'direction'
        ? { type: 'direction' as const, direction: target.direction ?? 6 }
        : { type: 'point' as const, position: { x: target.x ?? 0, y: target.y ?? 0 } as GridPosition }
      : undefined;

    const updatedState = await session.castSpell({
      casterId: caster.id,
      spell,
      target: spellTarget,
      obstacles: scenario?.obstacles,
      gridWidth: scenario?.gridWidth,
      gridHeight: scenario?.gridHeight,
    });

    return new Command({
      update: { combatState: updatedState } as Partial<GameplayState>,
    });
  },
  {
    name: 'spell_cast',
    description: 'Cast a spell in combat',
    schema: SpellCastSchema,
  }
);

export const combatTools = [
  startCombatTool,
  attackTool,
  moveTool,
  endTurnTool,
  endCombatTool,
  spellPreviewTool,
  spellCastTool,
];
