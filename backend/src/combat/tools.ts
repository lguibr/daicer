/**
 * Combat tools for DM (LLM) agent
 * Exposes combat actions as LangChain tools with strict validation
 */

import { tool } from '@langchain/core/tools';
import { Command, LangGraphRunnableConfig } from '@langchain/langgraph';
import * as z from 'zod';
import type { CombatCharacter, GameplayState } from '@/graph/state';
import type { Player } from '@/types/index';
import { v4 as uuidv4 } from 'uuid';
import { createCombatSession } from './graph';

/**
 * Schema for starting combat
 */
const StartCombatSchema = z.object({
  playerIds: z.array(z.string()).describe('Array of player IDs to include in combat'),
  enemyNames: z.array(z.string()).describe('Array of enemy/creature names to include in combat'),
});

/**
 * Schema for attack action
 */
const AttackSchema = z.object({
  attackerName: z.string().describe('Name of the attacking character'),
  targetName: z.string().describe('Name of the target character'),
  weaponDamage: z.string().optional().describe('Weapon damage dice notation (e.g., "1d8", "2d6")'),
  damageType: z.string().optional().describe('Type of damage (e.g., "slashing", "piercing", "bludgeoning")'),
});

/**
 * Schema for movement action
 */
const MoveSchema = z.object({
  characterName: z.string().describe('Name of the character to move'),
  targetX: z.number().int().min(0).max(9).describe('Target X coordinate (0-9)'),
  targetY: z.number().int().min(0).max(9).describe('Target Y coordinate (0-9)'),
});

/**
 * Schema for ending turn
 */
const EndTurnSchema = z.object({
  confirm: z.boolean().describe('Confirm ending the current turn'),
});

/**
 * Schema for ending combat
 */
const EndCombatSchema = z.object({
  reason: z.string().describe('Reason for ending combat (e.g., "enemies defeated", "players fled")'),
});

/**
 * Global combat session registry
 * Maps room IDs to active combat sessions
 */
const activeCombatSessions = new Map<string, ReturnType<typeof createCombatSession>>();

/**
 * Get or create combat session for a room
 */
function getCombatSession(roomId: string, seed?: number): ReturnType<typeof createCombatSession> {
  let session = activeCombatSessions.get(roomId);
  if (!session) {
    session = createCombatSession(roomId, seed);
    activeCombatSessions.set(roomId, session);
  }
  return session;
}

/**
 * Remove combat session
 */
export function removeCombatSession(roomId: string): void {
  activeCombatSessions.delete(roomId);
}

/**
 * Get combat session if exists
 */
export function getActiveCombatSession(roomId: string): ReturnType<typeof createCombatSession> | undefined {
  return activeCombatSessions.get(roomId);
}

/**
 * Convert Player to CombatCharacter
 */
function playerToCombatCharacter(player: Player, position: { x: number; y: number }): CombatCharacter {
  const attributes = player.character.attributes as Record<string, number>;

  return {
    id: `player-${player.id}`,
    name: player.character.name,
    hp: player.character.hp,
    maxHp: player.character.maxHp,
    tempHp: player.character.temporaryHp,
    armorClass: player.character.armorClass,
    position,
    initiative: 0, // Will be rolled
    avatar: player.userId, // Can be replaced with actual avatar URL
    isPlayer: true,
    strength: attributes.STR ?? 10,
    dexterity: attributes.DEX ?? 10,
    constitution: attributes.CON ?? 10,
    intelligence: attributes.INT ?? 10,
    wisdom: attributes.WIS ?? 10,
    charisma: attributes.CHA ?? 10,
    proficiencyBonus: player.character.proficiencyBonus,
    speed: player.character.speed,
    reach: 1, // Default melee reach
    hasMoved: false,
    hasActed: false,
    hasReaction: true,
    hasBonusAction: true,
    movementRemaining: player.character.speed,
    conditions: [],
  };
}

/**
 * Tool: Start Combat
 * Initializes a combat encounter with specified characters
 */
export const startCombatTool = tool(
  async (input: z.infer<typeof StartCombatSchema>, config: LangGraphRunnableConfig): Promise<Command> => {
    const roomId = config.configurable?.roomId as string;
    if (!roomId) {
      throw new Error('Room ID required in config');
    }

    // Get game state from config
    const gameplayState = config.configurable?.gameplayState as GameplayState;
    if (!gameplayState) {
      throw new Error('Gameplay state required');
    }

    // Create combat characters from players
    const players = (gameplayState.players as Player[]).filter((p) => input.playerIds.includes(p.id));
    const combatCharacters: CombatCharacter[] = players.map(
      (p, i) => playerToCombatCharacter(p, { x: 2 + i, y: 2 }) // Position players in starting area
    );

    // Add enemies (from game state creatures)
    const creatures = gameplayState.creatures as Array<{
      name: string;
      hp: number;
      maxHp: number;
      attackBonus: number;
      damage: string;
    }>;
    const enemies = creatures.filter((c) => input.enemyNames.includes(c.name));
    enemies.forEach((enemy, i) => {
      combatCharacters.push({
        id: `enemy-${uuidv4()}`,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        tempHp: 0,
        armorClass: 12, // Default AC
        position: { x: 7, y: 7 + i }, // Position enemies in opposite area
        initiative: 0,
        avatar: 'enemy',
        isPlayer: false,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        proficiencyBonus: 2,
        speed: 6,
        reach: 1,
        hasMoved: false,
        hasActed: false,
        hasReaction: true,
        hasBonusAction: true,
        movementRemaining: 6,
        conditions: [],
      });
    });

    // Create combat session
    const session = getCombatSession(roomId, Date.now());
    const combatState = await session.startCombat(combatCharacters);

    // Return Command to update gameplay state
    return new Command({
      update: {
        combatState,
      } as Partial<GameplayState>,
    });
  },
  {
    name: 'start_combat',
    description:
      'Initialize a combat encounter with specified players and enemies. Use this when combat is about to begin.',
    schema: StartCombatSchema,
  }
);

/**
 * Tool: Attack
 * Execute an attack from one character to another
 */
export const attackTool = tool(
  async (input: z.infer<typeof AttackSchema>, config: LangGraphRunnableConfig): Promise<Command> => {
    const roomId = config.configurable?.roomId as string;
    const session = getCombatSession(roomId);

    const currentState = session.getState();
    const attacker = currentState.characters.find((c) => c.name === input.attackerName);
    const target = currentState.characters.find((c) => c.name === input.targetName);

    if (!attacker || !target) {
      throw new Error(`Character not found: ${input.attackerName} or ${input.targetName}`);
    }

    const updatedState = await session.attack(attacker.id, target.id, {
      weaponDamage: input.weaponDamage ?? '1d8',
      damageType: input.damageType ?? 'slashing',
    });

    return new Command({
      update: {
        combatState: updatedState,
      } as Partial<GameplayState>,
    });
  },
  {
    name: 'combat_attack',
    description: 'Make an attack against a target in combat. Returns attack roll and damage results.',
    schema: AttackSchema,
  }
);

/**
 * Tool: Move Character
 * Move a character on the grid
 */
export const moveTool = tool(
  async (input: z.infer<typeof MoveSchema>, config: LangGraphRunnableConfig): Promise<Command> => {
    const roomId = config.configurable?.roomId as string;
    const session = getCombatSession(roomId);

    const currentState = session.getState();
    const character = currentState.characters.find((c) => c.name === input.characterName);

    if (!character) {
      throw new Error(`Character not found: ${input.characterName}`);
    }

    const updatedState = await session.moveCharacter(character.id, {
      x: input.targetX,
      y: input.targetY,
    });

    return new Command({
      update: {
        combatState: updatedState,
      } as Partial<GameplayState>,
    });
  },
  {
    name: 'combat_move',
    description: 'Move a character to a new position on the combat grid. Checks for opportunity attacks.',
    schema: MoveSchema,
  }
);

/**
 * Tool: End Turn
 * End the current character's turn
 */
export const endTurnTool = tool(
  async (_input: z.infer<typeof EndTurnSchema>, config: LangGraphRunnableConfig): Promise<Command> => {
    const roomId = config.configurable?.roomId as string;
    const session = getCombatSession(roomId);

    const updatedState = await session.endTurn();

    return new Command({
      update: {
        combatState: updatedState,
      } as Partial<GameplayState>,
    });
  },
  {
    name: 'end_turn',
    description: "End the current character's turn and advance to the next character in initiative order.",
    schema: EndTurnSchema,
  }
);

/**
 * Tool: End Combat
 * Terminate the combat encounter
 */
export const endCombatTool = tool(
  async (_input: z.infer<typeof EndCombatSchema>, config: LangGraphRunnableConfig): Promise<Command> => {
    const roomId = config.configurable?.roomId as string;

    // Remove the combat session
    removeCombatSession(roomId);

    return new Command({
      update: {
        combatState: null,
      } as Partial<GameplayState>,
    });
  },
  {
    name: 'end_combat',
    description: 'End the combat encounter and return to normal gameplay. Use when combat is resolved.',
    schema: EndCombatSchema,
  }
);

/**
 * All combat tools for the DM agent
 */
export const combatTools = [startCombatTool, attackTool, moveTool, endTurnTool, endCombatTool];
