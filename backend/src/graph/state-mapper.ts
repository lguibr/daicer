/**
 * State mapping layer for converting between Firestore GameState and phase-specific graph states
 */

import type { GamePhase } from '@/types/index';
import type { GameState, CharacterCreationState, GameplayState } from './state';

/**
 * Convert full GameState to CharacterCreationState
 */
export function toCharacterCreationState(gameState: GameState): CharacterCreationState {
  return {
    roomId: gameState.roomId,
    ownerId: gameState.ownerId,
    code: gameState.code,
    settings: gameState.settings,
    worldDescription: gameState.worldDescription,
    players: gameState.players,
    messages: gameState.messages,
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
  };
}

/**
 * Convert full GameState to GameplayState
 */
export function toGameplayState(gameState: GameState): GameplayState {
  return {
    roomId: gameState.roomId,
    ownerId: gameState.ownerId,
    code: gameState.code,
    settings: gameState.settings,
    worldDescription: gameState.worldDescription,
    players: gameState.players,
    messages: gameState.messages,
    creatures: gameState.creatures,
    waitingForAction: gameState.waitingForAction,
    combatState: gameState.combatState,
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
  };
}

/**
 * Convert graph state back to partial GameState for Firestore updates
 */
export function fromGraphState(
  graphState: CharacterCreationState | GameplayState,
  phase: GamePhase
): Partial<GameState> {
  let normalizedSettings: GameState['settings'];
  if (graphState.settings) {
    const language: 'en' | 'es' | 'pt-BR' = graphState.settings.language ?? 'en';
    normalizedSettings = {
      theme: graphState.settings.theme,
      setting: graphState.settings.setting,
      tone: graphState.settings.tone,
      playerCount: graphState.settings.playerCount,
      adventureLength: graphState.settings.adventureLength,
      difficulty: graphState.settings.difficulty,
      startingLevel: graphState.settings.startingLevel,
      attributePointBudget: graphState.settings.attributePointBudget,
      language,
    } as unknown as GameState['settings'];
  } else {
    normalizedSettings = null;
  }

  // Common fields present in all graph states
  const baseState: Partial<GameState> = {
    roomId: graphState.roomId,
    ownerId: graphState.ownerId,
    code: graphState.code,
    settings: normalizedSettings,
    worldDescription: graphState.worldDescription,
    players: graphState.players,
    messages: graphState.messages,
    updatedAt: graphState.updatedAt,
    phase,
  };

  // Add phase-specific fields
  if ('creatures' in graphState) {
    // GameplayState
    baseState.creatures = graphState.creatures;
    baseState.waitingForAction = graphState.waitingForAction;
    baseState.combatState = graphState.combatState;
  } else {
    // CharacterCreationState
    baseState.creatures = [];
    baseState.waitingForAction = false;
    baseState.combatState = null;
  }

  return baseState;
}

/**
 * Merge graph state updates back into full GameState
 */
export function mergeGraphStateIntoGameState(
  originalState: GameState,
  graphUpdate: Partial<CharacterCreationState> | Partial<GameplayState>
): GameState {
  return {
    ...originalState,
    ...graphUpdate,
    updatedAt: Date.now(),
  } as GameState;
}
