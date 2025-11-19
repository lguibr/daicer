/**
 * Move Node - Handles character movement with opportunity attack checks
 */

import type { CombatState, CombatCharacter } from '@/graph/state';
import { validateMovement } from '../rules/movement';
import { processOpportunityAttacks } from '../rules/opportunityAttack';
import { DiceRoller } from '../dice';

type CombatLogEntry = CombatState['log'][number];

export interface Position {
  x: number;
  y: number;
}

export interface MoveNodeInput {
  characterId: string;
  targetPosition: Position;
  diceRoller: DiceRoller;
}

export function moveNode(state: CombatState, input: MoveNodeInput): Partial<CombatState> {
  const { characterId, targetPosition, diceRoller } = input;

  const character = state.characters.find((c) => c.id === characterId);
  if (!character) {
    return {
      log: [
        ...state.log,
        {
          id: `log-move-error-${Date.now()}`,
          timestamp: Date.now(),
          message: `Error: Character ${characterId} not found`,
          type: 'info' as const,
          relatedRolls: [],
        },
      ],
    };
  }

  // Validate movement
  const validation = validateMovement({
    character,
    fromPosition: character.position,
    toPosition: targetPosition,
    characters: state.characters,
    gridWidth: state.gridWidth,
    gridHeight: state.gridHeight,
  });

  if (!validation.isValid) {
    return {
      log: [
        ...state.log,
        {
          id: `log-move-invalid-${Date.now()}`,
          timestamp: Date.now(),
          message: `❌ ${character.name} cannot move: ${validation.reason}`,
          type: 'info' as const,
          relatedRolls: [],
        },
      ],
    };
  }

  // Track dice history prior to resolving reactions so we can append only new rolls
  const historyBefore = diceRoller.getHistory().length;

  // Check for opportunity attacks
  const opportunityResult = processOpportunityAttacks(
    character,
    character.position,
    targetPosition,
    state.characters,
    diceRoller
  );

  const historyAfter = diceRoller.getHistory();
  const newDiceHistory = historyAfter.slice(historyBefore);

  const baseDefender = opportunityResult.updatedDefender;
  const wasKilled = baseDefender.hp <= 0 && character.hp > 0;
  const remainingMovement = Math.max(0, character.movementRemaining - validation.movementCost);

  // Update character position and movement
  const updatedCharacter: CombatCharacter = {
    ...baseDefender,
    position: wasKilled ? character.position : targetPosition,
    hasMoved: wasKilled ? character.hasMoved : true,
    movementRemaining: wasKilled ? character.movementRemaining : remainingMovement,
  };

  // Update all characters (mover + those who used reactions)
  const updatedCharacters = state.characters.map((c) => {
    if (c.id === characterId) return updatedCharacter;

    // Update attackers who used their reaction
    const attackerUpdate = opportunityResult.updatedAttackers.find((a) => a.id === c.id);
    if (attackerUpdate) return attackerUpdate;

    return c;
  });

  // Build log entries
  const moveLog: CombatLogEntry = {
    id: `log-move-${Date.now()}`,
    timestamp: Date.now(),
    message: `🏃 ${character.name} moves to (${targetPosition.x}, ${targetPosition.y}) [${validation.movementCost} ft used, ${updatedCharacter.movementRemaining} ft remaining]`,
    type: 'move',
    relatedRolls: [],
  };

  const opportunityLogs = opportunityResult.attacks.flatMap((oa) => {
    const attacker = state.characters.find((c) => c.id === oa.trigger.attackerId);
    const logs: CombatLogEntry[] = [
      {
        id: `log-opportunity-${Date.now()}`,
        timestamp: Date.now(),
        message: `⚡ ${attacker?.name} makes an opportunity attack!`,
        type: 'attack',
        relatedRolls: [oa.resolution.attackRoll.roll.id],
      },
    ];

    if (oa.resolution.damageRoll) {
      const hitMsg = oa.resolution.attackRoll.isCriticalHit ? 'Critical Hit!' : 'Hit!';
      logs.push({
        id: `log-opportunity-damage-${Date.now()}`,
        timestamp: Date.now(),
        message: `💥 ${hitMsg} ${oa.resolution.damageRoll.totalDamage} ${oa.resolution.damageRoll.damageType} damage`,
        type: 'damage',
        relatedRolls: [oa.resolution.damageRoll.roll.id],
      });
    } else {
      logs.push({
        id: `log-opportunity-miss-${Date.now()}`,
        timestamp: Date.now(),
        message: `❌ Miss!`,
        type: 'info',
        relatedRolls: [],
      });
    }

    return logs;
  });

  const baseDiceHistory = state.diceHistory ?? [];
  const updatedDiceHistory = newDiceHistory.length > 0 ? [...baseDiceHistory, ...newDiceHistory] : [...baseDiceHistory];

  const additionalLogs: CombatLogEntry[] = [];
  if (wasKilled) {
    additionalLogs.push({
      id: `log-move-failed-${Date.now()}`,
      timestamp: Date.now(),
      message: `💀 ${character.name} is cut down while trying to retreat!`,
      type: 'info',
      relatedRolls: [],
    });
  } else {
    additionalLogs.push(moveLog);
  }

  return {
    characters: updatedCharacters,
    log: [...state.log, ...additionalLogs, ...opportunityLogs],
    diceHistory: updatedDiceHistory,
  };
}
