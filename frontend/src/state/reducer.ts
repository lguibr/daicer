import { GamePhase, type Message } from '../types/shared';
import { AppState } from './types';
import { AppAction, ActionType } from './actions';

export const initialState: AppState = {
  language: 'en',
  gamePhase: GamePhase.SETUP,
  worldSettings: null,
  worldDescription: '',
  players: [],
  messages: [],
  creatures: [],
  isLoading: false,
  error: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case ActionType.SET_LANGUAGE:
      return { ...state, language: action.payload };

    case ActionType.CREATE_WORLD_START:
      return { ...state, isLoading: true, error: null };

    case ActionType.CREATE_WORLD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        worldDescription: action.payload.description,
        worldSettings: action.payload.settings,
        gamePhase: GamePhase.CHARACTER_CREATION,
      };

    case ActionType.ADD_CHARACTER:
      return { ...state, players: [...state.players, action.payload] };

    case ActionType.START_GAME:
      return { ...state, gamePhase: GamePhase.GAMEPLAY, messages: [] };

    case ActionType.SET_PLAYER_ACTION:
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId ? { ...p, action: action.payload.action } : p
        ),
      };

    case ActionType.PROCESS_TURN_START: {
      const playerActionMessages: Message[] = state.players.map((p) => ({
        id: `msg-${Date.now()}-${p.id}`,
        sender: p.character.name,
        text: p.action || 'does nothing.',
        timestamp: Date.now(),
      }));
      return {
        ...state,
        isLoading: true,
        error: null,
        messages: [...state.messages, ...playerActionMessages],
      };
    }
    case ActionType.PROCESS_TURN_SUCCESS: {
      // This is a complex action, it can update multiple parts of the state
      const newState = {
        ...state,
        isLoading: false,
        messages: [...state.messages, ...action.payload.messages],
        players: state.players.map((p) => ({ ...p, action: null })),
      };

      // Process all state updates from the DM's function calls
      action.payload.updates.forEach((update) => {
        if (update.type === ActionType.CREATE_CREATURE) {
          const existing = newState.creatures.find((c) => c.name === update.payload.name);
          if (!existing) {
            newState.creatures.push({ ...update.payload, maxHp: update.payload.hp });
          }
        }
        if (update.type === ActionType.UPDATE_CHARACTER_ATTRIBUTE) {
          const { characterName, attribute, value } = update.payload;
          // Check if it's a player
          newState.players = newState.players.map((p) => {
            if (p.character.name === characterName) {
              if (attribute in p.character) {
                const key = attribute as keyof typeof p.character;
                const newChar = { ...p.character, [key]: value };
                return { ...p, character: newChar };
              }
            }
            return p;
          });
          // Check if it's a creature
          newState.creatures = newState.creatures.map((c) => {
            if (c.name === characterName && attribute in c) {
              const key = attribute as keyof typeof c;
              return { ...c, [key]: value };
            }
            return c;
          });
        }
      });

      return newState;
    }
    case ActionType.SET_ERROR:
      return { ...state, isLoading: false, error: action.payload };

    default:
      return state;
  }
}
