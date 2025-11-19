/**
 * D&D 5e attack resolution rules
 * Handles attack rolls, hit/miss determination, critical hits, and damage calculation
 */

import type { CombatCharacter } from '@/graph/state';
import { hasCondition, getAbilityModifier } from '../state';
import { DiceRoller, DiceRollResult, AdvantageType } from '../dice';

export interface Position {
  x: number;
  y: number;
}

export interface AttackContext {
  attacker: CombatCharacter;
  defender: CombatCharacter;
  attackerPosition?: Position;
  defenderPosition?: Position;
  isRangedAttack?: boolean;
  weaponReach?: number;
}

export interface AttackRollResult {
  roll: DiceRollResult;
  targetAC: number;
  isHit: boolean;
  isCriticalHit: boolean;
  isCriticalMiss: boolean;
  hasAdvantage: boolean;
  hasDisadvantage: boolean;
  finalAdvantageType: AdvantageType;
}

export interface DamageRollResult {
  roll: DiceRollResult;
  isCritical: boolean;
  damageType: string;
  totalDamage: number;
}

/**
 * Calculate if attacker has advantage on the attack
 */
export function calculateAttackAdvantage(context: AttackContext): {
  hasAdvantage: boolean;
  hasDisadvantage: boolean;
  sources: string[];
} {
  const { attacker, defender, isRangedAttack } = context;
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  // Attacker conditions
  if (hasCondition(attacker, 'invisible')) {
    advantages.push('Attacker is invisible');
  }
  if (hasCondition(attacker, 'prone') && !isRangedAttack) {
    disadvantages.push('Attacker is prone (melee)');
  }
  if (hasCondition(attacker, 'poisoned')) {
    disadvantages.push('Attacker is poisoned');
  }
  if (hasCondition(attacker, 'frightened')) {
    disadvantages.push('Attacker is frightened');
  }
  if (hasCondition(attacker, 'restrained')) {
    disadvantages.push('Attacker is restrained');
  }

  // Defender conditions
  if (hasCondition(defender, 'prone')) {
    if (isRangedAttack) {
      disadvantages.push('Defender is prone (ranged attack)');
    } else {
      advantages.push('Defender is prone (melee attack within 5ft)');
    }
  }
  if (
    hasCondition(defender, 'paralyzed') ||
    hasCondition(defender, 'stunned') ||
    hasCondition(defender, 'unconscious')
  ) {
    advantages.push('Defender is incapacitated');
  }
  if (hasCondition(defender, 'invisible')) {
    disadvantages.push('Defender is invisible');
  }
  if (hasCondition(defender, 'restrained')) {
    advantages.push('Defender is restrained');
  }

  return {
    hasAdvantage: advantages.length > 0,
    hasDisadvantage: disadvantages.length > 0,
    sources: [...advantages, ...disadvantages],
  };
}

/**
 * Resolve advantage/disadvantage (they cancel out)
 */
export function resolveAdvantageType(hasAdvantage: boolean, hasDisadvantage: boolean): AdvantageType {
  if (hasAdvantage && hasDisadvantage) {
    return 'normal'; // They cancel each other
  }
  if (hasAdvantage) return 'advantage';
  if (hasDisadvantage) return 'disadvantage';
  return 'normal';
}

/**
 * Make an attack roll
 */
export function makeAttackRoll(
  context: AttackContext,
  diceRoller: DiceRoller,
  attackBonus: number,
  contextId?: string
): AttackRollResult {
  const { defender } = context;
  const { hasAdvantage, hasDisadvantage } = calculateAttackAdvantage(context);
  const finalAdvantageType = resolveAdvantageType(hasAdvantage, hasDisadvantage);

  const roll = diceRoller.rollAttack(attackBonus, finalAdvantageType, `Attack roll`, contextId);

  const targetAC = defender.armorClass;
  const isCriticalHit = roll.rawRolls.includes(20);
  const isCriticalMiss = roll.rawRolls.includes(1);

  // Natural 20 always hits, natural 1 always misses
  const isHit = isCriticalHit || (!isCriticalMiss && roll.finalResult >= targetAC);

  return {
    roll,
    targetAC,
    isHit,
    isCriticalHit,
    isCriticalMiss,
    hasAdvantage,
    hasDisadvantage,
    finalAdvantageType,
  };
}

/**
 * Roll damage for an attack
 */
export function rollDamage(
  diceNotation: string,
  damageBonus: number,
  isCritical: boolean,
  damageType: string,
  diceRoller: DiceRoller,
  contextId?: string
): DamageRollResult {
  let totalDamage = 0;

  if (isCritical) {
    // Critical hit: roll damage dice twice
    const roll1 = diceRoller.rollDamage(
      diceNotation,
      0, // Don't add modifier yet
      `Critical damage roll (${diceNotation}) - Roll 1`,
      contextId
    );
    const roll2 = diceRoller.rollDamage(diceNotation, 0, `Critical damage roll (${diceNotation}) - Roll 2`, contextId);

    totalDamage = roll1.finalResult + roll2.finalResult + damageBonus;

    // Return combined roll result
    return {
      roll: {
        ...roll1,
        rawRolls: [...roll1.rawRolls, ...roll2.rawRolls],
        modifier: damageBonus,
        finalResult: totalDamage,
        description: `Critical ${damageType} damage (${diceNotation} x2 + ${damageBonus})`,
      },
      isCritical: true,
      damageType,
      totalDamage,
    };
  }
  // Normal damage roll
  const roll = diceRoller.rollDamage(
    diceNotation,
    damageBonus,
    `${damageType} damage (${diceNotation} + ${damageBonus})`,
    contextId
  );

  return {
    roll,
    isCritical: false,
    damageType,
    totalDamage: roll.finalResult,
  };
}

/**
 * Apply damage to a character (considering temp HP, resistance, vulnerability)
 */
export interface ApplyDamageResult {
  damageDealt: number;
  tempHpLost: number;
  hpLost: number;
  newHp: number;
  newTempHp: number;
  isDead: boolean;
  wasAlreadyDead: boolean;
}

export function applyDamage(character: CombatCharacter, damage: number): ApplyDamageResult {
  const wasAlreadyDead = character.hp <= 0;

  // TODO: Implement resistance/vulnerability based on damage type
  // For now, just apply damage directly
  let remainingDamage = damage;
  let tempHpLost = 0;
  let hpLost = 0;

  // Temp HP absorbs damage first
  if (character.tempHp > 0) {
    tempHpLost = Math.min(character.tempHp, remainingDamage);
    remainingDamage -= tempHpLost;
  }

  // Apply remaining damage to HP
  if (remainingDamage > 0) {
    hpLost = Math.min(character.hp, remainingDamage);
  }

  const newHp = Math.max(0, character.hp - hpLost);
  const newTempHp = Math.max(0, character.tempHp - tempHpLost);
  const isDead = newHp <= 0;

  return {
    damageDealt: damage,
    tempHpLost,
    hpLost,
    newHp,
    newTempHp,
    isDead,
    wasAlreadyDead,
  };
}

/**
 * Calculate attack bonus for a character
 */
export function calculateAttackBonus(character: CombatCharacter, isFinesse: boolean = false): number {
  const strengthMod = getAbilityModifier(character.strength);
  const dexterityMod = getAbilityModifier(character.dexterity);

  // Finesse weapons can use either STR or DEX
  const abilityMod = isFinesse ? Math.max(strengthMod, dexterityMod) : strengthMod;

  return abilityMod + character.proficiencyBonus;
}

/**
 * Calculate damage bonus for a character
 */
export function calculateDamageBonus(character: CombatCharacter, isFinesse: boolean = false): number {
  const strengthMod = getAbilityModifier(character.strength);
  const dexterityMod = getAbilityModifier(character.dexterity);

  return isFinesse ? Math.max(strengthMod, dexterityMod) : strengthMod;
}

/**
 * Complete attack resolution
 */
export interface AttackResolutionResult {
  attackRoll: AttackRollResult;
  damageRoll?: DamageRollResult;
  damageResult?: ApplyDamageResult;
  updatedDefender?: CombatCharacter;
}

export function resolveAttack(
  context: AttackContext,
  weaponDamage: string,
  damageType: string,
  diceRoller: DiceRoller,
  isFinesse: boolean = false
): AttackResolutionResult {
  const contextId = `attack-${Date.now()}`;
  const attackBonus = calculateAttackBonus(context.attacker, isFinesse);

  const attackRoll = makeAttackRoll(context, diceRoller, attackBonus, contextId);

  if (!attackRoll.isHit) {
    // Miss - no damage
    return { attackRoll };
  }

  // Hit - roll damage
  const damageBonus = calculateDamageBonus(context.attacker, isFinesse);
  const damageRoll = rollDamage(weaponDamage, damageBonus, attackRoll.isCriticalHit, damageType, diceRoller, contextId);

  // Apply damage to defender
  const damageResult = applyDamage(context.defender, damageRoll.totalDamage);

  const updatedDefender: CombatCharacter = {
    ...context.defender,
    hp: damageResult.newHp,
    tempHp: damageResult.newTempHp,
  };

  return {
    attackRoll,
    damageRoll,
    damageResult,
    updatedDefender,
  };
}
