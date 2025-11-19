/**
 * @file backend/src/tactical/services/actionPlanner.ts
 * @description Action planner with D&D 5e rule validation for tactical combat
 */

import type { GridPosition } from '../../types/spells.js';
import type { ParsedCommand } from '../llm/commandParser.js';
import type { TacticalEncounter, TacticalUnit } from '../types/unit.js';
import type { TacticalArena } from '../types/arena.js';
import { getUnitById, getAbilityModifier } from '../types/unit.js';
import { createGridManager } from './gridManager.js';

// ============================================================================
// Types
// ============================================================================

export interface ActionStep {
  type: 'move' | 'attack' | 'cast_spell' | 'dash' | 'dodge' | 'help' | 'disengage' | 'hide';
  actorId: string;
  params: Record<string, unknown>;
  validation: Array<{
    requirement: string;
    satisfied: boolean;
    reason?: string;
  }>;
}

export interface PredictedDamage {
  min: number;
  max: number;
  avg: number;
}

export interface ActionPlan {
  id: string;
  commandText: string;
  parsed: ParsedCommand;
  steps: ActionStep[];
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  preview: {
    movementPath?: GridPosition[];
    affectedUnits: Array<{
      unitId: string;
      effect: string;
      predictedDamage?: PredictedDamage;
    }>;
    diceNeeded: string[];
    resourceCost?: string;
    hitChance?: number;
  };
}

// ============================================================================
// Dice Prediction Utilities
// ============================================================================

/**
 * Calculate min/max/avg for damage roll
 */
function calculateDamagePrediction(notation: string): PredictedDamage {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match || !match[1] || !match[2]) {
    return { min: 0, max: 0, avg: 0 };
  }

  const numDice = parseInt(match[1], 10);
  const diceSize = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  return {
    min: numDice * 1 + modifier,
    max: numDice * diceSize + modifier,
    avg: Math.round(numDice * ((1 + diceSize) / 2) + modifier),
  };
}

/**
 * Calculate hit chance (approximate, assumes normal distribution)
 */
function calculateHitChance(attackBonus: number, targetAC: number): number {
  const neededRoll = targetAC - attackBonus;

  // Natural 20 always hits, natural 1 always misses
  if (neededRoll <= 1) return 0.95; // 19/20 (excluding nat 1)
  if (neededRoll >= 20) return 0.05; // 1/20 (only nat 20)

  // Probability = (21 - neededRoll) / 20
  return Math.max(0.05, Math.min(0.95, (21 - neededRoll) / 20));
}

// ============================================================================
// Action Planning
// ============================================================================

/**
 * Plan a movement action
 */
function planMovement(
  actor: TacticalUnit,
  targetPos: GridPosition,
  encounter: TacticalEncounter,
  gridManager: ReturnType<typeof createGridManager>
): ActionStep {
  const validation: ActionStep['validation'] = [];

  // Check if actor can move
  if (actor.movementRemaining <= 0) {
    validation.push({
      requirement: 'Actor must have movement remaining',
      satisfied: false,
      reason: 'No movement remaining this turn',
    });
  } else {
    validation.push({
      requirement: 'Actor must have movement remaining',
      satisfied: true,
    });
  }

  // Check if target position is valid
  const isValid = gridManager.isValidMovement(targetPos);
  validation.push({
    requirement: 'Target position must be valid',
    satisfied: isValid,
    reason: !isValid ? 'Position is blocked or out of bounds' : undefined,
  });

  // Check if position is occupied
  const occupied = encounter.units.some(
    (u) => u.id !== actor.id && u.position.x === targetPos.x && u.position.y === targetPos.y
  );
  validation.push({
    requirement: 'Target position must not be occupied',
    satisfied: !occupied,
    reason: occupied ? 'Another unit is at that position' : undefined,
  });

  // Calculate path and cost
  const path = gridManager.findPath(actor.position, targetPos, actor.movementRemaining);
  if (path) {
    const cost = gridManager.calculatePathCost(path);
    validation.push({
      requirement: 'Actor must have enough movement',
      satisfied: cost <= actor.movementRemaining,
      reason: cost > actor.movementRemaining ? `Requires ${cost} ft, have ${actor.movementRemaining} ft` : undefined,
    });
  } else {
    validation.push({
      requirement: 'A valid path must exist',
      satisfied: false,
      reason: 'No path found to target position',
    });
  }

  return {
    type: 'move',
    actorId: actor.id,
    params: {
      from: actor.position,
      to: targetPos,
      path,
    },
    validation,
  };
}

/**
 * Plan an attack action
 */
function planAttack(
  actor: TacticalUnit,
  target: TacticalUnit,
  _encounter: TacticalEncounter,
  gridManager: ReturnType<typeof createGridManager>
): ActionStep {
  const validation: ActionStep['validation'] = [];

  // Check if actor has action available
  validation.push({
    requirement: 'Actor must have action available',
    satisfied: actor.hasAction,
    reason: !actor.hasAction ? 'Action already used this turn' : undefined,
  });

  // Check if target is in range
  const distance = gridManager.getManhattanDistance(actor.position, target.position);
  const reach = actor.reach || 1;
  const inRange = distance <= reach;

  validation.push({
    requirement: 'Target must be in range',
    satisfied: inRange,
    reason: !inRange ? `Target is ${distance * 5} ft away, reach is ${reach * 5} ft` : undefined,
  });

  // Check line of sight (for reach > 1)
  if (reach > 1) {
    const hasLOS = gridManager.hasLineOfSight(actor.position, target.position);
    validation.push({
      requirement: 'Must have line of sight to target',
      satisfied: hasLOS,
      reason: !hasLOS ? 'Line of sight blocked by terrain' : undefined,
    });
  }

  // Calculate attack bonus and hit chance
  const dexMod = getAbilityModifier(actor.dexterity);
  const strMod = getAbilityModifier(actor.strength);
  const attackMod = Math.max(strMod, dexMod); // Use better of STR/DEX
  const attackBonus = attackMod + actor.proficiencyBonus;
  const hitChance = calculateHitChance(attackBonus, target.armorClass);

  // Default weapon damage (could be parameterized)
  const weaponDamage = '1d8'; // Longsword
  const damageBonus = attackMod;
  const fullNotation = `${weaponDamage}${damageBonus >= 0 ? '+' : ''}${damageBonus}`;

  return {
    type: 'attack',
    actorId: actor.id,
    params: {
      targetId: target.id,
      attackBonus,
      weaponDamage,
      damageBonus,
      damageNotation: fullNotation,
      hitChance,
      distance,
    },
    validation,
  };
}

/**
 * Plan a spell casting action
 */
function planSpellCast(
  actor: TacticalUnit,
  spellId: string,
  targetPos: GridPosition | undefined,
  _encounter: TacticalEncounter,
  _gridManager: ReturnType<typeof createGridManager>
): ActionStep {
  const validation: ActionStep['validation'] = [];

  // Check if actor has action available
  validation.push({
    requirement: 'Actor must have action available',
    satisfied: actor.hasAction,
    reason: !actor.hasAction ? 'Action already used this turn' : undefined,
  });

  // Spell validation simplified - would need spell catalog integration
  validation.push({
    requirement: 'Spell must exist in catalog',
    satisfied: true,
    reason: undefined, // TODO: Implement spell lookup
  });

  return {
    type: 'cast_spell',
    actorId: actor.id,
    params: {
      spellId,
      targetPos,
    },
    validation,
  };
}

/**
 * Main action planning function
 */
export async function planAction(
  parsed: ParsedCommand,
  encounter: TacticalEncounter,
  arena: TacticalArena
): Promise<ActionPlan> {
  const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const gridManager = createGridManager(arena);

  const steps: ActionStep[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const affectedUnits: ActionPlan['preview']['affectedUnits'] = [];
  const diceNeeded: string[] = [];
  let movementPath: GridPosition[] | undefined;
  let hitChance: number | undefined;
  let resourceCost: string | undefined;

  // Get actor
  const actor = parsed.actorId ? getUnitById(encounter, parsed.actorId) : null;
  if (!actor) {
    errors.push(`Actor "${parsed.actorName}" not found in encounter`);

    return {
      id: planId,
      commandText: '',
      parsed,
      steps: [],
      validation: { valid: false, errors, warnings },
      preview: { affectedUnits: [], diceNeeded: [] },
    };
  }

  // Plan based on intent
  switch (parsed.intent) {
    case 'move': {
      if (!parsed.target?.position) {
        errors.push('No target position specified for movement');
        break;
      }

      const step = planMovement(actor, parsed.target.position, encounter, gridManager);
      steps.push(step);

      // Extract path from step
      if (step.params.path) {
        movementPath = step.params.path as GridPosition[];
      }

      // Collect validation errors/warnings
      step.validation.forEach((v) => {
        if (!v.satisfied) {
          if (v.requirement.includes('must')) {
            errors.push(v.reason || v.requirement);
          } else {
            warnings.push(v.reason || v.requirement);
          }
        }
      });

      affectedUnits.push({
        unitId: actor.id,
        effect: `Moves to (${parsed.target.position.x}, ${parsed.target.position.y})`,
      });
      break;
    }

    case 'attack': {
      const target = parsed.target?.unitId ? getUnitById(encounter, parsed.target.unitId) : null;
      if (!target) {
        errors.push(`Target "${parsed.target?.unitName || 'unknown'}" not found`);
        break;
      }

      const step = planAttack(actor, target, encounter, gridManager);
      steps.push(step);

      // Extract attack predictions
      if (step.params.attackBonus !== undefined) {
        const attackBonus = step.params.attackBonus as number;
        const damageNotation = step.params.damageNotation as string;
        hitChance = step.params.hitChance as number;

        diceNeeded.push(`1d20+${attackBonus} attack roll`);
        diceNeeded.push(`${damageNotation} damage`);

        const damagePred = calculateDamagePrediction(damageNotation);
        affectedUnits.push({
          unitId: target.id,
          effect: `${Math.round(hitChance * 100)}% chance to hit`,
          predictedDamage: damagePred,
        });
      }

      // Collect validation errors/warnings
      step.validation.forEach((v) => {
        if (!v.satisfied) {
          errors.push(v.reason || v.requirement);
        }
      });
      break;
    }

    case 'cast_spell': {
      if (!parsed.spellId) {
        errors.push('No spell specified');
        break;
      }

      const targetPos = parsed.target?.position;
      const step = planSpellCast(actor, parsed.spellId, targetPos, encounter, gridManager);
      steps.push(step);

      // Collect validation errors/warnings
      step.validation.forEach((v) => {
        if (!v.satisfied) {
          if (v.requirement.includes('Friendly fire')) {
            warnings.push(v.reason || v.requirement);
          } else {
            errors.push(v.reason || v.requirement);
          }
        }
      });

      // Add spell info
      if (step.params.spellLevel) {
        resourceCost = `1 level ${step.params.spellLevel} spell slot`;
        diceNeeded.push(`Spell: ${step.params.spellName}`);
      }
      break;
    }

    case 'dash':
    case 'dodge':
    case 'help':
    case 'disengage':
    case 'hide':
      // Simple actions - just check if action is available
      steps.push({
        type: parsed.intent,
        actorId: actor.id,
        params: {},
        validation: [
          {
            requirement: 'Actor must have action available',
            satisfied: actor.hasAction,
            reason: !actor.hasAction ? 'Action already used' : undefined,
          },
        ],
      });

      affectedUnits.push({
        unitId: actor.id,
        effect: `Takes ${parsed.intent} action`,
      });
      break;

    default:
      errors.push(`Unknown action intent: ${parsed.intent}`);
  }

  return {
    id: planId,
    commandText: `${parsed.actorName} ${parsed.intent}`,
    parsed,
    steps,
    validation: {
      valid: errors.length === 0,
      errors,
      warnings,
    },
    preview: {
      movementPath,
      affectedUnits,
      diceNeeded,
      resourceCost,
      hitChance,
    },
  };
}
