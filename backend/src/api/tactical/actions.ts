/**
 * @file backend/src/api/tactical/actions.ts
 * @description Action preview and execution API for tactical combat
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../middleware/error.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../config/firebase.js';
import { parseCommand, validateParsedCommand } from '../../tactical/llm/commandParser.js';
import { planAction, type ActionPlan } from '../../tactical/services/actionPlanner.js';
import { buildTacticalContext } from '../../tactical/services/contextBuilder.js';
import type { TacticalEncounter } from '../../tactical/types/unit.js';
import { TacticalEncounterSchema } from '../../tactical/types/unit.js';
import { getArenaById } from '../../tactical/arenas/generator.js';

const router = Router();

// ============================================================================
// In-Memory Plan Cache
// ============================================================================

interface CachedPlan {
  plan: ActionPlan;
  timestamp: number;
}

const planCache = new Map<string, CachedPlan>();
const PLAN_TTL = 5 * 60 * 1000; // 5 minutes

function cachePlan(plan: ActionPlan): void {
  planCache.set(plan.id, {
    plan,
    timestamp: Date.now(),
  });

  // Clean up expired plans
  for (const [id, cached] of planCache.entries()) {
    if (Date.now() - cached.timestamp > PLAN_TTL) {
      planCache.delete(id);
    }
  }
}

function getCachedPlan(planId: string): ActionPlan | null {
  const cached = planCache.get(planId);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > PLAN_TTL) {
    planCache.delete(planId);
    return null;
  }

  return cached.plan;
}

// ============================================================================
// Helpers
// ============================================================================

async function getEncounter(encounterId: string): Promise<TacticalEncounter> {
  const doc = await db().collection('tacticalEncounters').doc(encounterId).get();
  if (!doc.exists) {
    throw new ApiError(404, 'Encounter not found');
  }
  return TacticalEncounterSchema.parse({ id: doc.id, ...doc.data() });
}

async function updateEncounter(encounterId: string, data: Partial<TacticalEncounter>): Promise<void> {
  await db()
    .collection('tacticalEncounters')
    .doc(encounterId)
    .update({
      ...data,
      updatedAt: Date.now(),
    });
}

// ============================================================================
// Preview Endpoint
// ============================================================================

/**
 * POST /api/tactical/encounter/:id/preview
 * Preview an action before execution
 */
router.post('/encounter/:encounterId/preview', authenticate, async (req: AuthRequest, res): Promise<void> => {
  const { encounterId } = req.params;
  if (!encounterId) {
    throw new ApiError(400, 'Encounter ID required');
  }

  const { command } = z
    .object({
      command: z.string().min(1, 'Command cannot be empty'),
    })
    .parse(req.body);

  logger.info('Previewing tactical action', { encounterId, command });

  // Load encounter
  const encounter = await getEncounter(encounterId);

  // Load arena
  const arena = getArenaById(encounter.arenaId);
  if (!arena) {
    throw new ApiError(404, 'Arena not found');
  }

  // Build context for LLM (context available for future use if needed)
  await buildTacticalContext(encounter, arena);

  // Parse command
  const parsed = await parseCommand(command, encounter);
  logger.info('Command parsed', { parsed });

  // Validate parsed command
  const validation = validateParsedCommand(parsed, encounter);

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: 'Invalid command',
      errors: validation.errors,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      parsed,
    });
    return;
  }

  // Plan action
  const plan = await planAction(parsed, encounter, arena);
  logger.info('Action planned', {
    planId: plan.id,
    valid: plan.validation.valid,
    steps: plan.steps.length,
  });

  // Cache the plan for execution
  cachePlan(plan);

  // Format preview response
  const previewResponse = {
    success: true,
    planId: plan.id,
    parsed,
    validation: plan.validation,
    preview: {
      movementPath: plan.preview.movementPath,
      affectedUnits: plan.preview.affectedUnits.map((au) => {
        const unit = encounter.units.find((u) => u.id === au.unitId);
        return {
          id: au.unitId,
          name: unit?.name || 'Unknown',
          currentHP: unit ? `${unit.hp}/${unit.maxHp}` : 'N/A',
          predictedHP:
            au.predictedDamage && unit ? `${Math.max(0, unit.hp - au.predictedDamage.avg)}/${unit.maxHp}` : undefined,
          effect: au.effect,
          predictedDamage: au.predictedDamage,
        };
      }),
      diceNeeded: plan.preview.diceNeeded,
      resourceCost: plan.preview.resourceCost,
      hitChance: plan.preview.hitChance,
    },
    warnings: plan.validation.warnings,
    suggestions: validation.suggestions,
  };

  res.json(previewResponse);
});

// ============================================================================
// Execution Endpoint
// ============================================================================

/**
 * POST /api/tactical/encounter/:id/execute
 * Execute a previewed action
 */
router.post('/encounter/:encounterId/execute', authenticate, async (req: AuthRequest, res): Promise<void> => {
  const { encounterId } = req.params;
  if (!encounterId) {
    throw new ApiError(400, 'Encounter ID required');
  }

  const { planId, confirmed, overrides } = z
    .object({
      planId: z.string(),
      confirmed: z.boolean(),
      overrides: z
        .object({
          allowFriendlyFire: z.boolean().optional(),
        })
        .optional(),
    })
    .parse(req.body);

  if (!confirmed) {
    throw new ApiError(400, 'Action must be confirmed for execution');
  }

  logger.info('Executing tactical action', { encounterId, planId });

  // Load encounter
  const encounter = await getEncounter(encounterId);

  // Load arena
  const arena = getArenaById(encounter.arenaId);
  if (!arena) {
    throw new ApiError(404, 'Arena not found');
  }

  // Retrieve cached plan
  const plan = getCachedPlan(planId);
  if (!plan) {
    throw new ApiError(404, 'Plan not found or expired - please preview action again');
  }

  // Re-validate plan (state may have changed)
  const revalidation = await planAction(plan.parsed, encounter, arena);

  if (!revalidation.validation.valid) {
    // Check if overrides can make it valid
    const friendlyFireWarnings = revalidation.validation.errors.filter((e) =>
      e.toLowerCase().includes('friendly fire')
    );

    if (friendlyFireWarnings.length > 0 && overrides?.allowFriendlyFire) {
      // Allow friendly fire override
      logger.warn('Allowing friendly fire override', { planId });
    } else {
      res.status(400).json({
        success: false,
        error: 'Action is no longer valid',
        errors: revalidation.validation.errors,
        warnings: revalidation.validation.warnings,
      });
      return;
    }
  }

  // Execute action based on steps
  const results: Record<string, unknown> = {
    movementActual: [],
    narrative: '',
  };

  for (const step of plan.steps) {
    const actor = encounter.units.find((u) => u.id === step.actorId);
    if (!actor) continue;

    switch (step.type) {
      case 'move': {
        const targetPos = step.params.to as { x: number; y: number };
        const path = step.params.path as { x: number; y: number }[];

        // Update actor position
        actor.position = targetPos;
        actor.hasMoved = true;
        actor.movementRemaining = Math.max(0, actor.movementRemaining - (path?.length || 1) * 5);

        results.movementActual = path || [actor.position];
        results.narrative = `${actor.name} moves to position (${targetPos.x}, ${targetPos.y}).`;

        // Add log entry
        encounter.log.push({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          round: encounter.round,
          actorId: actor.id,
          actorName: actor.name,
          type: 'movement',
          message: `${actor.name} moved to (${targetPos.x}, ${targetPos.y})`,
        });
        break;
      }

      case 'attack': {
        const targetId = step.params.targetId as string;
        const target = encounter.units.find((u) => u.id === targetId);
        if (!target) break;

        // Roll attack (simplified - would use deterministic dice)
        const attackBonus = step.params.attackBonus as number;
        const attackRoll = Math.floor(Math.random() * 20) + 1 + attackBonus;
        const hit = attackRoll >= target.armorClass;

        results.attackRoll = {
          roll: [attackRoll - attackBonus],
          modifier: attackBonus,
          total: attackRoll,
          hit,
        };

        if (hit) {
          // Roll damage (simplified)
          const damageRoll = Math.floor(Math.random() * 8) + 1 + (step.params.damageBonus as number);
          target.hp = Math.max(0, target.hp - damageRoll);

          results.damageRoll = {
            roll: [damageRoll - (step.params.damageBonus as number)],
            modifier: step.params.damageBonus as number,
            total: damageRoll,
          };

          results.narrative = `${actor.name} attacks ${target.name} and hits! Deals ${damageRoll} damage.`;

          // Add log entries
          encounter.log.push({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            round: encounter.round,
            actorId: actor.id,
            actorName: actor.name,
            type: 'attack',
            message: `${actor.name} attacks ${target.name}: ${attackRoll} vs AC ${target.armorClass} - HIT!`,
          });

          encounter.log.push({
            id: `log-${Date.now() + 1}`,
            timestamp: Date.now() + 1,
            round: encounter.round,
            actorId: actor.id,
            actorName: actor.name,
            type: 'damage',
            message: `${target.name} takes ${damageRoll} damage (${target.hp}/${target.maxHp} HP remaining)`,
          });
        } else {
          results.narrative = `${actor.name} attacks ${target.name} but misses.`;

          encounter.log.push({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            round: encounter.round,
            actorId: actor.id,
            actorName: actor.name,
            type: 'attack',
            message: `${actor.name} attacks ${target.name}: ${attackRoll} vs AC ${target.armorClass} - MISS`,
          });
        }

        actor.hasActed = true;
        break;
      }

      case 'cast_spell': {
        // Spell casting implementation (simplified)
        results.narrative = `${actor.name} casts ${step.params.spellName || 'a spell'}!`;

        encounter.log.push({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          round: encounter.round,
          actorId: actor.id,
          actorName: actor.name,
          type: 'spell',
          message: `${actor.name} casts ${step.params.spellName || 'a spell'}`,
        });

        actor.hasActed = true;
        break;
      }

      case 'dash':
      case 'dodge':
      case 'help':
      case 'disengage': {
        results.narrative = `${actor.name} takes the ${step.type} action.`;

        encounter.log.push({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          round: encounter.round,
          actorId: actor.id,
          actorName: actor.name,
          type: 'system',
          message: `${actor.name} takes the ${step.type} action`,
        });

        actor.hasActed = true;
        break;
      }
    }
  }

  // Update encounter in database
  await updateEncounter(encounterId, {
    units: encounter.units,
    log: encounter.log,
  });

  // Clear cached plan
  planCache.delete(planId);

  res.json({
    success: true,
    results,
    updatedEncounter: encounter,
  });
});

export default router;
