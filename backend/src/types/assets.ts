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

export interface GridBackgroundPayload {
  themePrompt: string;
  gridSize: {
    columns: number;
    rows: number;
  };
  biome?: string;
  lighting?: string;
  mood?: string;
  referenceImages?: ReferenceImagePayload[];
}

export interface ActionFramePayload {
  basePrompt: string;
  stakes?: string;
  cameraAngle?: string;
  motionStyle?: string;
  narrative?: NarrativeContext;
  referenceImages?: ReferenceImagePayload[];
}

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

export interface AvatarPreviewImage {
  mimeType: string;
  data: string; // base64 encoded
  prompt: string;
  width: number;
  height: number;
}

export interface AvatarPreviewResponse {
  portrait: AvatarPreviewImage;
  upperBody: AvatarPreviewImage;
  fullBody: AvatarPreviewImage;
}
