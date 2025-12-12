/**
 * Asset-related type definitions
 */

export type AssetType = '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
export type AssetStatus = 'pending' | 'loading' | 'done' | 'error';
export type CollectionMode = 'variations' | 'text-to-image' | 'batch-transform' | 'batch-create';

export interface ModelPart {
  shape: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

export interface ModelData {
  name: string;
  parts: ModelPart[];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  color?: string;
  assetType: AssetType;
  mode?: CollectionMode;
  baseImageId?: string;
  masterDescription?: string;
}

export interface Asset {
  id: string;
  createdAt: Date;
  collectionId: string;
  name: string;
  description: string;
  assetType: AssetType;
  status: AssetStatus;
  generationPrompt?: string;
  storageUrl?: string;
  modelData?: ModelData;
  type?: AssetType; // Alias for assetType (for backward compatibility)
}

export interface WorldMap {
  id: string;
  name: string;
  width: number;
  height: number;
  seed: string;
  parameters: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}
