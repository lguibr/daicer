import { ActionDefinition, ActionIntent, ActionType } from './actions';
import { CharacterSheet } from '../types';
import { roll, DiceResult, parseDiceString } from './dice';
import { calculateDistance } from '../utils/geometry';
import { getConditionModifiers, hasCondition, ConditionType } from './conditions';
import { calculateModifier } from './dnd5e';

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
  damageTotal: number;
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

  if (action?.type === 'melee_attack') {
    // TS Guard
    const reach = action.reach || 5;
    if (dist > reach) return { valid: false, reason: `Target out of range (${dist.toFixed(1)}ft vs ${reach}ft)` };
  } else if (action?.type === 'ranged_attack') {
    const maxRange = action.range.long;
    if (dist > maxRange) return { valid: false, reason: `Target out of range (${dist.toFixed(1)}ft vs ${maxRange}ft)` };
    // Note: Disadvantage at long range is a resolution mechanic, not a hard validation failure.
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

  // Conditions Check
  const attackerMods = getConditionModifiers(attacker);
  const targetMods = getConditionModifiers(target);

  let hasAdvantage = intent.advantage ?? false;
  let hasDisadvantage = intent.disadvantage ?? false;

  // 1. Attacker Status
  if (attackerMods.hasAdvantageOnAttack) hasAdvantage = true;
  if (attackerMods.hasDisadvantageOnAttack) hasDisadvantage = true;

  // 2. Target Status (Generic)
  if (targetMods.grantAdvantageToAttacker) hasAdvantage = true;
  if (targetMods.grantDisadvantageToAttacker) hasDisadvantage = true;

  // 3. Prone Nuance
  // If Target is Prone:
  // - Melee Attack (within 5ft usually, but simplistic 'melee_attack' check): Advantage.
  // - Ranged Attack: Disadvantage.
  if (hasCondition(target, ConditionType.Prone)) {
    if (action.type === 'melee_attack') {
      hasAdvantage = true;
    } else if (action.type === 'ranged_attack') {
      hasDisadvantage = true;
    }
  }

  // 1. Roll to Hit
  // Handle Advantage/Disadvantage logic: Roll 2d20, pick best/worst
  let rollRes: DiceResult;

  // Sneak Attack Feasibility Check (Before roll to capture intent, but calculated after)
  // MVP: Check if "Sneak Attack" feature exists
  const sneakAttackFeature = attacker.features?.find((f) => f.name === 'Sneak Attack');
  let allowedSneak = false;

  if (sneakAttackFeature) {
    const isFinesse =
      action.type === 'ranged_attack' || (action.type === 'melee_attack' && action.properties?.includes('finesse'));
    if (isFinesse) {
      // Rule: Advantage OR (Ally with 5ft of target AND No Disadvantage)
      // For MVP, we'll stick to: Advantage True OR "AllyAdjacent" (Requires spatial query not yet in inputs).
      // We will use Advantage check primarily for MVP auto-detect.
      if (hasAdvantage) allowedSneak = true;
      // TODO: Add Ally adjacency check when map context available in resolveAttack
    }
  }

  if (hasAdvantage && !hasDisadvantage) {
    const r1 = roll({ count: 1, sides: 20, bonus: action.toHit });
    const r2 = roll({ count: 1, sides: 20, bonus: action.toHit });
    rollRes = r1.total >= r2.total ? r1 : r2;
  } else if (hasDisadvantage && !hasAdvantage) {
    const r1 = roll({ count: 1, sides: 20, bonus: action.toHit });
    const r2 = roll({ count: 1, sides: 20, bonus: action.toHit });
    rollRes = r1.total <= r2.total ? r1 : r2;
  } else {
    // Normal or Cancelled out
    rollRes = roll({ count: 1, sides: 20, bonus: action.toHit });
  }

  const natural = rollRes.rolls[0];
  const totalHit = rollRes.total;

  // Auto Crit logic (Paralyzed/Unconscious)
  const isAutoCrit = (targetMods.autoCritReceived ?? false) && action.type === 'melee_attack';

  const isCritical = natural === 20 || isAutoCrit;
  const isCriticalFail = natural === 1;

  // 2. Determine Hit vs AC
  const targetAC = target.armorClass;
  // Auto Hit if Paralyzed? No, technically still roll, but Advantage + Auto Crit makes it likely.
  // Actually, Paralyzed grants Advantage. Hits are Crits. DOES NOT AUTO HIT.
  // Unconscious grants Advantage. Hits are Crits. DOES NOT AUTO HIT.
  // So standard AC check applies.

  const hit = isCritical || (!isCriticalFail && totalHit >= targetAC);

  // 3. Roll Damage (if hit) and Apply Modifiers
  const damageDetails = [];
  let totalDamage = 0;

  if (hit) {
    // Rage Damage Bonus (Attacker)
    // Rule: Melee Weapon Attack using Strength (Not Finesse used as Dex? Engine assumes Str unless Finesse property implies Dex use?
    // 5e Rage: "Melee weapon attack using Strength".
    // MVP: If Melee Attack and NOT Finesse-only (or just standard melee), add +2.
    // Actually, simple heuristic: If has 'Rage' and Melee -> +2.
    const isRaging = hasCondition(attacker, ConditionType.Rage);
    let rageBonus = 0;
    if (isRaging && action.type === 'melee_attack') {
      rageBonus = 2; // MVP Fixed
    }

    // Process Base Action Damage
    for (const d of action.damage) {
      // Parse dice: "2d6"
      const def = parseDiceString(d.dice);

      // Critical Hit: Double the DICE (count), not the bonus
      if (isCritical) {
        def.count *= 2;
      }

      // Roll damage
      const dmgRoll = roll({ ...def, bonus: d.bonus + rageBonus });
      // Clear rage bonus after first damage instance? Usually applies once per hit.
      // Applied to first damage chunk is safest.
      rageBonus = 0;

      let dmgValue = Math.max(0, dmgRoll.total);

      // Apply Resistances/Immunities/Vulnerabilities (Target)
      const type = d.type.toLowerCase();

      // Generic Resistance Loop
      // Rage Resistance Logic (Target)
      const targetIsRaging = hasCondition(target, ConditionType.Rage);
      const isRageResisted = targetIsRaging && ['bludgeoning', 'piercing', 'slashing'].includes(type);

      const isResistant = target.resistances?.some((r) => r.toLowerCase() === type) || isRageResisted;
      const isImmune = target.immunities?.some((i) => i.toLowerCase() === type);
      const isVulnerable = target.vulnerabilities?.some((v) => v.toLowerCase() === type);

      if (isImmune) {
        dmgValue = 0;
      } else {
        if (isResistant) {
          dmgValue = Math.floor(dmgValue / 2);
        }
        if (isVulnerable) {
          dmgValue *= 2;
        }
      }

      totalDamage += dmgValue;
      damageDetails.push({
        type: d.type,
        total: dmgValue,
        diceRolls: dmgRoll.rolls,
        bonus: d.bonus, // Not showing rage bonus explicitly in breakdown for MVP?
        diceString: isCritical ? `${def.count}d${def.sides}+${d.bonus}` : `${d.dice}+${d.bonus}`,
      });
    }

    // Sneak Attack Damage (Append)
    if (allowedSneak) {
      // Calculate Sneak Dice: ceil(level / 2)
      const rougeLevel = attacker.level; // Assuming pure rogue for MVP or total level
      const sneakDiceCount = Math.ceil(rougeLevel / 2);

      let sneakDiceTotal = sneakDiceCount;
      if (isCritical) sneakDiceTotal *= 2;

      const sneakRoll = roll({ count: sneakDiceTotal, sides: 6, bonus: 0 });
      const sneakDmg = sneakRoll.total;

      totalDamage += sneakDmg;
      damageDetails.push({
        type: 'precision', // or weapon type? Standard is same as weapon.
        total: sneakDmg,
        diceRolls: sneakRoll.rolls,
        bonus: 0,
        diceString: `${sneakDiceTotal}d6 (Sneak Attack)`,
      });
    }
  }

  return {
    hit,
    isCritical,
    isCriticalFail,
    attackRoll: rollRes,
    damageTotal: totalDamage,
    damageDetails,
    verdict: isCritical ? 'Critical Hit!' : hit ? 'Hit' : isCriticalFail ? 'Critical Miss!' : 'Miss',
  };
}
// ... imports ...

export interface GrappleResult {
  success: boolean;
  attackerRoll: { total: number; modifier: number; roll: number };
  targetRoll: { total: number; modifier: number; roll: number; skillUsed: string };
  verdict: string;
}

/**
 * Resolves a Grapple attempt (Contested Check).
 */
export function resolveGrapple(attacker: CharacterSheet, target: CharacterSheet): GrappleResult {
  // 1. Attacker: Athletics
  // Check if exists, else fallback to Str Mod.
  // Attributes fallback to 10 if missing to avoid NaN.
  const strScore = attacker.attributes.Strength ?? 10;
  const dexScore = attacker.attributes.Dexterity ?? 10;

  const athMod = attacker.skills?.athletics ?? calculateModifier(strScore);

  // Check if exists, else fallback to Str Mod.
  const atkModVal = attacker.skills['athletics'] ?? calculateModifier(strScore);

  const atkRoll = roll({ count: 1, sides: 20, bonus: atkModVal });

  // 2. Target: Best of Athletics or Acrobatics
  // Target Attributes fallback
  const tgtStr = target.attributes.Strength ?? 10;
  const tgtDex = target.attributes.Dexterity ?? 10;

  const tgtAth = target.skills['athletics'] ?? calculateModifier(tgtStr);
  const tgtAcro = target.skills['acrobatics'] ?? calculateModifier(tgtDex);

  const useAth = tgtAth >= tgtAcro;
  const tgtModVal = useAth ? tgtAth : tgtAcro;
  const skillUsed = useAth ? 'Athletics' : 'Acrobatics';

  const tgtRoll = roll({ count: 1, sides: 20, bonus: tgtModVal });

  // 3. Compare
  // Tie goes to status quo? In 5e Grapple, Attacker needs to exceed?
  // PHB: "If you succeed, you subject the target..."
  // Contested checks: If tie, the situation remains the same. Since grapple is a change, Attacker needs to WIN?
  // Actually, standard contested rule: "If the contest results in a tie, the situation remains the same."
  // So yes, Attacker must beat Target? Or does Target need to avoid?
  // Usually: Attacker Roll vs Target Roll. If Attacker >= Target??
  // 5e SRD: "If your check succeeds".
  // Community consensus: Tie goes to the Roller (Attacker)?
  // Actually: "AC vs Attack" -> Equals hits.
  // "Contest" -> "If the contest results in a tie, the situation remains the same."
  // So: Attacker fails on tie.
  // Let's assume Attacker > Target to change state.

  const success = atkRoll.total > tgtRoll.total;
  // Wait, commonly Ties in contests mean "nothing happens".
  // So Grapple fails.

  return {
    success,
    attackerRoll: { total: atkRoll.total, modifier: atkModVal, roll: atkRoll.rolls[0] },
    targetRoll: { total: tgtRoll.total, modifier: tgtModVal, roll: tgtRoll.rolls[0], skillUsed },
    verdict: success ? 'Grappled!' : 'Failed',
  };
}
