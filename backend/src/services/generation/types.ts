/**
 * Types for asset generation services
 */

export type Shape = 'box' | 'sphere' | 'cylinder' | 'cone' | 'capsule';

export interface ModelPart {
  readonly shape: Shape;
  readonly position: [number, number, number];
  readonly scale: [number, number, number];
  readonly rotation: [number, number, number];
  readonly color: string;
}

export interface ModelData {
  readonly name: string;
  readonly parts: ModelPart[];
  readonly rotation?: [number, number, number];
  readonly scale?: [number, number, number];
}

export type VoxelAssetType = 'Creature' | 'Tree' | 'Terrain' | 'Humanoid' | 'POI' | 'Object';

export type AssetCategory = '2d' | '3d' | 'map' | 'structures' | 'character-sheet';

export type AssetType = VoxelAssetType;

export interface SpawnRules {
  density?: number;
  minElevation?: number;
  maxElevation?: number;
  preferFlat?: boolean;
  minDistanceFromStructures?: number;
}

export interface ScaleVariation {
  min: number;
  max: number;
}

export interface AssetMetadata {
  readonly tags?: string[];
  readonly biomes?: string[];
  readonly hostility?: 'peaceful' | 'neutral' | 'hostile';
  readonly level?: number;
  readonly customAttributes?: Record<string, string | number | string[]>;
  readonly featureType?: string;
  readonly spawnRules?: SpawnRules;
  readonly rotationVariants?: number;
  readonly scaleVariation?: ScaleVariation;
}

// Deprecated: GenerationMode is no longer used
// export type GenerationMode = 'variations' | 'text-to-image' | 'batch-transform' | 'batch-create';

export type GenerationStatus = 'pending' | 'loading' | 'done' | 'error';

export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly color?: string;
  readonly assetType: AssetCategory;
  // Deprecated: mode field is no longer used
  readonly mode?: string;
  readonly baseImageId?: string;
  readonly masterDescription?: string;
  readonly baseModelData?: ModelData;
  readonly systemPrompt?: string;
}

export interface Asset {
  readonly id: string;
  readonly createdAt: Date;
  readonly collectionId: string;
  readonly name: string;
  readonly description: string;
  readonly assetType: AssetCategory;
  readonly status: GenerationStatus;
  readonly generationPrompt?: string;
  readonly storageUrl?: string;
  readonly metadata?: AssetMetadata;
  readonly imageId?: string;
  readonly modelData?: ModelData;
  readonly characterSheetData?: Record<string, unknown>; // Full CharacterSheetAsset object as JSON
}

export interface ModelGenerationRequest {
  readonly name: string;
  readonly description: string;
  readonly assetType: AssetType;
}

export interface ImageGenerationRequest {
  readonly prompt: string;
  readonly baseImage?: Buffer;
  readonly masterDescription?: string;
  readonly variationDescription?: string;
}

export interface WorldMap {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number; // 21 levels: -10 (underground) to +10 (sky/empty)
  readonly seed: string;
  readonly parameters: {
    readonly seed: string;
    readonly width: number;
    readonly height: number;
    readonly depth: number;
    readonly waterLevel?: number;
    readonly mountainousness?: number;
    readonly jaggedness?: number;
    readonly temperature?: number; // Global temperature bias
    readonly moisture?: number; // Global moisture bias
    readonly continentalness?: number; // Land mass distribution
    readonly erosion?: number; // Terrain smoothness
    readonly weirdness?: number; // Terrain variation
    readonly caveFrequency?: number; // Cave density (0-1)
    readonly oreDistribution?: Record<string, number>; // Ore spawn rates by type
  };
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly chunks?: Map<string, Record<string, unknown>>;
}
