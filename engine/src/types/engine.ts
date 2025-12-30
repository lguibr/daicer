import { Room, Player, Entity, WorldSettings } from './index';

export interface GameState {
  room: Partial<Room>;
  world: unknown; // Voxel world
  entities: Entity[];
  players: Player[];
  settings: WorldSettings;
}

export interface GameEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  events: GameEvent[];
  newStateDiff?: Partial<GameState>; // For patching state
  diagnostics?: string[]; // Log for transparency
}
