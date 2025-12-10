/**
 * Structure Grid Preview
 * Shows structure assets rendered on grid (for assets page)
 */

import { useState } from 'react';
import type { GridTile, GridFeature } from '@daicer/shared';
import { Layers } from 'lucide-react';
import { GridMapRenderer } from '../world/GridMapRenderer';
import { TileMetadataPanel } from '../world/TileMetadataPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface StructureGridPreviewProps {
  structureId: string;
  structureName: string;
  structureData?: unknown; // JSON structure data
}

/**
 * Preview a structure asset on grid
 * Useful for visualizing procedurally generated buildings
 */
export function StructureGridPreview({ structureId, structureName, structureData }: StructureGridPreviewProps) {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);

  console.log('[StructureGridPreview] Rendering structure:', {
    structureId,
    structureName,
    hasData: !!structureData,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {structureName} - Grid Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Z-Layer Control */}
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Z-Layer:</span>
            <input
              type="range"
              min={0}
              max={5}
              value={currentLayer}
              onChange={(e) => setCurrentLayer(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono">{currentLayer}</span>
          </div>

          <GridMapRenderer
            assetId={structureId}
            currentLayer={currentLayer}
            onTileClick={(tile, features) => {
              setSelectedTile(tile);
              setSelectedFeatures(features);
            }}
            className="h-96"
          />

          {/* Structure Data JSON */}
          {!!structureData && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">Structure Data (JSON)</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify(structureData, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Tile Metadata */}
      <TileMetadataPanel tile={selectedTile} features={selectedFeatures} onClose={() => setSelectedTile(null)} />
    </div>
  );
}
