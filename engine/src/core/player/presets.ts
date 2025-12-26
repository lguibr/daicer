import type { Player } from './types';
import { FIGHTER_THORIN, WIZARD_ELARA } from '../character/presets';

export const PRESET_PLAYER_FIGHTER: Player = {
  id: 'player-1',
  userId: 'user-1',
  name: 'Thorin Ironshield',
  character: FIGHTER_THORIN,
  action: null,
  isReady: false,
  joinedAt: 1700000000000,
  updatedAt: 1700000000000,
};

export const PRESET_PLAYER_WIZARD: Player = {
  id: 'player-2',
  userId: 'user-2',
  name: 'Elara Moonshadow',
  character: WIZARD_ELARA,
  action: null,
  isReady: false,
  joinedAt: 1700000000000,
  updatedAt: 1700000000000,
};

export const PRESET_PLAYERS = {
  fighter: PRESET_PLAYER_FIGHTER,
  wizard: PRESET_PLAYER_WIZARD,
};
