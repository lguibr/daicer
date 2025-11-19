/**
 * Voxel Metadata Panel
 * Displays detailed information about a clicked tile
 */

import { Info, X } from 'lucide-react';

export interface VoxelMetadata {
  worldCoords: { x: number; y: number; z: number };
  roomCoords: { x: number; y: number };
  biome: string;
  structure?: {
    name: string;
    type: string;
    description?: string;
    [key: string]: any;
  };
  elevation?: number;
  temperature?: number;
  moisture?: number;
}

interface VoxelMetadataPanelProps {
  metadata: VoxelMetadata | null;
  onClose: () => void;
}

const BIOME_DISPLAY_NAMES: Record<string, string> = {
  ocean: 'Ocean',
  frozen_ocean: 'Frozen Ocean',
  lake: 'Lake',
  river: 'River',
  frozen_river: 'Frozen River',
  beach: 'Beach',
  plains: 'Plains',
  forest: 'Forest',
  taiga: 'Taiga',
  tundra: 'Tundra',
  swamp: 'Swamp',
  desert: 'Desert',
  savanna: 'Savanna',
  jungle: 'Jungle',
  mountains: 'Mountains',
  hills: 'Hills',
};

const LAYER_NAMES: Record<number, string> = {
  '-1': 'Underground',
  '0': 'Surface',
  '1': 'Sky',
};

export function VoxelMetadataPanel({ metadata, onClose }: VoxelMetadataPanelProps) {
  if (!metadata) {
    return null;
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-aurora-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-aurora-300">Tile Info</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-shadow-400 hover:text-shadow-200 transition-colors"
          data-testid="close-metadata-panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p className="text-shadow-500 uppercase tracking-wider">World Coords</p>
            <p className="font-mono text-aurora-200">
              ({metadata.worldCoords.x}, {metadata.worldCoords.y})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-shadow-500 uppercase tracking-wider">Room Coords</p>
            <p className="font-mono text-aurora-200">
              ({metadata.roomCoords.x}, {metadata.roomCoords.y})
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <p className="text-shadow-500 uppercase tracking-wider">Layer</p>
          <p className="text-shadow-200">{LAYER_NAMES[metadata.worldCoords.z] || `Z: ${metadata.worldCoords.z}`}</p>
        </div>
      </div>

      {/* Biome */}
      <div className="space-y-1 text-xs">
        <p className="text-shadow-500 uppercase tracking-wider">Biome</p>
        <p className="text-shadow-200 capitalize">{BIOME_DISPLAY_NAMES[metadata.biome] || metadata.biome}</p>
      </div>

      {/* Structure (if present) */}
      {metadata.structure && (
        <div className="border-t border-midnight-600 pt-3 space-y-2">
          <div className="space-y-1 text-xs">
            <p className="text-shadow-500 uppercase tracking-wider">Structure</p>
            <p className="text-aurora-300 font-semibold">{metadata.structure.name}</p>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-shadow-500 uppercase tracking-wider">Type</p>
            <p className="text-shadow-200 capitalize">{metadata.structure.type}</p>
          </div>

          {metadata.structure.description && (
            <div className="space-y-1 text-xs">
              <p className="text-shadow-500 uppercase tracking-wider">Description</p>
              <p className="text-shadow-300 text-xs leading-relaxed">{metadata.structure.description}</p>
            </div>
          )}

          {metadata.structure.population !== undefined && (
            <div className="space-y-1 text-xs">
              <p className="text-shadow-500 uppercase tracking-wider">Population</p>
              <p className="text-shadow-200">{metadata.structure.population.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Environmental data (if available) */}
      {(metadata.elevation !== undefined || metadata.temperature !== undefined || metadata.moisture !== undefined) && (
        <div className="border-t border-midnight-600 pt-3 space-y-2 text-xs">
          {metadata.elevation !== undefined && (
            <div className="flex justify-between">
              <span className="text-shadow-500 uppercase tracking-wider">Elevation</span>
              <span className="text-shadow-200 font-mono">{metadata.elevation}</span>
            </div>
          )}
          {metadata.temperature !== undefined && (
            <div className="flex justify-between">
              <span className="text-shadow-500 uppercase tracking-wider">Temperature</span>
              <span className="text-shadow-200 font-mono">{metadata.temperature.toFixed(1)}°</span>
            </div>
          )}
          {metadata.moisture !== undefined && (
            <div className="flex justify-between">
              <span className="text-shadow-500 uppercase tracking-wider">Moisture</span>
              <span className="text-shadow-200 font-mono">{metadata.moisture.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
