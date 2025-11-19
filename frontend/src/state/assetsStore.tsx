/**
 * Assets Store
 *
 * React Context + useReducer for managing assets state
 */

import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react';
import type { Collection, Asset, WorldMap } from '../services/assetService';

// State type
export interface AssetsState {
  collections: Collection[];
  currentCollection: Collection | null;
  assets: Asset[];
  worlds: WorldMap[];
  filters: {
    assetType?: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
    color?: string;
    tags?: string[];
  };
  isLoading: boolean;
  error: string | null;
}

// Action types
type AssetsAction =
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'SET_CURRENT_COLLECTION'; payload: Collection | null }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'UPDATE_COLLECTION'; payload: { id: string; updates: Partial<Collection> } }
  | { type: 'REMOVE_COLLECTION'; payload: string }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: { id: string; updates: Partial<Asset> } }
  | { type: 'REMOVE_ASSET'; payload: string }
  | { type: 'SET_WORLDS'; payload: WorldMap[] }
  | { type: 'ADD_WORLD'; payload: WorldMap }
  | { type: 'REMOVE_WORLD'; payload: string }
  | {
      type: 'SET_FILTERS';
      payload: {
        assetType?: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
        color?: string;
        tags?: string[];
      };
    }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Initial state
const initialState: AssetsState = {
  collections: [],
  currentCollection: null,
  assets: [],
  worlds: [],
  filters: {},
  isLoading: false,
  error: null,
};

// Reducer
function assetsReducer(state: AssetsState, action: AssetsAction): AssetsState {
  switch (action.type) {
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload };
    case 'SET_CURRENT_COLLECTION':
      return { ...state, currentCollection: action.payload };
    case 'ADD_COLLECTION':
      // Optimistic add: prepend to list
      return { ...state, collections: [action.payload, ...state.collections] };
    case 'UPDATE_COLLECTION':
      // Optimistic update
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
        currentCollection:
          state.currentCollection?.id === action.payload.id
            ? { ...state.currentCollection, ...action.payload.updates }
            : state.currentCollection,
      };
    case 'REMOVE_COLLECTION':
      // Optimistic delete
      return {
        ...state,
        collections: state.collections.filter((c) => c.id !== action.payload),
        currentCollection: state.currentCollection?.id === action.payload ? null : state.currentCollection,
      };
    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'ADD_ASSET':
      // Optimistic add: prepend to list
      return { ...state, assets: [action.payload, ...state.assets] };
    case 'UPDATE_ASSET':
      // Optimistic update
      return {
        ...state,
        assets: state.assets.map((a) => (a.id === action.payload.id ? { ...a, ...action.payload.updates } : a)),
      };
    case 'REMOVE_ASSET':
      // Optimistic delete
      return { ...state, assets: state.assets.filter((a) => a.id !== action.payload) };
    case 'SET_WORLDS':
      return { ...state, worlds: action.payload };
    case 'ADD_WORLD':
      return { ...state, worlds: [action.payload, ...state.worlds] };
    case 'REMOVE_WORLD':
      return { ...state, worlds: state.worlds.filter((w) => w.id !== action.payload) };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context
type AssetsContextType = AssetsState & {
  setCollections: (collections: Collection[]) => void;
  setCurrentCollection: (collection: Collection | null) => void;
  addCollection: (collection: Collection) => void;
  updateCollectionOptimistic: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  setWorlds: (worlds: WorldMap[]) => void;
  addWorld: (world: WorldMap) => void;
  removeWorld: (id: string) => void;
  setFilters: (filters: {
    assetType?: '2d' | '3d' | 'map' | 'structures' | 'character-sheet';
    color?: string;
    tags?: string[];
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

// Provider
export function AssetsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(assetsReducer, initialState);

  const value: AssetsContextType = useMemo(
    () => ({
      ...state,
      setCollections: (collections: Collection[]) => dispatch({ type: 'SET_COLLECTIONS', payload: collections }),
      setCurrentCollection: (collection: Collection | null) =>
        dispatch({ type: 'SET_CURRENT_COLLECTION', payload: collection }),
      addCollection: (collection: Collection) => dispatch({ type: 'ADD_COLLECTION', payload: collection }),
      updateCollectionOptimistic: (id: string, updates: Partial<Collection>) =>
        dispatch({ type: 'UPDATE_COLLECTION', payload: { id, updates } }),
      removeCollection: (id: string) => dispatch({ type: 'REMOVE_COLLECTION', payload: id }),
      setAssets: (assets: Asset[]) => dispatch({ type: 'SET_ASSETS', payload: assets }),
      addAsset: (asset: Asset) => dispatch({ type: 'ADD_ASSET', payload: asset }),
      updateAsset: (id: string, updates: Partial<Asset>) =>
        dispatch({ type: 'UPDATE_ASSET', payload: { id, updates } }),
      removeAsset: (id: string) => dispatch({ type: 'REMOVE_ASSET', payload: id }),
      setWorlds: (worlds: WorldMap[]) => dispatch({ type: 'SET_WORLDS', payload: worlds }),
      addWorld: (world: WorldMap) => dispatch({ type: 'ADD_WORLD', payload: world }),
      removeWorld: (id: string) => dispatch({ type: 'REMOVE_WORLD', payload: id }),
      setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
      setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
      setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state]
  );

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>;
}

// Hook
export function useAssetsStore(): AssetsContextType {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssetsStore must be used within AssetsProvider');
  }
  return context;
}
