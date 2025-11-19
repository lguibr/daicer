/**
 * Type definitions - re-exported from shared package
 * @deprecated Import directly from @daicer/shared instead
 *
 * This file provides backward compatibility while we migrate to the shared package.
 */

// Re-export all types from shared package
export * from '../../../shared/character/types';
export * from '../../../shared/room/types';
export * from '../../../shared/player/types';
export * from '../../../shared/user/types';

// Keep assets types here as they're backend-specific
export interface AvatarAssetResponse {
  id: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  prompt: string;
  createdAt: string;
}

export interface BackgroundAssetResponse {
  id: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  prompt: string;
  createdAt: string;
}

export interface ActionFrameAssetResponse {
  id: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  prompt: string;
  action: string;
  createdAt: string;
}

export type AssetType = 'avatar' | 'background' | 'action-frame';
