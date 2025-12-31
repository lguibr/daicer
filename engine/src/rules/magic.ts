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
 * Resolves the casting of a spell.
 * - Deducts slots.
 * - Handles Concentration (Drop old, Set new).
 */
export interface ResolveSpellResult {
  slotConsumed?: number;
  saveDC: number;
  saveStat: string;
  isAoE: boolean;
  brokenConcentrationId?: string;
  newConcentrationId?: string;
}

export function resolveSpell(sheet: CharacterSheet, intent: ActionIntent): ResolveSpellResult {
  if (intent.type !== ActionType.CastSpell) {
    throw new Error('Invalid intent type for resolveSpell');
  }

  const spell = sheet.structuredActions.find((a) => a.id === intent.actionId && a.type === 'spell');

  if (!spell || spell.type !== 'spell') {
    throw new Error(`Spell ${intent.actionId} not found`);
  }

  // 1. Deduct Slot (if not cantrip)
  // Logic simplified: intent.level or spell.level?
  // Use intent level (upcasting support hook).
  let slotConsumed: number | undefined;

  const levelToConsume = intent.level ?? spell.level;

  // Validate again (redundant but safe)? validateSpellCast caller usually does this.
  // We just execute.
  if (levelToConsume > 0) {
    if (sheet.spellbook?.slots) {
      const slot = sheet.spellbook.slots.find((s) => s.level === levelToConsume);
      if (slot && slot.current > 0) {
        slot.current--;
        slotConsumed = levelToConsume;
      }
    }
  } else {
    slotConsumed = 0;
  }

  // 2. Handle Concentration
  let brokenConcentrationId: string | undefined;
  let newConcentrationId: string | undefined;

  if (spell.concentration) {
    // If already concentrating, break it
    if (sheet.spellbook?.concentratingOn) {
      brokenConcentrationId = sheet.spellbook.concentratingOn;
    }

    // Set new
    if (sheet.spellbook) {
      sheet.spellbook.concentratingOn = spell.id;
      newConcentrationId = spell.id;
    }
  }

  // 3. Output
  // Default DC from sheet or spell?
  // SpellDefinition might have override, else Calculate from Spellbook.
  const dc = sheet.spellbook?.spellSaveDc ?? 10;
  const saveStat = spell.save?.stat || 'dexterity'; // Default

  // AoE Check
  // Infer from spell range/target logic?
  // MVP: If range is "Self (15-foot cone)", it is AoE.
  // If targetId is missing but location provided, implies AoE.
  const isAoE = !!spell.range.match(/cone|sphere|line|cylinder|radius/i);

  return {
    slotConsumed,
    saveDC: dc,
    saveStat,
    isAoE,
    brokenConcentrationId,
    newConcentrationId,
  };
}
