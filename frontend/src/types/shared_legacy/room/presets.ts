import type { Room } from './types';
import { GamePhase } from './types';

export const PRESET_ROOM_DEFAULT: Room = {
  documentId: 'room-default-test',
  roomId: 'DEFAULT',
  id: 'room-default-test',
  code: 'DEFAULT',
  ownerId: 'user-1',
  settings: null,
  worldDescription: '',
  phase: GamePhase.SETUP,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  isActive: true,
};

export const PRESET_ROOM_SETUP: Room = {
  documentId: 'room-setup-test',
  roomId: 'TEST01',
  id: 'room-setup-test',
  code: 'TEST01',
  ownerId: 'user-1',
  settings: null,
  worldDescription: '',
  phase: GamePhase.SETUP,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  isActive: true,
};

export const PRESET_ROOM_ACTIVE: Room = {
  documentId: 'preset-room-id',
  roomId: 'active-room',
  id: 'preset-room-id',
  code: 'active-room',
  ownerId: 'user-1',
  settings: {
    worldType: 'terra',
    worldSize: 'medium',
    theme: 'High Fantasy Adventure',
    setting: 'The Kingdom of Aldoria',
    tone: 'Epic and heroic',
    worldBackground: 'A land threatened by ancient evil',
    dmStyle: {
      verbosity: 3,
      detail: 3,
      engagement: 4,
      narrative: 4,
      specialMode: null,
      customDirectives: '',
    },
    dmSystemPrompt: 'You are an expert Dungeon Master...',
    playerCount: 4,
    adventureLength: 'medium',
    difficulty: 'challenging',
    startingLevel: 3,
    attributePointBudget: 27,
    language: 'en',
  },
  worldDescription: 'A vast kingdom with ancient ruins and dark forests',
  phase: GamePhase.GAMEPLAY,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  isActive: true,
};

export const PRESET_ROOMS = {
  setup: PRESET_ROOM_SETUP,
  active: PRESET_ROOM_ACTIVE,
};
