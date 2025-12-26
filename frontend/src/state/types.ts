import { GamePhase, WorldSettings, Player, Message, Creature, Language } from '@daicer/engine';

export interface AppState {
  language: Language;
  gamePhase: GamePhase;
  worldSettings: WorldSettings | null;
  worldDescription: string;
  players: Player[];
  messages: Message[];
  creatures: Creature[];
  isLoading: boolean;
  error: string | null;
}
