import { ActionDefinition, ActionIntent, ActionType } from './actions';
import { CharacterSheet } from '../types';
import { roll, DiceResult, parseDiceString } from './dice';
import { calculateDistance } from '../utils/geometry';

// ============================================================================
// Types
// ============================================================================

export interface CombatPositions {
  attacker: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

export interface AttackResult {
  hit: boolean;
  isCritical: boolean;
  isCriticalFail: boolean;
  attackRoll: DiceResult;
  totalDamage: number;
  damageDetails: {
    type: string;
    total: number;
    diceRolls: number[];
    bonus: number;
    diceString: string;
  }[];
  verdict: string; // "Hit!", "Miss", "Critical Hit!"
}

// ============================================================================
// Helpers
// ============================================================================

function findAction(sheet: CharacterSheet, actionId: string): ActionDefinition | undefined {
  return sheet.structuredActions.find((a) => a.id === actionId);
}

// ============================================================================
// Combat Logic
// ============================================================================

/**
 * Validates if an attack is possible (Range check).
 */
export function validateAttack(
  attacker: CharacterSheet,
  target: CharacterSheet,
  intent: ActionIntent,
  positions: CombatPositions
): { valid: boolean; reason?: string } {
  if (intent.type !== ActionType.Attack) return { valid: false, reason: 'Not an attack' };

  const action = findAction(attacker, intent.actionId);
  if (!action) return { valid: false, reason: 'Action not found' };

  const dist = calculateDistance(positions.attacker, positions.target);

  if (action.type === 'melee_attack') {
    const reach = action.reach || 5;
    if (dist > reach) return { valid: false, reason: `Target out of range (${dist.toFixed(1)}ft vs ${reach}ft)` };
  } else if (action.type === 'ranged_attack') {
    const maxRange = action.range.long;
    if (dist > maxRange) return { valid: false, reason: `Target out of range (${dist.toFixed(1)}ft vs ${maxRange}ft)` };
    // Note: Disadvantage at long range is a resolution mechanic, not a hard validation failure,
    // usually. But strictly speaking, it is valid to attempt.
  }

  return { valid: true };
}

/**
 * Resolves a unified Attack Action (Melee or Ranged).
 */
export function resolveAttack(attacker: CharacterSheet, target: CharacterSheet, intent: ActionIntent): AttackResult {
  if (intent.type !== ActionType.Attack) {
    throw new Error('Invalid intent type for resolveAttack');
  }

  const action = findAction(attacker, intent.actionId);
  if (!action || (action.type !== 'melee_attack' && action.type !== 'ranged_attack')) {
    throw new Error(`Action ${intent.actionId} is not a valid attack definition.`);
  }

  // 1. Roll to Hit
  // Handle Advantage/Disadvantage logic: Roll 2d20, pick best/worst
  let rollRes: DiceResult;

  if (intent.advantage && !intent.disadvantage) {
    const r1 = roll({ count: 1, sides: 20, bonus: action.toHit });
    const r2 = roll({ count: 1, sides: 20, bonus: action.toHit });
    // Pick highest total (raw die check needed for crit?)
    // Actually standard rule: Roll 2 d20s.
    // Simplifying: we'll return the 'winning' dice result structure.
    rollRes = r1.total >= r2.total ? r1 : r2; // Approximation: should look at natural roll? Total implies bonus is same.
  } else if (intent.disadvantage && !intent.advantage) {
    const r1 = roll({ count: 1, sides: 20, bonus: action.toHit });
    const r2 = roll({ count: 1, sides: 20, bonus: action.toHit });
    rollRes = r1.total <= r2.total ? r1 : r2;
  } else {
    // Normal or Cancelled out
    rollRes = roll({ count: 1, sides: 20, bonus: action.toHit });
  }

  const natural = rollRes.rolls[0];
  const totalHit = rollRes.total;

  const isCritical = natural === 20;
  const isCriticalFail = natural === 1;

  // 2. Determine Hit vs AC
  const targetAC = target.armorClass;
  const hit = isCritical || (!isCriticalFail && totalHit >= targetAC);

  // 3. Roll Damage (if hit)
  const damageDetails = [];
  let totalDamage = 0;

  if (hit) {
    for (const d of action.damage) {
      // Parse dice: "2d6"
      const def = parseDiceString(d.dice);

      // Critical Hit: Double the DICE (count), not the bonus
      if (isCritical) {
        def.count *= 2;
      }

      // Roll damage
      const dmgRoll = roll({ ...def, bonus: d.bonus });

      const dmgValue = Math.max(0, dmgRoll.total); // Damage floor 0

      totalDamage += dmgValue;
      damageDetails.push({
        type: d.type,
        total: dmgValue,
        diceRolls: dmgRoll.rolls,
        bonus: d.bonus,
        diceString: isCritical ? `${def.count}d${def.sides}+${d.bonus}` : `${d.dice}+${d.bonus}`,
      });
    }
  }

  return {
    hit,
    isCritical,
    isCriticalFail,
    attackRoll: rollRes,
    totalDamage,
    damageDetails,
    verdict: isCritical ? 'Critical Hit!' : hit ? 'Hit' : isCriticalFail ? 'Critical Miss!' : 'Miss',
  };
}
