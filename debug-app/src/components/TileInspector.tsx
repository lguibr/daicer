import React from 'react';
import { Coordinates } from '@daicer/engine';

interface TileInspectorProps {
  coords: Coordinates | null;
  tileData: any | null; // Typed loosely to avoid engine dependency depth here, or import types
  isReachable: boolean;
  distance: number | null;
}

export const TileInspector: React.FC<TileInspectorProps> = ({ coords, tileData, isReachable, distance }) => {
  if (!coords || !tileData) {
    return (
      <div className="p-4 bg-neutral-800 rounded border border-neutral-700 text-neutral-500 text-xs italic text-center">
        Hover over maps to inspect tiles
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded border border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-900 px-3 py-2 border-b border-neutral-700 flex justify-between items-center">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tile Inspector</span>
        <div className="bg-black/50 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
          X:{coords.x} Y:{coords.y} Z:{coords.z}
        </div>
      </div>

      {/* Grid Info */}
      <div className="p-3 grid grid-cols-2 gap-2 text-xs">
        <InfoBox label="Biome" value={tileData.biome} color="text-green-400" />
        <InfoBox label="Block" value={tileData.block} color="text-neutral-200" />

        <StatusBox label="Walkable" status={tileData.isWalkable} />
        <StatusBox label="Transparent" status={tileData.isTransparent} />

        <div className="col-span-2 mt-1">
          <div className="flex justify-between items-center bg-neutral-900 px-2 py-1.5 rounded border border-neutral-700">
            <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Reachable</span>
            <span className={isReachable ? 'text-green-400 font-bold' : 'text-red-500 font-bold'}>
              {isReachable ? `YES (${distance} tiles)` : 'NO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-700">
    <div className="text-[10px] text-neutral-500 uppercase">{label}</div>
    <div className={`font-mono font-bold capitalize ${color}`}>{value.replace('_', ' ')}</div>
  </div>
);

const StatusBox = ({ label, status }: { label: string; status: boolean }) => (
  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-700 flex justify-between items-center">
    <span className="text-[10px] text-neutral-500 uppercase">{label}</span>
    <span className={status ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{status ? 'YES' : 'NO'}</span>
  </div>
);
