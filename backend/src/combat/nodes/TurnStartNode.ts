/**
 * Turn Start Node - Resets turn-based resources and checks for turn start effects
 */

import type { CombatState, CombatCharacter } from '@/graph/state';

export function turnStartNode(state: CombatState): Partial<CombatState> {
  const { activeCharacterId } = state;
  if (!activeCharacterId) {
    return { phase: 'combat_end' };
  }

  const activeChar = state.characters.find((c) => c.id === activeCharacterId);
  if (!activeChar) {
    return { phase: 'combat_end' };
  }

  // Reset turn-based resources
  const updatedCharacter: CombatCharacter = {
    ...activeChar,
    hasMoved: false,
    hasActed: false,
    hasBonusAction: true,
    movementRemaining: activeChar.speed,
  };

  // Apply exhaustion speed reduction if needed
  const exhaustionLevel = activeChar.conditions.find((c) => c.type === 'exhaustion')?.level ?? 0;
  if (exhaustionLevel >= 2) {
    updatedCharacter.movementRemaining = Math.floor(updatedCharacter.movementRemaining / 2);
  }

  const updatedCharacters = state.characters.map((c) => (c.id === activeCharacterId ? updatedCharacter : c));

  // Check if character is surprised (can't act on first turn)
  // TODO: Implement surprise mechanics

  // Log turn start
  const turnLog = {
    id: `log-turn-start-${Date.now()}`,
    timestamp: Date.now(),
    message: `--- **${activeChar.name}'s turn** ---`,
    type: 'turn' as const,
    relatedRolls: [],
  };

  return {
    characters: updatedCharacters,
    log: [...state.log, turnLog],
    phase: 'action_selection',
  };
}
