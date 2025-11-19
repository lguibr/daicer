/**
 * @file backend/src/graph/nodes/tactical-command.ts
 * @description LangGraph node for processing tactical natural language commands
 */

import { task } from '@langchain/langgraph';
import type { CombatState } from '../state.js';
import { parseCommand } from '../../tactical/llm/commandParser.js';
import { planAction } from '../../tactical/services/actionPlanner.js';

/**
 * Task: Parse natural language tactical command
 * Wrapped in task() for deterministic replay
 */
const parseCommandTask = task(
  'parseTacticalCommand',
  async (params: {
    command: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encounter: any;
  }) => {
    const { command, encounter } = params;
    return parseCommand(command, encounter);
  }
);

/**
 * Task: Validate and plan tactical action
 * Wrapped in task() for deterministic replay
 */
const validateActionTask = task(
  'validateTacticalAction',
  async (params: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedCommand: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encounter: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arena: any;
  }) => {
    const { parsedCommand, encounter, arena } = params;
    return planAction(parsedCommand, encounter, arena);
  }
);

/**
 * Build RAG context for command parsing (reserved for future use)
 */
// function _buildRAGContext(state: CombatState): string {
//   const activeChar = state.characters.find((c) => c.id === state.activeCharacterId);
//   if (!activeChar) return '';

//   const context = [
//     `Active character: ${activeChar.name}`,
//     `Position: (${activeChar.position.x}, ${activeChar.position.y})`,
//     `HP: ${activeChar.hp}/${activeChar.maxHp}`,
//     `Movement remaining: ${activeChar.movementRemaining}ft`,
//     `Has acted: ${activeChar.hasActed}`,
//     `Has bonus action: ${activeChar.hasBonusAction}`,
//     `Has reaction: ${activeChar.hasReaction}`,
//   ];

//   if (activeChar.conditions.length > 0) {
//     context.push(`Conditions: ${activeChar.conditions.map((c) => c.type).join(', ')}`);
//   }

//   // Add nearby units
//   const nearby = state.characters.filter((c) => {
//     if (c.id === activeChar.id) return false;
//     const dx = Math.abs(c.position.x - activeChar.position.x);
//     const dy = Math.abs(c.position.y - activeChar.position.y);
//     return dx <= 3 && dy <= 3;
//   });

//   if (nearby.length > 0) {
//     context.push('Nearby units:');
//     nearby.forEach((unit) => {
//       context.push(`  - ${unit.name} at (${unit.position.x}, ${unit.position.y})`);
//     });
//   }

//   return context.join('\n');
// }

/**
 * Tactical command processing node
 * Returns partial state update for LangGraph merge
 */
export async function tacticalCommandNode(state: CombatState): Promise<Partial<CombatState>> {
  // Skip if no pending command or not in tactical mode
  if (!state.pendingNaturalLanguageCommand || !state.tacticalMode) {
    return {};
  }

  // Parse command with LLM
  const parsed = await parseCommandTask({
    command: state.pendingNaturalLanguageCommand,
    encounter: state.tacticalArena,
  });

  // Validate and create action plan
  await validateActionTask({
    parsedCommand: parsed,
    encounter: state.tacticalArena,
    arena: state.tacticalArena,
  });

  // Return partial update
  return {
    pendingNaturalLanguageCommand: null,
    // Store parsed command and action plan in combat log or separate field
    log: [
      ...state.log,
      {
        id: `cmd-${Date.now()}`,
        timestamp: Date.now(),
        message: `Processing command: ${state.pendingNaturalLanguageCommand}`,
        type: 'info' as const,
        relatedRolls: [],
      },
    ],
  };
}

/**
 * Tactical execute node
 * Executes the validated action plan
 */
export async function tacticalExecuteNode(state: CombatState): Promise<Partial<CombatState>> {
  // TODO: Implement action execution logic
  // This would handle movement, attacks, spell casting, etc.
  // For now, just log that we would execute

  return {
    log: [
      ...state.log,
      {
        id: `exec-${Date.now()}`,
        timestamp: Date.now(),
        message: 'Action executed successfully',
        type: 'info' as const,
        relatedRolls: [],
      },
    ],
  };
}
