/**
 * Grid Map Page
 * Full-screen infinite grid viewer with z-layer controls
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { GridTile, GridFeature } from '@daicer/shared';
import { GridMapRenderer } from '../components/world/GridMapRenderer';
import { TileMetadataPanel } from '../components/world/TileMetadataPanel';

export function GridMapPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Room Selected</h1>
          <p className="text-muted-foreground">Please select a room to view the grid map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Grid World Map</h1>
        <p className="text-sm text-muted-foreground">Room: {roomId}</p>
      </div>

      {/* Z-Layer Control */}
      <div className="border-b border-border p-4 flex items-center gap-4">
        <span className="text-sm font-medium">Z-Layer:</span>
        <input
          type="range"
          min={-6}
          max={5}
          step={1}
          value={currentLayer}
          onChange={(e) => setCurrentLayer(Number(e.target.value))}
          className="flex-1"
          data-testid="zlayer-slider"
        />
        <span className="text-sm font-mono w-12 text-center">{currentLayer}</span>
        <span className="text-xs text-muted-foreground">
          {currentLayer < 0 ? 'Underground' : currentLayer === 0 ? 'Surface' : 'Sky'}
        </span>
      </div>

      {/* Grid Map */}
      <div className="flex-1 p-4">
        <GridMapRenderer
          roomId={roomId}
          currentLayer={currentLayer}
          onTileClick={(tile, features) => {
            console.log('[GridMapPage] Tile clicked:', tile, features);
            setSelectedTile(tile);
            setSelectedFeatures(features);
          }}
          className="h-full"
        />
      </div>

      {/* Tile Metadata Panel */}
      <TileMetadataPanel tile={selectedTile} features={selectedFeatures} onClose={() => setSelectedTile(null)} />
    </div>
  );
}
