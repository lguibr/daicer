/**
 * Move Node - Handles character movement with opportunity attack checks
 */

import type { CombatState, CombatCharacter } from '@/graph/state';
import { validateMovement } from '../rules/movement';
import { processOpportunityAttacks } from '../rules/opportunityAttack';
import { DiceRoller } from '../dice';

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
  
  const character = state.characters.find(c => c.id === characterId);
  if (!character) {
    return {
      log: [...state.log, {
        id: `log-move-error-${Date.now()}`,
        timestamp: Date.now(),
        message: `Error: Character ${characterId} not found`,
        type: 'info' as const,
        relatedRolls: [],
      }],
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
      log: [...state.log, {
        id: `log-move-invalid-${Date.now()}`,
        timestamp: Date.now(),
        message: `❌ ${character.name} cannot move: ${validation.reason}`,
        type: 'info' as const,
        relatedRolls: [],
      }],
    };
  }

  // Check for opportunity attacks
  const opportunityResult = processOpportunityAttacks(
    character,
    character.position,
    targetPosition,
    state.characters,
    diceRoller
  );

  // Update character position and movement
  const updatedCharacter: CombatCharacter = {
    ...opportunityResult.updatedDefender,
    position: targetPosition,
    hasMoved: true,
    movementRemaining: character.movementRemaining - validation.movementCost,
  };

  // Update all characters (mover + those who used reactions)
  const updatedCharacters = state.characters.map(c => {
    if (c.id === characterId) return updatedCharacter;
    
    // Update attackers who used their reaction
    const attackerUpdate = opportunityResult.updatedAttackers.find(a => a.id === c.id);
    if (attackerUpdate) return attackerUpdate;
    
    return c;
  });

  // Build log entries
  const moveLog = {
    id: `log-move-${Date.now()}`,
    timestamp: Date.now(),
    message: `🏃 ${character.name} moves to (${targetPosition.x}, ${targetPosition.y}) [${validation.movementCost} ft used, ${updatedCharacter.movementRemaining} ft remaining]`,
    type: 'move' as const,
    relatedRolls: [],
  };

  const opportunityLogs = opportunityResult.attacks.flatMap(oa => {
    const attacker = state.characters.find(c => c.id === oa.trigger.attackerId);
    const logs = [{
      id: `log-opportunity-${Date.now()}`,
      timestamp: Date.now(),
      message: `⚡ ${attacker?.name} makes an opportunity attack!`,
      type: 'attack' as const,
      relatedRolls: [oa.resolution.attackRoll.roll.id],
    }];

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

  return {
    characters: updatedCharacters,
    log: [...state.log, moveLog, ...opportunityLogs],
    diceHistory: [...state.diceHistory, ...diceRoller.getHistory().slice(-opportunityResult.attacks.length * 2)],
  };
}

