/**
 * Initiative Node - Rolls initiative for all characters and establishes turn order
 */

import type { CombatState, CombatCharacter } from '@/graph/state';
import { getAbilityModifier } from '../state';
import { DiceRoller } from '../dice';

export interface InitiativeNodeInput {
  characters: CombatCharacter[];
  diceRoller: DiceRoller;
}

export function initiativeNode(_state: CombatState, input: InitiativeNodeInput): Partial<CombatState> {
  const { characters, diceRoller } = input;

  // Roll initiative for each character
  const charactersWithInitiative = characters.map((char) => {
    const dexMod = getAbilityModifier(char.dexterity);
    const initiativeRoll = diceRoller.rollInitiative(dexMod, `${char.name} initiative`);

    return {
      ...char,
      initiative: initiativeRoll.finalResult,
      movementRemaining: char.speed,
      hasMoved: false,
      hasActed: false,
      hasReaction: true,
      hasBonusAction: true,
    };
  });

  // Sort by initiative (highest first)
  const sorted = [...charactersWithInitiative].sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    // Tiebreaker: higher dexterity wins
    return b.dexterity - a.dexterity;
  });

  const turnOrder = sorted.map((c) => c.id);
  const activeCharacterId = turnOrder[0] ?? null;

  // Create initiative log entries
  const initiativeLog = sorted.map((char) => ({
    id: `log-initiative-${char.id}-${Date.now()}`,
    timestamp: Date.now(),
    message: `${char.name} rolled ${char.initiative} for initiative`,
    type: 'info' as const,
    relatedRolls: [],
  }));

  const startLog = {
    id: `log-start-${Date.now()}`,
    timestamp: Date.now(),
    message: '⚔️ **Combat begins!**',
    type: 'info' as const,
    relatedRolls: [],
  };

  return {
    characters: sorted,
    turnOrder,
    activeCharacterId,
    round: 1,
    phase: 'turn_start',
    log: [startLog, ...initiativeLog],
    diceHistory: diceRoller.getHistory().filter((r) => r !== undefined),
  };
}
