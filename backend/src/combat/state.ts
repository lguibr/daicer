/**
 * Combat state helpers and type guards
 * Uses schemas from graph/state.ts
 */

import type { CombatCharacter, ConditionType } from '@/graph/state';

export interface Condition {
  type: ConditionType;
  level?: number;
  source?: string;
  duration?: number;
}

/**
 * Helper to calculate ability modifier from score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Helper to check if character has a condition
 */
export function hasCondition(character: CombatCharacter, conditionType: ConditionType): boolean {
  return character.conditions.some((c) => c.type === conditionType);
}

/**
 * Helper to add a condition to a character
 */
export function addCondition(character: CombatCharacter, condition: Condition): CombatCharacter {
  // Check if condition already exists
  const existing = character.conditions.find((c) => c.type === condition.type);
  if (existing) {
    // For exhaustion, increase level
    if (condition.type === 'exhaustion' && existing.level !== undefined && condition.level !== undefined) {
      return {
        ...character,
        conditions: character.conditions.map((c) =>
          c.type === 'exhaustion' ? { ...c, level: Math.min(6, (c.level ?? 0) + (condition.level ?? 0)) } : c
        ),
      };
    }
    return character; // Condition already present
  }

  return {
    ...character,
    conditions: [...character.conditions, condition],
  };
}

/**
 * Helper to remove a condition from a character
 */
export function removeCondition(character: CombatCharacter, conditionType: ConditionType): CombatCharacter {
  return {
    ...character,
    conditions: character.conditions.filter((c) => c.type !== conditionType),
  };
}

/**
 * Helper to check if character is alive
 */
export function isAlive(character: CombatCharacter): boolean {
  return character.hp > 0;
}

/**
 * Helper to check if character is incapacitated
 */
export function isIncapacitated(character: CombatCharacter): boolean {
  return (
    hasCondition(character, 'incapacitated') ||
    hasCondition(character, 'paralyzed') ||
    hasCondition(character, 'petrified') ||
    hasCondition(character, 'stunned') ||
    hasCondition(character, 'unconscious') ||
    character.hp <= 0
  );
}

/**
 * Helper to check if character can move
 */
export function canMove(character: CombatCharacter): boolean {
  if (!isAlive(character)) return false;
  if (isIncapacitated(character)) return false;
  if (hasCondition(character, 'grappled')) return false;
  if (hasCondition(character, 'restrained')) return false;
  if (character.movementRemaining <= 0) return false;

  const exhaustionLevel = character.conditions.find((c) => c.type === 'exhaustion')?.level ?? 0;
  if (exhaustionLevel >= 5) return false; // Exhaustion level 5: speed reduced to 0

  return true;
}

/**
 * Helper to check if character can take actions
 */
export function canTakeAction(character: CombatCharacter): boolean {
  if (!isAlive(character)) return false;
  if (isIncapacitated(character)) return false;
  return !character.hasActed;
}

/**
 * Helper to check if character can take reactions
 */
export function canTakeReaction(character: CombatCharacter): boolean {
  if (!isAlive(character)) return false;
  if (isIncapacitated(character)) return false;
  return character.hasReaction;
}
