/**
 * Asset type definitions mirrored from backend/src/types/assets.ts
 */

export interface AssetResponse {
  id: string;
  mimeType: string;
  storagePath: string;
  publicUrl: string;
  prompt: string;
  createdAt: string;
}

export interface AvatarAssetResponse {
  portrait: AssetResponse;
  upperBody: AssetResponse;
  fullBody: AssetResponse;
}

export interface NarrativeContext {
  worldSummary?: string;
  currentScene?: string;
  playerIntent?: string;
}

export interface AppearanceAttributes {
  race?: string;
  lineage?: string;
  classRole?: string;
  genderPresentation?: string;
  hair?: string;
  eyes?: string;
  attire?: string;
  accessories?: string;
  notableFeatures?: string;
}

export interface ReferenceImagePayload {
  mimeType: string;
  data: string;
  description?: string;
}

export interface AvatarGenerationPayload {
  name?: string;
  basePrompt: string;
  narrative?: NarrativeContext;
  appearance?: AppearanceAttributes;
  artStyle?: string;
  tone?: string;
  referenceImages?: ReferenceImagePayload[];
}

export interface AvatarPreviewImage {
  mimeType: string;
  data?: string;
  publicUrl?: string;
  storagePath?: string;
  prompt: string;
  width: number;
  height: number;
}

export interface AvatarPreviewResponse {
  portrait: AvatarPreviewImage;
  upperBody: AvatarPreviewImage;
  fullBody: AvatarPreviewImage;
}
