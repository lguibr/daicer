/**
 * Material Legend Component
 * Shows all materials with color swatches and tile type symbols
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMaterialColor } from '@daicer/shared';
import type { StructureMaterial } from '@daicer/shared';

const MATERIALS: StructureMaterial[] = ['wood', 'stone', 'metal', 'marble', 'rock'];

const TILE_TYPES = [
  { type: 'wall', symbol: '█', description: 'Solid color' },
  { type: 'floor', symbol: '▒', description: 'Lighter tint (80% opacity)' },
  { type: 'door', symbol: '▓', description: 'Border highlight' },
  { type: 'stairs', symbol: '╱', description: 'Diagonal lines' },
  { type: 'road', symbol: '═', description: 'Horizontal lines' },
];

export function MaterialLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Materials */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Materials</h3>
          <div className="grid grid-cols-2 gap-2">
            {MATERIALS.map((material) => {
              const color = getMaterialColor(material);
              return (
                <div key={material} className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-gray-300 rounded" style={{ backgroundColor: color }} />
                  <span className="text-xs capitalize">{material}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tile Types */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Tile Types</h3>
          <div className="space-y-1">
            {TILE_TYPES.map(({ type, symbol, description }) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <span className="font-mono text-lg w-4 text-center">{symbol}</span>
                <span className="capitalize font-medium w-16">{type}:</span>
                <span className="text-muted-foreground">{description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Structure Types */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Structure Types</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>🏠 House</div>
            <div>🗼 Tower</div>
            <div>🏰 Castle</div>
            <div>⚔️ Dungeon</div>
            <div>⛩️ Temple</div>
            <div>🕳️ Cave</div>
            <div>🌳 Tree</div>
            <div>🗿 Circle</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
