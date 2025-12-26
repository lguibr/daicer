/**
 * Game component type definitions
 */

import type { Message, Player } from '@daicer/engine';

/**
 * Chat area props
 */
export interface ChatAreaProps {
  messages: Message[];
  worldDescription: string;
}

/**
 * Markdown message props
 */
export interface MarkdownMessageProps {
  content: string;
}

/**
 * Player sidebar props
 */
export interface PlayerSidebarProps {
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }>;
}

/**
 * Combat screen props
 */
export interface CombatScreenProps {
  roomId: string;
  players?: Player[];
}

/**
 * Gameplay screen props
 */
export interface GameplayScreenProps {
  roomId: string;
}
