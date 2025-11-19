/**
 * RoomMapView Component
 * Infinite grid map with z-layer controls
 */

import { useState } from 'react';
import type { GridTile, GridFeature } from '@daicer/shared';
import { Layers } from 'lucide-react';
import { GridMapRenderer } from '../world/GridMapRenderer';
import { TileMetadataPanel } from '../world/TileMetadataPanel';
import { Button } from '../ui/button';

interface RoomMapViewProps {
  roomId: string;
}

export function RoomMapView({ roomId }: RoomMapViewProps) {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);

  console.log('[RoomMapView] Rendering with roomId:', roomId, 'layer:', currentLayer);

  return (
    <div className="flex h-full flex-col">
      {/* Controls Bar */}
      <div className="flex-shrink-0 border-b border-midnight-600 bg-midnight-900/90 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Z-Layer Control */}
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-shadow-400" />
            <span className="text-xs text-shadow-400">Z-Layer:</span>
            <input
              type="range"
              min={-6}
              max={5}
              step={1}
              value={currentLayer}
              onChange={(e) => {
                const newLayer = Number(e.target.value);
                console.log('[RoomMapView] Z-layer changed to:', newLayer);
                setCurrentLayer(newLayer);
              }}
              className="w-48"
              data-testid="zlayer-slider-room"
            />
            <span className="text-sm font-mono w-12 text-center text-accent">{currentLayer}</span>
            <span className="text-xs text-shadow-500">
              {currentLayer < 0 ? '⛏️ Underground' : currentLayer === 0 ? '🌍 Surface' : '☁️ Sky'}
            </span>
          </div>

          {/* Reset View */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('[RoomMapView] Reset to surface layer');
              setCurrentLayer(0);
            }}
          >
            Reset to Surface
          </Button>
        </div>
      </div>

      {/* Grid Map */}
      <div className="relative flex-1 p-4">
        <GridMapRenderer
          roomId={roomId}
          currentLayer={currentLayer}
          onTileClick={(tile, features) => {
            console.log('[RoomMapView] Tile clicked:', tile, features);
            setSelectedTile(tile);
            setSelectedFeatures(features);
          }}
        />
      </div>

      {/* Tile Metadata Panel */}
      <TileMetadataPanel tile={selectedTile} features={selectedFeatures} onClose={() => setSelectedTile(null)} />
    </div>
  );
}
