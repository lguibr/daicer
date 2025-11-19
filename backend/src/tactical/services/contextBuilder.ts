/**
 * @file backend/src/tactical/services/contextBuilder.ts
 * @description RAG context builder for tactical combat LLM interactions
 */

import type { TacticalEncounter, TacticalUnit, TacticalLogEntry } from '../types/unit.js';
import type { TacticalArena } from '../types/arena.js';
import { TerrainType } from '../types/arena.js';
import { getRuleContext } from '../../services/rag.js';
import { getArenaById } from '../arenas/generator.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Types
// ============================================================================

export interface TacticalContext {
  arena: {
    name: string;
    description: string;
    dimensions: { width: number; height: number };
    terrainSummary: string;
    notableFeatures: string[];
  };
  units: Array<{
    id: string;
    name: string;
    allegiance: string;
    hp: string;
    position: string;
    status: string;
    conditions: string[];
    capabilities: string[];
  }>;
  combat: {
    round: number;
    phase: string;
    activeUnit: string | null;
    turnOrder: string[];
  };
  history: string[];
  relevantRules: string;
}

// ============================================================================
// Terrain Analysis
// ============================================================================

/**
 * Generate summary of terrain features in the arena
 */
function summarizeTerrain(arena: TacticalArena): string {
  const terrainCounts: Partial<Record<TerrainType, number>> = {};

  for (const cell of arena.cells) {
    terrainCounts[cell.terrain] = (terrainCounts[cell.terrain] || 0) + 1;
  }

  const features: string[] = [];

  for (const [terrain, count] of Object.entries(terrainCounts)) {
    if (terrain === 'open') continue; // Skip open terrain in summary

    const percentage = Math.round((count / arena.cells.length) * 100);
    if (percentage >= 5) {
      // Only mention terrain types that cover >=5% of arena
      features.push(`${terrain.replace('_', ' ')} (${percentage}% coverage)`);
    }
  }

  return features.length > 0 ? features.join(', ') : 'Mostly open terrain';
}

/**
 * Identify notable terrain features for tactical planning
 */
function identifyNotableFeatures(arena: TacticalArena): string[] {
  const features: string[] = [];

  // Count walls for choke points
  const wallCount = arena.cells.filter((c) => c.terrain === 'wall').length;
  const wallPercentage = (wallCount / arena.cells.length) * 100;

  if (wallPercentage > 20) {
    features.push('Multiple walls creating choke points');
  }

  // Check for cover
  const coverCount = arena.cells.filter(
    (c) => c.terrain === TerrainType.COVER_HALF || c.terrain === TerrainType.COVER_FULL
  ).length;

  if (coverCount > 5) {
    features.push('Abundant cover for defensive positioning');
  }

  // Check for difficult terrain
  const difficultCount = arena.cells.filter((c) => c.terrain === TerrainType.DIFFICULT).length;

  if (difficultCount > 10) {
    features.push('Significant difficult terrain affecting movement');
  }

  // Check for hazards
  const chasmCount = arena.cells.filter((c) => c.terrain === TerrainType.HAZARD).length;

  if (chasmCount > 0) {
    features.push(`Dangerous chasms (${chasmCount} squares)`);
  }

  // Check for elevation
  const elevatedCount = arena.cells.filter(
    (c) => c.terrain === TerrainType.ELEVATION_HIGH || c.terrain === TerrainType.ELEVATION_LOW
  ).length;

  if (elevatedCount > 0) {
    features.push('Elevated positions for tactical advantage');
  }

  return features;
}

// ============================================================================
// Unit Status Analysis
// ============================================================================

/**
 * Generate human-readable status for a unit
 */
function getUnitStatus(unit: TacticalUnit): string {
  const statuses: string[] = [];

  // Action economy
  if (unit.hasAction && unit.movementRemaining > 0) {
    statuses.push('Full turn available');
  } else if (unit.hasAction) {
    statuses.push('Can act');
  } else if (unit.movementRemaining > 0) {
    statuses.push('Can move');
  } else {
    statuses.push('Turn used');
  }

  // Health status
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  if (hpPercent <= 0) {
    statuses.push('Unconscious');
  } else if (hpPercent <= 25) {
    statuses.push('Critically wounded');
  } else if (hpPercent <= 50) {
    statuses.push('Bloodied');
  }

  // Temp HP
  if (unit.tempHp > 0) {
    statuses.push(`+${unit.tempHp} temp HP`);
  }

  return statuses.join(', ');
}

/**
 * List unit capabilities for context
 */
function getUnitCapabilities(unit: TacticalUnit): string[] {
  const caps: string[] = [];

  // Movement
  caps.push(`${unit.speed} ft speed`);

  // Reach
  if (unit.reach > 5) {
    caps.push(`${unit.reach} ft reach`);
  }

  // Spellcasting
  if (unit.spellSlots && unit.spellSlots.length > 0) {
    const availableSlots = unit.spellSlots.filter((s) => s.used < s.total);
    if (availableSlots.length > 0) {
      caps.push(`Spellcaster (levels ${availableSlots.map((s) => s.level).join(', ')})`);
    }
  }

  // Behavior tags
  if (unit.behaviorTags && unit.behaviorTags.length > 0) {
    caps.push(...unit.behaviorTags);
  }

  return caps;
}

// ============================================================================
// History Formatting
// ============================================================================

/**
 * Format combat log entries for LLM context
 */
function formatLogHistory(log: TacticalLogEntry[], count: number = 5): string[] {
  // Get the last N entries
  const recentEntries = log.slice(-count);

  return recentEntries.map((entry) => {
    const actor = entry.actorName ? `${entry.actorName}: ` : '';
    return `[Round ${entry.round}] ${actor}${entry.message}`;
  });
}

// ============================================================================
// Main Context Builder
// ============================================================================

/**
 * Build comprehensive tactical context for LLM
 */
export async function buildTacticalContext(
  encounter: TacticalEncounter,
  arenaIdOrArena?: string | TacticalArena,
  ruleQuery?: string
): Promise<TacticalContext> {
  // Load arena if needed
  let arena: TacticalArena;
  if (arenaIdOrArena) {
    if (typeof arenaIdOrArena === 'string') {
      const loaded = getArenaById(arenaIdOrArena);
      if (!loaded) {
        throw new Error(`Arena not found: ${arenaIdOrArena}`);
      }
      arena = loaded;
    } else {
      arena = arenaIdOrArena;
    }
  } else {
    // Try to load arena from encounter
    const loaded = getArenaById(encounter.arenaId);
    if (!loaded) {
      throw new Error(`Arena not found: ${encounter.arenaId}`);
    }
    arena = loaded;
  }

  // Build arena context
  const arenaContext = {
    name: arena.name,
    description: arena.description,
    dimensions: {
      width: arena.width,
      height: arena.height,
    },
    terrainSummary: summarizeTerrain(arena),
    notableFeatures: identifyNotableFeatures(arena),
  };

  // Build unit contexts
  const unitContexts = encounter.units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    allegiance: unit.allegiance,
    hp: `${unit.hp}/${unit.maxHp}`,
    position: `(${unit.position.x}, ${unit.position.y})`,
    status: getUnitStatus(unit),
    conditions: unit.conditions,
    capabilities: getUnitCapabilities(unit),
  }));

  // Build combat state context
  const activeUnit = encounter.activeUnitId
    ? encounter.units.find((u) => u.id === encounter.activeUnitId)?.name || null
    : null;

  const combatContext = {
    round: encounter.round,
    phase: encounter.phase,
    activeUnit,
    turnOrder: encounter.turnOrder
      .map((id) => encounter.units.find((u) => u.id === id)?.name)
      .filter((n): n is string => n !== undefined),
  };

  // Build history context
  const historyContext = formatLogHistory(encounter.log, 5);

  // Fetch relevant D&D rules via RAG
  let relevantRules = '';
  try {
    const query = ruleQuery || 'tactical combat movement attack actions';
    const ruleContext = await getRuleContext(query, 3, 'combat');
    relevantRules = ruleContext;
  } catch (error) {
    logger.warn('Failed to fetch rule context', { error });
    relevantRules = 'D&D 5e basic rules: 30 ft movement, standard action, bonus action, reaction per turn.';
  }

  return {
    arena: arenaContext,
    units: unitContexts,
    combat: combatContext,
    history: historyContext,
    relevantRules,
  };
}

/**
 * Format tactical context as string for LLM prompts
 */
export function formatContextForPrompt(context: TacticalContext): string {
  let prompt = '';

  // Arena
  prompt += `## Arena: ${context.arena.name}\n`;
  prompt += `${context.arena.description}\n`;
  prompt += `Size: ${context.arena.dimensions.width}x${context.arena.dimensions.height} squares\n`;
  prompt += `Terrain: ${context.arena.terrainSummary}\n`;

  if (context.arena.notableFeatures.length > 0) {
    prompt += `Features: ${context.arena.notableFeatures.join(', ')}\n`;
  }

  prompt += '\n';

  // Combat State
  prompt += `## Combat State\n`;
  prompt += `Round: ${context.combat.round}, Phase: ${context.combat.phase}\n`;

  if (context.combat.activeUnit) {
    prompt += `Active Unit: ${context.combat.activeUnit}\n`;
  }

  prompt += `Turn Order: ${context.combat.turnOrder.join(' → ')}\n\n`;

  // Units
  prompt += `## Units\n`;
  for (const unit of context.units) {
    prompt += `**${unit.name}** (${unit.allegiance})\n`;
    prompt += `  - HP: ${unit.hp}, Position: ${unit.position}\n`;
    prompt += `  - Status: ${unit.status}\n`;

    if (unit.conditions.length > 0) {
      prompt += `  - Conditions: ${unit.conditions.join(', ')}\n`;
    }

    if (unit.capabilities.length > 0) {
      prompt += `  - Capabilities: ${unit.capabilities.join(', ')}\n`;
    }

    prompt += '\n';
  }

  // History
  if (context.history.length > 0) {
    prompt += `## Recent Combat Log\n`;
    for (const entry of context.history) {
      prompt += `- ${entry}\n`;
    }
    prompt += '\n';
  }

  // Rules
  prompt += `## Relevant Rules\n`;
  prompt += context.relevantRules;
  prompt += '\n';

  return prompt;
}

/**
 * Build context specifically for command parsing
 */
export async function buildCommandParsingContext(encounter: TacticalEncounter, arena?: TacticalArena): Promise<string> {
  const context = await buildTacticalContext(encounter, arena, 'parsing player commands and resolving targets');

  // Simplified format for command parsing
  let prompt = `Current Combat Situation:\n`;
  prompt += `Round ${context.combat.round}, Active: ${context.combat.activeUnit || 'None'}\n\n`;

  prompt += `Units:\n`;
  for (const unit of context.units) {
    prompt += `- ${unit.name} (${unit.allegiance}): HP ${unit.hp} at ${unit.position}\n`;
  }

  return prompt;
}

/**
 * Build context for action validation
 */
export async function buildValidationContext(encounter: TacticalEncounter, arena?: TacticalArena): Promise<string> {
  const context = await buildTacticalContext(
    encounter,
    arena,
    'combat actions validation movement range line of sight'
  );

  return formatContextForPrompt(context);
}
