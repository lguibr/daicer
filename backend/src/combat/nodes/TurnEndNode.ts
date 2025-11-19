/**
 * Turn End Node - Advances to the next character's turn
 */

import type { CombatState } from '@/graph/state';
import { CombatLogEntrySchema } from '@/graph/state';
import type * as z from 'zod';
import { isAlive } from '../state';

type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;

export function turnEndNode(state: CombatState): Partial<CombatState> {
  if (state.isCombatOver) {
    return { phase: 'combat_end' };
  }

  // Find current index in turn order
  const currentIndex = state.turnOrder.findIndex((id) => id === state.activeCharacterId);
  if (currentIndex === -1) {
    return { phase: 'combat_end' };
  }

  // Find next alive character
  let nextIndex = (currentIndex + 1) % state.turnOrder.length;
  let attempts = 0;
  const maxAttempts = state.turnOrder.length;

  while (attempts < maxAttempts) {
    const nextCharId = state.turnOrder[nextIndex];
    const nextChar = state.characters.find((c) => c.id === nextCharId);

    if (nextChar && isAlive(nextChar)) {
      break;
    }

    nextIndex = (nextIndex + 1) % state.turnOrder.length;
    attempts += 1;
  }

  if (attempts >= maxAttempts) {
    // No alive characters found - combat should be over
    return {
      phase: 'combat_end',
      isCombatOver: true,
    };
  }

  const nextCharacterId = state.turnOrder[nextIndex];
  const isNewRound = nextIndex <= currentIndex;
  const newRound = isNewRound ? state.round + 1 : state.round;

  // Reset reactions at start of character's turn
  const updatedCharacters = state.characters.map((c) => (c.id === nextCharacterId ? { ...c, hasReaction: true } : c));

  const logs: CombatLogEntry[] = [];
  if (isNewRound) {
    logs.push({
      id: `log-round-${Date.now()}`,
      timestamp: Date.now(),
      message: `\n═══ **Round ${newRound}** ═══`,
      type: 'round' as const,
      relatedRolls: [],
    });
  }

  return {
    characters: updatedCharacters,
    activeCharacterId: nextCharacterId,
    round: newRound,
    log: [...state.log, ...logs],
    phase: 'turn_start',
  };
}
