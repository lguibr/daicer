/**
 * Player types
 */

import type { CharacterSheet } from '../character/types';

export interface AvatarPreviewImage {
  url: string;
  alt?: string;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  character: CharacterSheet;
  action: string | null;
  isReady: boolean;
  joinedAt: number;
  updatedAt?: number;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  avatarPreview?: {
    portrait: AvatarPreviewImage;
    upperBody: AvatarPreviewImage;
    fullBody: AvatarPreviewImage;
  };
}

export interface Message {
  id: string;
  sender: 'DM' | string;
  recipientId?: string;
  text: string;
  images?: string[];
  timestamp: number;
  targetPlayer?: string;
  metadata?: {
    ragContext?: string;
    toolCalls?: any[];
    [key: string]: any;
  };
}

export interface ToolCallEvent {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  timestamp: number;
}
