/**
 * Game components barrel export
 */

export { default as ChatArea } from './ChatArea';
export { CombatScreen } from './CombatScreen';
export { default as GameplayScreen } from './GameplayScreen';
export { default as MarkdownMessage } from './MarkdownMessage';
export { default as PlayerSidebar } from './PlayerSidebar';

export type {
  ChatAreaProps,
  CombatScreenProps,
  GameplayScreenProps,
  MarkdownMessageProps,
  PlayerSidebarProps,
} from '../types/game.types';
