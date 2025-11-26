/**
 * Asset API Service
 *
 * Client for asset generation API endpoints
 */

import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  color?: string;
  assetType: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
  // Deprecated: mode field is no longer used
  mode?: string;
  baseImageId?: string;
  masterDescription?: string;
}

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

export interface Asset {
  id: string;
  createdAt: Date;
  collectionId: string;
  name: string;
  description: string;
  assetType: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
  status: 'pending' | 'loading' | 'done' | 'error';
  generationPrompt?: string;
  storageUrl?: string;
  modelData?: ModelData;
  characterSheetData?: Record<string, unknown>; // Full CharacterSheetAsset object as JSON
}

export interface WorldMap {
  id: string;
  name: string;
  width: number;
  height: number;
  seed: string;
  params: Record<string, unknown>;
  parameters?: Record<string, unknown>; // Deprecated?
  createdAt: Date;
  createdBy: string;
}

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convert Firestore Timestamp object to Date
 * Handles both Firestore Timestamp format { _seconds, _nanoseconds } and Date objects
 */
function convertFirestoreTimestamp(timestamp: unknown): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'object' && timestamp !== null) {
    const ts = timestamp as { _seconds?: number; _nanoseconds?: number };
    if (typeof ts._seconds === 'number') {
      // Firestore Timestamp: convert seconds to milliseconds
      return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
    }
  }

  // Fallback: try to parse as number or string
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Last resort: return current date
  return new Date();
}

// Collections
export async function createCollection(data: {
  name: string;
  assetType: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
  mode?: string;
  description?: string;
  color?: string;
}): Promise<{ id: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => res.data);
}

export async function getCollections(
  assetType?: '2d' | '3d' | 'map' | 'structures' | 'character-sheet'
): Promise<Collection[]> {
  const query = assetType ? `?assetType=${assetType}` : '';
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections${query}`).then((res) => {
    const collections = res.data as Collection[];
    return collections.map((collection) => ({
      ...collection,
      createdAt: convertFirestoreTimestamp(collection.createdAt),
    }));
  });
}

export async function getCollection(id: string): Promise<Collection> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections/${id}`).then((res) => {
    const collection = res.data as Collection;
    return {
      ...collection,
      createdAt: convertFirestoreTimestamp(collection.createdAt),
    };
  });
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections/${id}`, {
    method: 'DELETE',
  });
}

// Assets
export async function createAsset(data: {
  collectionId: string;
  name: string;
  description: string;
  generationPrompt?: string;
  characterSheetData?: Record<string, unknown>;
}): Promise<{ id: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => res.data);
}

export async function getCollectionAssets(collectionId: string): Promise<Asset[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/collections/${collectionId}/assets`).then((res) => {
    const assets = res.data as Asset[];
    return assets.map((asset) => ({
      ...asset,
      createdAt: convertFirestoreTimestamp(asset.createdAt),
    }));
  });
}

export async function getAsset(id: string): Promise<Asset> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/${id}`).then((res) => {
    const asset = res.data as Asset;
    return {
      ...asset,
      createdAt: convertFirestoreTimestamp(asset.createdAt),
    };
  });
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/${id}`, {
    method: 'DELETE',
  });
}

// Generation
export async function generateModel(
  assetId: string,
  data: {
    assetType: string;
    name: string;
    description: string;
  }
): Promise<ModelData> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/${assetId}/generate-model`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => res.data);
}

export async function generateImage(assetId: string, prompt: string): Promise<{ imageUrl: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/${assetId}/generate-image`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }).then((res) => res.data);
}

// Worlds
export async function createWorld(data: {
  name: string;
  seed: string;
  width: number;
  height: number;
  waterLevel?: number;
  mountainousness?: number;
  jaggedness?: number;
  temperature?: number;
  moisture?: number;
}): Promise<{ id: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/worlds`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => res.data);
}

export async function getWorlds(): Promise<WorldMap[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/worlds`).then((res) => res.data);
}

export async function getWorld(id: string): Promise<WorldMap> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/worlds/${id}`).then((res) => res.data);
}

export async function deleteWorld(id: string): Promise<void> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/worlds/${id}`, {
    method: 'DELETE',
  });
}

// Batch variations
export async function generateVariations(
  baseAssetId: string,
  count: number,
  variationPrompt?: string
): Promise<{ assetIds: string[] }> {
  return fetchWithAuth(`${API_BASE_URL}/api/assets-gen/batch-variations`, {
    method: 'POST',
    body: JSON.stringify({ baseAssetId, count, variationPrompt }),
  }).then((res) => res.data);
}

// Quick create and generate
export async function quickCreateAndGenerate(
  collectionId: string,
  assetType: '2d' | '3d',
  prompt: string,
  name?: string,
  voxelType?: string
): Promise<{ assetId: string; asset: Asset }> {
  // Step 1: Create asset
  const assetName = name || prompt.substring(0, 50);
  const createResult = await createAsset({
    collectionId,
    name: assetName,
    description: prompt,
    generationPrompt: prompt,
  });

  const assetId = createResult.id;

  try {
    // Step 2: Generate based on type
    if (assetType === '2d') {
      const imageResult = await generateImage(assetId, prompt);
      await updateAsset(assetId, {
        status: 'done',
        storageUrl: imageResult.imageUrl,
      });
    } else if (assetType === '3d') {
      const modelResult = await generateModel(assetId, {
        assetType: voxelType || 'Creature',
        name: assetName,
        description: prompt,
      });
      await updateAsset(assetId, {
        status: 'done',
        modelData: modelResult,
      });
    }

    // Fetch updated asset
    const asset = await getAsset(assetId);
    return { assetId, asset };
  } catch (error) {
    // Mark as error if generation fails
    await updateAsset(assetId, { status: 'error' });
    throw error;
  }
}
