/**
 * Combat Coordinator Node
 * Detects combat initiation and coordinates combat flow
 */

import { logger } from '@/utils/logger';
import type { Creature, Player } from '@/types/index';
import type { GameplayState } from '../state';
import { hasActiveCombat } from '../state';

/**
 * Combat coordinator node (wrapped with tracing)
 * Routes between combat and normal gameplay based on state
 */
export const combatCoordinatorNode = (state: GameplayState): Partial<GameplayState> => {
  // Check if we're already in combat
  if (hasActiveCombat(state)) {
    logger.info('Combat is active');
    return {};
  }

  // Check if combat state exists but is over
  const { combatState } = state;
  if (combatState && combatState.isCombatOver) {
    logger.info('Combat has ended, returning to gameplay');

    // Update creature HP based on combat results if they exist in creatures
    const creatures = state.creatures as Creature[];
    const updatedCreatures = creatures.map((creature) => {
      const combatChar = combatState.characters.find((c: any) => !c.isPlayer && c.name === creature.name);

      if (combatChar) {
        return {
          ...creature,
          hp: combatChar.hp,
        };
      }
      return creature;
    });

    return {
      combatState: null,
      creatures: updatedCreatures,
    };
  }

  // Not in combat, stay in gameplay
  return {};
};

/**
 * Check if player actions indicate combat should start
 * This is a helper function that can be called before turn processing
 */
export function shouldStartCombat(state: GameplayState): boolean {
  // Check if any player action mentions combat keywords
  const combatKeywords = ['attack', 'strike', 'fight', 'combat', 'hit', 'shoot', 'stab', 'slash'];

  const players = state.players as Player[];
  return players.some((p) => {
    if (!p.action) return false;
    const action = p.action.toLowerCase();
    return combatKeywords.some((keyword) => action.includes(keyword));
  });
}
