/**
 * Attack Node - Handles attack actions with full D&D 5e rules
 */

import type { CombatState, CombatCharacter } from '@/graph/state';
import { resolveAttack, AttackContext } from '../rules/attack';
import { isWithinReach } from '../rules/movement';
import { DiceRoller } from '../dice';

export interface AttackNodeInput {
  attackerId: string;
  defenderId: string;
  diceRoller: DiceRoller;
  weaponDamage?: string;
  damageType?: string;
  isFinesse?: boolean;
  isRanged?: boolean;
}

export function attackNode(state: CombatState, input: AttackNodeInput): Partial<CombatState> {
  const {
    attackerId,
    defenderId,
    diceRoller,
    weaponDamage = '1d6',
    damageType = 'slashing',
    isFinesse = false,
    isRanged = false,
  } = input;

  const attacker = state.characters.find(c => c.id === attackerId);
  const defender = state.characters.find(c => c.id === defenderId);

  if (!attacker || !defender) {
    return {
      log: [...state.log, {
        id: `log-attack-error-${Date.now()}`,
        timestamp: Date.now(),
        message: `Error: Invalid attacker or defender`,
        type: 'info' as const,
        relatedRolls: [],
      }],
    };
  }

  // Check if attacker can attack
  if (attacker.hasActed) {
    return {
      log: [...state.log, {
        id: `log-attack-already-${Date.now()}`,
        timestamp: Date.now(),
        message: `${attacker.name} has already acted this turn`,
        type: 'info' as const,
        relatedRolls: [],
      }],
    };
  }

  // Check reach
  if (!isRanged && !isWithinReach(attacker.position, defender.position, attacker.reach)) {
    return {
      log: [...state.log, {
        id: `log-attack-range-${Date.now()}`,
        timestamp: Date.now(),
        message: `${attacker.name} is not within reach of ${defender.name}`,
        type: 'info' as const,
        relatedRolls: [],
      }],
    };
  }

  // Build attack context
  const context: AttackContext = {
    attacker,
    defender,
    attackerPosition: attacker.position,
    defenderPosition: defender.position,
    isRangedAttack: isRanged,
    weaponReach: attacker.reach,
  };

  // Resolve the attack
  const result = resolveAttack(
    context,
    weaponDamage,
    damageType,
    diceRoller,
    isFinesse
  );

  // Update attacker (has acted)
  const updatedAttacker: CombatCharacter = {
    ...attacker,
    hasActed: true,
  };

  // Update defender if hit
  let updatedDefender = defender;
  if (result.updatedDefender) {
    updatedDefender = result.updatedDefender;
  }

  const updatedCharacters = state.characters.map(c => {
    if (c.id === attackerId) return updatedAttacker;
    if (c.id === defenderId) return updatedDefender;
    return c;
  });

  // Build log entries
  const attackLog = {
    id: `log-attack-${Date.now()}`,
    timestamp: Date.now(),
    message: `⚔️ ${attacker.name} attacks ${defender.name}!`,
    type: 'attack' as const,
    relatedRolls: [result.attackRoll.roll.id],
  };

  const logs = [attackLog];

  if (result.attackRoll.isCriticalHit) {
    logs.push({
      id: `log-crit-${Date.now()}`,
      timestamp: Date.now(),
      message: `🎯 **CRITICAL HIT!**`,
      type: 'info',
      relatedRolls: [],
    });
  }

  if (result.attackRoll.isHit && result.damageRoll) {
    logs.push({
      id: `log-damage-${Date.now()}`,
      timestamp: Date.now(),
      message: `💥 ${result.damageRoll.totalDamage} ${result.damageRoll.damageType} damage dealt to ${defender.name}`,
      type: 'damage',
      relatedRolls: [result.damageRoll.roll.id],
    });

    if (result.damageResult?.isDead && !result.damageResult.wasAlreadyDead) {
      logs.push({
        id: `log-death-${Date.now()}`,
        timestamp: Date.now(),
        message: `💀 **${defender.name} has fallen!**`,
        type: 'info',
        relatedRolls: [],
      });
    }
  } else if (result.attackRoll.isCriticalMiss) {
    logs.push({
      id: `log-miss-${Date.now()}`,
      timestamp: Date.now(),
      message: `❌ Critical miss!`,
      type: 'info',
      relatedRolls: [],
    });
  } else {
    logs.push({
      id: `log-miss-${Date.now()}`,
      timestamp: Date.now(),
      message: `❌ Miss! (${result.attackRoll.roll.finalResult} vs AC ${result.attackRoll.targetAC})`,
      type: 'info',
      relatedRolls: [],
    });
  }

  // Check if combat is over
  const aliveCharacters = updatedCharacters.filter(c => c.hp > 0);
  const isPlayerTeamAlive = aliveCharacters.some(c => c.isPlayer);
  const isEnemyTeamAlive = aliveCharacters.some(c => !c.isPlayer);
  const isCombatOver = !isPlayerTeamAlive || !isEnemyTeamAlive;
  let winner: 'player' | 'enemy' | null = null;
  if (isCombatOver) {
    winner = isPlayerTeamAlive ? 'player' : 'enemy';
  }

  if (isCombatOver) {
    logs.push({
      id: `log-victory-${Date.now()}`,
      timestamp: Date.now(),
      message: `🏆 **The ${winner} team is victorious!**`,
      type: 'victory',
      relatedRolls: [],
    });
  }

  return {
    characters: updatedCharacters,
    log: [...state.log, ...logs],
    diceHistory: [...state.diceHistory, ...diceRoller.getHistory().slice(-(result.damageRoll ? 2 : 1))],
    isCombatOver,
    winner,
    phase: isCombatOver ? 'combat_end' : 'action_selection',
  };
}

