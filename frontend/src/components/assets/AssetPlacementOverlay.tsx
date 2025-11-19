/**
 * AssetPlacementOverlay Component
 * Sidebar for placing 3D assets on the world map
 */

import { useState } from 'react';
import { Package, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PlacedAsset {
  id: string;
  assetId: string;
  x: number;
  y: number;
  name: string;
}

interface AssetPlacementOverlayProps {
  worldId: string;
  onClose?: () => void;
  onAssetPlace?: (assetId: string, x: number, y: number) => void;
}

export function AssetPlacementOverlay({ worldId, onClose, onAssetPlace: _onAssetPlace }: AssetPlacementOverlayProps) {
  const [_selectedAsset, _setSelectedAsset] = useState<string | null>(null);
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);

  return (
    <Card className="fixed right-4 top-20 z-40 w-80 border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95">
      <CardHeader className="border-b border-accent/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Asset Placement</CardTitle>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm" className="text-shadow-300 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Instructions */}
        <div className="mb-4 rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
          💡 Select an asset, then click on the map to place it
        </div>

        {/* Asset Library Section */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-white">3D Assets</h4>
          <div className="space-y-2">
            {/* Placeholder - will be populated with actual 3D assets later */}
            <div className="rounded-lg border border-midnight-500 bg-midnight-800/50 p-3 text-center text-sm text-shadow-400">
              <Package className="mx-auto mb-2 h-8 w-8 text-shadow-600" />
              <p>No 3D assets available</p>
              <p className="mt-1 text-xs">Create assets in the 3D Assets page</p>
            </div>
          </div>
        </div>

        {/* Placed Assets Section */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">Placed Assets ({placedAssets.length})</h4>
          {placedAssets.length === 0 ? (
            <div className="rounded-lg border border-midnight-500 bg-midnight-800/50 p-3 text-center text-xs text-shadow-400">
              No assets placed yet
            </div>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {placedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded border border-midnight-500 bg-midnight-800/50 p-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{asset.name}</div>
                    <div className="text-shadow-400">
                      ({asset.x}, {asset.y})
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setPlacedAssets((prev) => prev.filter((a) => a.id !== asset.id));
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-shadow-300 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={() => {
            // TODO: Save placed assets to Firestore
            console.log('Saving placed assets for world:', worldId, placedAssets);
          }}
          className="mt-4 w-full bg-accent text-white hover:bg-accent/90"
          disabled={placedAssets.length === 0}
        >
          Save Placements
        </Button>
      </CardContent>
    </Card>
  );
}
