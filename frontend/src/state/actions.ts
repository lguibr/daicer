import { Player, Message, WorldSettings, Creature, Language } from '../types/shared';

export const ActionType = {
  // Language
  SET_LANGUAGE: 'SET_LANGUAGE',
  // Game Flow
  CREATE_WORLD_START: 'CREATE_WORLD_START',
  CREATE_WORLD_SUCCESS: 'CREATE_WORLD_SUCCESS',
  ADD_CHARACTER: 'ADD_CHARACTER',
  START_GAME: 'START_GAME',
  // Turn Processing
  PROCESS_TURN_START: 'PROCESS_TURN_START',
  PROCESS_TURN_SUCCESS: 'PROCESS_TURN_SUCCESS',
  SET_PLAYER_ACTION: 'SET_PLAYER_ACTION',
  // DM Tool Actions
  UPDATE_CHARACTER_ATTRIBUTE: 'UPDATE_CHARACTER_ATTRIBUTE',
  CREATE_CREATURE: 'CREATE_CREATURE',
  // Generic
  SET_ERROR: 'SET_ERROR',
} as const;

export type DMUpdate =
  | { type: typeof ActionType.CREATE_CREATURE; payload: Creature }
  | {
      type: typeof ActionType.UPDATE_CHARACTER_ATTRIBUTE;
      payload: { characterName: string; attribute: keyof Creature | keyof Player['character']; value: number };
    };

export type AppAction =
  | { type: typeof ActionType.SET_LANGUAGE; payload: Language }
  | { type: typeof ActionType.CREATE_WORLD_START }
  | { type: typeof ActionType.CREATE_WORLD_SUCCESS; payload: { settings: WorldSettings; description: string } }
  | { type: typeof ActionType.ADD_CHARACTER; payload: Player }
  | { type: typeof ActionType.START_GAME }
  | { type: typeof ActionType.PROCESS_TURN_START }
  | { type: typeof ActionType.PROCESS_TURN_SUCCESS; payload: { messages: Message[]; updates: DMUpdate[] } }
  | { type: typeof ActionType.SET_PLAYER_ACTION; payload: { playerId: string; action: string } }
  | {
      type: typeof ActionType.UPDATE_CHARACTER_ATTRIBUTE;
      payload: { characterName: string; attribute: keyof Creature | keyof Player['character']; value: number };
    }
  | { type: typeof ActionType.CREATE_CREATURE; payload: Creature }
  | { type: typeof ActionType.SET_ERROR; payload: string | null };
