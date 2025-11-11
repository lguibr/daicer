/**
 * D&D 5e opportunity attack rules
 * Handles triggering and resolution of opportunity attacks
 */

import type { CombatCharacter } from '@/graph/state';
import { resolveAttack, AttackContext, AttackResolutionResult } from './attack';
import { DiceRoller } from '../dice';
import { isWithinReach } from './movement';

export interface Position {
  x: number;
  y: number;
}

export interface OpportunityAttackTrigger {
  attackerId: string;
  defenderId: string;
  trigger: string;
  attackerPosition: Position;
  defenderPosition: Position;
}

export interface OpportunityAttackResult {
  trigger: OpportunityAttackTrigger;
  resolution: AttackResolutionResult;
  attackerUsedReaction: boolean;
}

/**
 * Check if a character's movement triggers opportunity attacks
 * Returns list of potential opportunity attackers
 */
export function checkOpportunityAttackTriggers(
  movingCharacter: CombatCharacter,
  fromPosition: Position,
  toPosition: Position,
  allCharacters: CombatCharacter[]
): OpportunityAttackTrigger[] {
  const triggers: OpportunityAttackTrigger[] = [];

  // Characters that could make opportunity attacks
  const potentialAttackers = allCharacters.filter(
    (c) =>
      c.hp > 0 &&
      c.id !== movingCharacter.id &&
      c.isPlayer !== movingCharacter.isPlayer && // Must be hostile
      c.hasReaction // Must have reaction available
  );

  for (const attacker of potentialAttackers) {
    const wasInReach = isWithinReach(fromPosition, attacker.position, attacker.reach);
    const stillInReach = isWithinReach(toPosition, attacker.position, attacker.reach);

    // Opportunity attack triggered when leaving reach
    if (wasInReach && !stillInReach) {
      triggers.push({
        attackerId: attacker.id,
        defenderId: movingCharacter.id,
        trigger: `${movingCharacter.name} left ${attacker.name}'s reach`,
        attackerPosition: attacker.position,
        defenderPosition: fromPosition, // Attack happens before they leave
      });
    }
  }

  return triggers;
}

/**
 * Resolve an opportunity attack
 */
export function resolveOpportunityAttack(
  attacker: CombatCharacter,
  defender: CombatCharacter,
  trigger: OpportunityAttackTrigger,
  diceRoller: DiceRoller,
  weaponDamage: string = '1d6',
  damageType: string = 'slashing'
): OpportunityAttackResult {
  const context: AttackContext = {
    attacker,
    defender,
    attackerPosition: trigger.attackerPosition,
    defenderPosition: trigger.defenderPosition,
    isRangedAttack: false, // Opportunity attacks are always melee
  };

  const resolution = resolveAttack(
    context,
    weaponDamage,
    damageType,
    diceRoller,
    false // Not finesse for default attack
  );

  return {
    trigger,
    resolution,
    attackerUsedReaction: true,
  };
}

/**
 * Check if character has the Disengage action active
 * (would prevent opportunity attacks)
 */
export function hasDisengageActive(): boolean {
  // This would be tracked in character state or as a condition
  // For now, we'll return false - implement when Disengage action is added
  return false;
}

/**
 * Process all opportunity attacks for a movement
 */
export interface ProcessOpportunityAttacksResult {
  attacks: OpportunityAttackResult[];
  updatedDefender: CombatCharacter;
  updatedAttackers: CombatCharacter[];
}

export function processOpportunityAttacks(
  movingCharacter: CombatCharacter,
  fromPosition: Position,
  toPosition: Position,
  allCharacters: CombatCharacter[],
  diceRoller: DiceRoller
): ProcessOpportunityAttacksResult {
  // Check if character has Disengage active
  if (hasDisengageActive()) {
    return {
      attacks: [],
      updatedDefender: movingCharacter,
      updatedAttackers: [],
    };
  }

  const triggers = checkOpportunityAttackTriggers(movingCharacter, fromPosition, toPosition, allCharacters);

  const attacks: OpportunityAttackResult[] = [];
  const updatedAttackers: CombatCharacter[] = [];
  let currentDefender = movingCharacter;

  for (const trigger of triggers) {
    const attacker = allCharacters.find((c) => c.id === trigger.attackerId);
    if (!attacker) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Resolve the opportunity attack
    const result = resolveOpportunityAttack(attacker, currentDefender, trigger, diceRoller);

    attacks.push(result);

    // Update defender with damage
    if (result.resolution.updatedDefender) {
      currentDefender = result.resolution.updatedDefender;
    }

    // Mark attacker as having used their reaction
    updatedAttackers.push({
      ...attacker,
      hasReaction: false,
    });
  }

  return {
    attacks,
    updatedDefender: currentDefender,
    updatedAttackers,
  };
}

/**
 * Get all characters that could threaten a position (within reach)
 */
export function getThreateningCharacters(
  position: Position,
  allCharacters: CombatCharacter[],
  forCharacterId: string
): CombatCharacter[] {
  const character = allCharacters.find((c) => c.id === forCharacterId);
  if (!character) return [];

  return allCharacters.filter(
    (c) =>
      c.hp > 0 &&
      c.id !== forCharacterId &&
      c.isPlayer !== character.isPlayer &&
      isWithinReach(position, c.position, c.reach)
  );
}

/**
 * Calculate the safest movement path (avoiding opportunity attacks when possible)
 * TODO: Implement pathfinding that minimizes opportunity attacks
 */
export function findSafestPath(to: Position): Position[] {
  return [to];
}
