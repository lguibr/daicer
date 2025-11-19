/**
 * @file backend/src/tactical/llm/commandParser.ts
 * @description LLM-powered natural language command parser for tactical combat
 */

import { z } from 'zod';
import { getLLMModel } from '../../config/langchain.js';
import type { GridPosition } from '../../types/spells.js';
import type { TacticalEncounter, TacticalUnit } from '../types/unit.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Command Intent Types
// ============================================================================

export type CommandIntent = 'move' | 'attack' | 'cast_spell' | 'dash' | 'dodge' | 'help' | 'disengage' | 'hide';

// ============================================================================
// Parsed Command Schema
// ============================================================================

const GridPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export const ParsedCommandSchema = z.object({
  actorName: z.string().describe('Name of the unit performing the action'),
  actorId: z.string().nullable().describe('Resolved unit ID if found, null if ambiguous'),
  intent: z
    .enum(['move', 'attack', 'cast_spell', 'dash', 'dodge', 'help', 'disengage', 'hide'])
    .describe('The action the actor intends to take'),
  target: z
    .object({
      unitName: z.string().optional().describe('Name of target unit if specified'),
      unitId: z.string().nullable().describe('Resolved target unit ID'),
      position: GridPositionSchema.optional().describe('Target position on grid'),
      area: z.array(GridPositionSchema).optional().describe('Area of effect positions'),
      descriptor: z.string().optional().describe('Target descriptor like "nearest enemy" or "group of goblins"'),
    })
    .optional()
    .describe('Target information'),
  spellName: z.string().optional().describe('Name of spell to cast'),
  spellId: z.string().nullable().describe('Resolved spell ID from catalog'),
  modifiers: z.array(z.string()).optional().describe('Action modifiers like "carefully", "recklessly", "stealthily"'),
  confidence: z.number().min(0).max(1).describe('Confidence in parsing (0-1)'),
  ambiguities: z.array(z.string()).optional().describe('Ambiguous parts of the command'),
});

export type ParsedCommand = z.infer<typeof ParsedCommandSchema>;

// ============================================================================
// Command Parser
// ============================================================================

/**
 * Build context string for LLM about current encounter state
 */
function buildEncounterContext(encounter: TacticalEncounter): string {
  const units = encounter.units
    .map(
      (u) =>
        `- ${u.name} (ID: ${u.id}, ${u.allegiance}, HP: ${u.hp}/${u.maxHp}, Position: ${u.position.x},${u.position.y})`
    )
    .join('\n');

  return `
**Current Encounter State:**
Round: ${encounter.round}
Active Unit: ${encounter.activeUnitId ? encounter.units.find((u) => u.id === encounter.activeUnitId)?.name : 'None'}

**Units in Combat:**
${units}

**Available Spells (common examples):**
- Fireball (id: fireball)
- Magic Missile (id: magic-missile)
- Healing Word (id: healing-word)
- Shield (id: shield)
- Fire Bolt (id: fire-bolt)
`;
}

/**
 * Parse natural language command into structured format
 */
export async function parseCommand(commandText: string, encounter: TacticalEncounter): Promise<ParsedCommand> {
  const model = await getLLMModel();
  const structuredModel = model.withStructuredOutput<ParsedCommand>(ParsedCommandSchema);

  const encounterContext = buildEncounterContext(encounter);

  const systemPrompt = `You are a D&D 5e combat command parser. Parse natural language commands into structured actions.

Your task:
1. Identify the actor (who is performing the action)
2. Determine the intent (what they want to do)
3. Identify the target (who/what/where they're targeting)
4. Extract any spell names and modifiers

Rules:
- Match unit names case-insensitively and handle partial matches
- Set actorId to null if actor name doesn't match any unit
- Set unitId/spellId to null if not found in context
- Use "nearest enemy" descriptors when position isn't specified
- Extract modifiers like "carefully" (avoiding friendly fire) or "recklessly" (power attack)
- Set confidence based on how clear the command is (0.0 to 1.0)
- Note ambiguities if command is unclear`;

  const userPrompt = `${encounterContext}

**Player Command:**
"${commandText}"

Parse this command into a structured action. Match names to units from the encounter. If a spell is mentioned, try to match it to common spell IDs.`;

  try {
    logger.info('Parsing tactical command', { command: commandText });
    const parsed = await structuredModel.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Resolve actor ID
    if (!parsed.actorId) {
      const actorMatch = encounter.units.find((u) => u.name.toLowerCase() === parsed.actorName.toLowerCase());
      if (actorMatch) {
        parsed.actorId = actorMatch.id;
      }
    }

    // Resolve target unit ID
    if (parsed.target?.unitName && !parsed.target.unitId) {
      const targetMatch = encounter.units.find((u) => u.name.toLowerCase() === parsed.target!.unitName!.toLowerCase());
      if (targetMatch) {
        parsed.target.unitId = targetMatch.id;
      }
    }

    logger.info('Command parsed successfully', {
      intent: parsed.intent,
      actorId: parsed.actorId,
      confidence: parsed.confidence,
    });

    return parsed;
  } catch (error) {
    logger.error('Failed to parse command', { error, command: commandText });

    // Fallback: return low-confidence parse
    return {
      actorName: 'Unknown',
      actorId: null,
      intent: 'move',
      spellId: null,
      confidence: 0.1,
      ambiguities: ['Failed to parse command - please be more specific'],
    };
  }
}

/**
 * Resolve "nearest" descriptors to actual positions
 */
export function resolveNearestTarget(
  from: GridPosition,
  units: TacticalUnit[],
  allegiance: 'player' | 'enemy' | 'any' = 'any'
): TacticalUnit | null {
  const candidates = units.filter((u) => {
    if (allegiance === 'any') return true;
    return u.allegiance === allegiance;
  });

  if (candidates.length === 0) return null;

  // Find closest by Manhattan distance
  let nearest: TacticalUnit | null = null;
  let minDist = Infinity;

  for (const unit of candidates) {
    const dist = Math.abs(unit.position.x - from.x) + Math.abs(unit.position.y - from.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = unit;
    }
  }

  return nearest;
}

/**
 * Validate parsed command against encounter state
 */
export interface CommandValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export function validateParsedCommand(parsed: ParsedCommand, encounter: TacticalEncounter): CommandValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check actor exists
  if (!parsed.actorId) {
    errors.push(`Could not find unit "${parsed.actorName}" in combat`);
    const similarNames = encounter.units
      .filter((u) => u.name.toLowerCase().includes(parsed.actorName.toLowerCase().slice(0, 3)))
      .map((u) => u.name);
    if (similarNames.length > 0) {
      suggestions.push(`Did you mean: ${similarNames.join(', ')}?`);
    }
  }

  // Check it's actor's turn (if combat started)
  if (encounter.phase === 'in_progress' && parsed.actorId !== encounter.activeUnitId) {
    const activeUnit = encounter.units.find((u) => u.id === encounter.activeUnitId);
    warnings.push(`It's ${activeUnit?.name || 'another unit'}'s turn, not ${parsed.actorName}'s`);
  }

  // Check target for attack/spell
  if ((parsed.intent === 'attack' || parsed.intent === 'cast_spell') && !parsed.target) {
    errors.push('No target specified for attack/spell');
  }

  // Check spell name resolution
  if (parsed.intent === 'cast_spell' && parsed.spellName && !parsed.spellId) {
    warnings.push(`Could not find spell "${parsed.spellName}" in catalog`);
    suggestions.push('Check spell name spelling or use spell ID directly');
  }

  // Low confidence warning
  if (parsed.confidence < 0.6) {
    warnings.push('Command parsing had low confidence - please be more specific');
  }

  // Check for ambiguities
  if (parsed.ambiguities && parsed.ambiguities.length > 0) {
    warnings.push(...parsed.ambiguities);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Convert ParsedCommand to format expected by action planner
 */
export function normalizeCommand(parsed: ParsedCommand): ParsedCommand {
  return {
    ...parsed,
    actorName: parsed.actorName,
    actorId: parsed.actorId || '',
    intent: parsed.intent,
  };
}
