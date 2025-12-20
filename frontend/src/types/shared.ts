/**
 * Shared types - re-exported from shared package
 * @deprecated Import directly from @daicer/shared instead
 *
 * This file provides backward compatibility while we migrate to the shared package.
 */

// Re-export all types from shared package
export * from '@daicer/shared';

// Explicit overrides for Architecture Migration
export interface Message {
  id?: string; // Legacy: may be numeric or string
  documentId?: string; // Strapi 5
  text?: string; // Legacy
  content: string; // New Standard
  sender: string; // Legacy (senderName)
  senderName?: string; // New Standard
  senderType?: 'dm' | 'player' | 'system';
  timestamp: number;
  type?: 'narration' | 'chat' | 'system'; // Legacy/Socket
  turn?: {
    documentId: string;
    turnNumber: number;
  };
  // Extended fields used by UI
  recipientId?: string;
  targetPlayer?: string;
  metadata?: {
    ragContext?: string;
    toolCalls?: any[];
    [key: string]: any;
  };
  images?: string[]; // base64
  diceRolls?: any[];
}
