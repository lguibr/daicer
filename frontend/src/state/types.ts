import { GamePhase, WorldSettings, Player, Message, Creature } from '../types';
import { Language } from '../i18n';

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
