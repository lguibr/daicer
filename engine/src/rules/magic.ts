import { ActionIntent, ActionDefinition, ActionType } from './actions';
import { CharacterSheet, DiceResult, roll } from '../types'; // Adjust imports from index
import { calculateDistance, Point3D } from '../utils/geometry';

// We need to re-import Dice tools as they might not be fully exported in types/index yet or circular dep
import { parseDiceString } from './dice';

export interface MagicValidationResult {
  valid: boolean;
  reason?: string;
  slotLevel?: number; // The level of the slot to be consumed
}

export interface SpellResult {
  success: boolean;
  slotConsumed?: number;
  targetsHit?: string[]; // IDs
  damageDetails?: {
    type: string;
    total: number;
    rolls: number[];
  }[];
  saveDC?: number;
  saveStat?: string;
  description: string;
  isAoE: boolean;
}

function findSpell(sheet: CharacterSheet, actionId: string): ActionDefinition | undefined {
  return sheet.structuredActions.find((a) => a.id === actionId && a.type === 'spell');
}

/**
 * Validates if a spell can be cast.
 */
export function validateSpellCast(
  caster: CharacterSheet,
  intent: ActionIntent,
  casterPos: Point3D,
  targetPos?: Point3D
): MagicValidationResult {
  if (intent.type !== ActionType.CastSpell) return { valid: false, reason: 'Invalid Intent' };

  // 1. Check if Known/Prepared (Implicit in structuredActions existence)
  const spellAction = findSpell(caster, intent.actionId);
  if (!spellAction || spellAction.type !== 'spell') {
    return { valid: false, reason: 'Spell not prepared or not found in actions.' };
  }

  // 2. Check Spell Slots
  const level = intent.level ?? spellAction.level;

  // Cantrips (Level 0) are always valid recourse-wise
  if (level > 0) {
    if (!caster.spellbook || !caster.spellbook.slots) {
      return { valid: false, reason: 'No spell slots available.' };
    }
    const slot = caster.spellbook.slots.find((s) => s.level === level);
    if (!slot || slot.current < 1) {
      return { valid: false, reason: `No Level ${level} spell slots remaining.` };
    }
  }

  // 3. Range Check
  if (targetPos) {
    const range = parseInt(spellAction.range); // "60 feet" -> naive parse, needs better parsing usually
    // For MVP assume range string is just number ?? Or "Touch"
    let maxDist = 5;
    if (spellAction.range.toLowerCase().includes('touch'))
      maxDist = 7; // Reach + slack
    else {
      const matches = spellAction.range.match(/\d+/);
      if (matches) maxDist = parseInt(matches[0]);
      else maxDist = 30; // Fallback
    }

    const dist = calculateDistance(casterPos, targetPos);
    if (dist > maxDist) {
      return { valid: false, reason: 'Target out of range.' };
    }
  }

  return { valid: true, slotLevel: level };
}

/**
 * Resolves the casting of a spell (deducting slots, calculating damage/DC).
 * Note: Does NOT apply damage to targets directly (State mutation should be separate or returned).
 * We return the *Result* of the cast.
 */
export function resolveSpell(caster: CharacterSheet, intent: ActionIntent): SpellResult {
  if (intent.type !== ActionType.CastSpell) throw new Error('Invalid intent');

  const spell = findSpell(caster, intent.actionId);
  if (!spell || spell.type !== 'spell') throw new Error('Spell not found');

  // 1. Handle Slot Deduction Logic (Caller must mutate sheet based on this result)
  // Logic is in validation, we confirm here what *should* happen.
  const slotLevel = intent.level ?? spell.level;

  // 2. Calculate Output
  // For MVP, we extract damage from description or a structured `damage` field if we added it.
  // Wait, ActionDefinitionSchema for 'spell' did NOT have a `damage` array in my previous step!
  // It checks `description`.
  // Ideally we should structure damage on Spells too for the engine.
  // But for now, we return basic DC info.

  let saveDC = 0;
  if (spell.save) {
    saveDC = spell.save.dc; // Or calculate from Caster stats?
    // Usually sheet snapshot has pre-calced DC?
    // If spell.save.dc is static in JSON, use it.
    // Otherwise `caster.spellcasting.saveDC`.
  } else if (caster.spellbook && caster.spellbook.spellSaveDc) {
    saveDC = caster.spellbook.spellSaveDc;
  }

  return {
    success: true,
    slotConsumed: slotLevel > 0 ? slotLevel : undefined,
    saveDC: saveDC || undefined,
    saveStat: spell.save?.stat,
    description: spell.description,
    isAoE: !!intent.targetLocation, // inferred
    damageDetails: [], // Needs structured damage on spell schema to populate
  };
}
