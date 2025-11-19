/**
 * Tile Metadata Panel
 * Displays detailed JSON metadata for selected tiles and features
 */

import { X } from 'lucide-react';
import type { GridTile, GridFeature } from '@daicer/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface TileMetadataPanelProps {
  tile: GridTile | null;
  features: GridFeature[];
  onClose: () => void;
}

/**
 * Tile Metadata Panel Component
 * Shows tile properties and features in readable format
 */
export function TileMetadataPanel({ tile, features, onClose }: TileMetadataPanelProps) {
  if (!tile) return null;

  return (
    <Card
      className="fixed right-4 top-4 w-96 max-h-[80vh] overflow-auto z-50 shadow-xl"
      data-testid="tile-metadata-panel"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tile Metadata</span>
          <Button size="sm" variant="ghost" onClick={onClose} data-testid="close-metadata-button">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tile Coordinates */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Position</h3>
          <div className="font-mono text-xs space-y-1">
            <div>X: {tile.x}</div>
            <div>Y: {tile.y}</div>
            <div>Z: {tile.z}</div>
          </div>
        </div>

        {/* Tile Properties */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Tile Properties</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Block Type:</span>
              <span className="font-mono">{tile.blockType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biome:</span>
              <span className="font-mono">{tile.biome}</span>
            </div>
            {tile.elevation !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elevation:</span>
                <span className="font-mono">{tile.elevation.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Light Level:</span>
              <span className="font-mono">{tile.lightLevel}/15</span>
            </div>
          </div>
        </div>

        {/* Tile Metadata JSON */}
        {tile.metadata && Object.keys(tile.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Metadata</h3>
            <JSONViewer data={tile.metadata} />
          </div>
        )}

        {/* Features on this tile */}
        {features.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Features ({features.length})</h3>
            {features.map((feature) => (
              <div key={feature.id} className="mb-3 p-2 rounded bg-muted/50 border border-border">
                <div className="text-xs font-semibold mb-1">{feature.name || feature.subtype}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-mono">{feature.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtype:</span>
                    <span className="font-mono">{feature.subtype}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Walkable:</span>
                    <span>{feature.isWalkable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blocks LoS:</span>
                    <span>{feature.blocksLineOfSight ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {feature.metadata && Object.keys(feature.metadata).length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold mb-1">Metadata:</div>
                    <JSONViewer data={feature.metadata} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple JSON Viewer Component
 * Displays JSON in readable tree format
 */
function JSONViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="font-mono text-xs bg-background p-2 rounded border border-border overflow-auto max-h-64">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
