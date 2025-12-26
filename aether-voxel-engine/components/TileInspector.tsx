import React from 'react';
import { Tile, Coordinates } from '../aether';

interface Props {
  selectedTile: Tile | null;
  coords: Coordinates | null;
  isReachable: boolean;
  distance: number | null;
}

export const TileInspector: React.FC<Props> = ({ selectedTile, coords, isReachable, distance }) => {
  if (!coords) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg shadow-lg text-xs font-mono text-slate-500 text-center h-48 flex items-center justify-center">
        Select a tile to inspect
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg text-xs font-mono">
      <h2 className="text-sky-400 font-bold mb-3 border-b border-slate-700 pb-1">2. TILE INSPECTOR</h2>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
          <span className="text-slate-400">Location</span>
          <span className="text-yellow-400 font-bold">X:{coords.x} Y:{coords.y} Z:{coords.z}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 mb-1">Biome</div>
                <div className="text-emerald-400 capitalize">{selectedTile?.biome || 'Void'}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded">
                <div className="text-slate-500 mb-1">Block</div>
                <div className="text-white capitalize">{selectedTile?.block.replace('_', ' ') || 'Void'}</div>
            </div>
        </div>

        <div className="bg-slate-900 p-2 rounded space-y-2">
            <div className="flex justify-between">
                <span className="text-slate-400">Walkable</span>
                <span className={selectedTile?.isWalkable ? "text-green-400" : "text-red-400"}>
                    {selectedTile?.isWalkable ? "YES" : "NO"}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-400">Transparent</span>
                <span className={selectedTile?.isTransparent ? "text-green-400" : "text-red-400"}>
                    {selectedTile?.isTransparent ? "YES" : "NO"}
                </span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between">
                 <span className="text-slate-400">Reachable</span>
                 <span className={isReachable ? "text-sky-400 font-bold" : "text-slate-600"}>
                    {isReachable ? `YES (${distance} tiles)` : "NO"}
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};