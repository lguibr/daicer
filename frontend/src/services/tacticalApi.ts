/**
 * @file frontend/src/services/tacticalApi.ts
 * @description API client for tactical combat endpoints
 */

import { apiRequest } from './api';
import type {
  ArenaInfo,
  TacticalEncounter,
  TacticalUnit,
  GridPosition,
  ActionPlan,
} from '../components/tactical/types';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface AddUnitPayload {
  type: 'character' | 'creature';
  characterId?: string;
  creatureId?: string;
  position: GridPosition;
}

export interface ActionPreview {
  success: boolean;
  planId: string;
  parsed: ActionPlan['parsed'];
  validation: ActionPlan['validation'];
  preview: {
    movementPath?: GridPosition[];
    affectedUnits: Array<{
      id: string;
      name: string;
      currentHP: string;
      predictedHP?: string;
      effect: string;
      predictedDamage?: ActionPlan['preview']['affectedUnits'][0]['predictedDamage'];
    }>;
    diceNeeded: string[];
    resourceCost?: string;
    hitChance?: number;
  };
  warnings: string[];
  suggestions: string[];
}

export interface ActionResult {
  success: boolean;
  results: {
    movementActual: GridPosition[];
    attackRoll?: {
      roll: number[];
      modifier: number;
      total: number;
      hit: boolean;
    };
    damageRoll?: {
      roll: number[];
      modifier: number;
      total: number;
    };
    narrative: string;
  };
  updatedEncounter: TacticalEncounter;
}

// ============================================================================
// Arena Management
// ============================================================================

/**
 * List all available tactical arenas
 */
export async function listArenas(): Promise<ArenaInfo[]> {
  return apiRequest<ArenaInfo[]>('/api/tactical/arenas');
}

// ============================================================================
// Encounter Management
// ============================================================================

/**
 * Create a new tactical encounter
 */
export async function createEncounter(arenaId: string, name: string): Promise<TacticalEncounter> {
  return apiRequest<TacticalEncounter>('/api/tactical/encounter', {
    method: 'POST',
    body: JSON.stringify({ arenaId, name }),
  });
}

/**
 * Get an existing encounter by ID
 */
export async function getEncounter(encounterId: string): Promise<TacticalEncounter> {
  return apiRequest<TacticalEncounter>(`/api/tactical/encounter/${encounterId}`);
}

// ============================================================================
// Unit Management
// ============================================================================

/**
 * Add a unit to an encounter
 */
export async function addUnit(encounterId: string, payload: AddUnitPayload): Promise<TacticalUnit> {
  return apiRequest<TacticalUnit>(`/api/tactical/encounter/${encounterId}/units`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update a unit's properties
 */
export async function updateUnit(
  encounterId: string,
  unitId: string,
  updates: Partial<TacticalUnit>
): Promise<TacticalUnit> {
  return apiRequest<TacticalUnit>(`/api/tactical/encounter/${encounterId}/units/${unitId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Remove a unit from an encounter
 */
export async function removeUnit(encounterId: string, unitId: string): Promise<void> {
  return apiRequest<void>(`/api/tactical/encounter/${encounterId}/units/${unitId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Combat Flow
// ============================================================================

/**
 * Start combat (roll initiative)
 */
export async function startCombat(encounterId: string): Promise<TacticalEncounter> {
  return apiRequest<TacticalEncounter>(`/api/tactical/encounter/${encounterId}/start`, {
    method: 'POST',
  });
}

// ============================================================================
// Action System
// ============================================================================

/**
 * Preview an action before execution
 */
export async function previewAction(encounterId: string, command: string): Promise<ActionPreview> {
  return apiRequest<ActionPreview>(`/api/tactical/encounter/${encounterId}/preview`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
}

/**
 * Execute a previewed action
 */
export async function executeAction(
  encounterId: string,
  planId: string,
  confirmed: boolean = true,
  overrides?: { allowFriendlyFire?: boolean }
): Promise<ActionResult> {
  return apiRequest<ActionResult>(`/api/tactical/encounter/${encounterId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ planId, confirmed, overrides }),
  });
}
