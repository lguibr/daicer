import React from 'react';
import { ZLevel } from '../types';

interface ControlsProps {
  currentZ: ZLevel;
  setZ: (z: ZLevel) => void;
  pos: { x: number, y: number };
  zoom: number;
  setZoom: (z: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({ currentZ, setZ, pos, zoom, setZoom }) => {
  return (
    <div className="absolute top-4 left-4 p-4 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl text-white backdrop-blur-sm select-none">
      <h1 className="text-xl font-bold text-sky-400 mb-2">Aether Engine</h1>
      <div className="space-y-2 text-sm font-mono text-slate-300">
        <p>Coords: <span className="text-yellow-400">X:{pos.x} Y:{pos.y}</span></p>
        
        {/* Z-Level Controls */}
        <div className="flex items-center gap-2">
            <span className="w-12">Layer:</span>
            <div className="flex gap-1">
                {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
                    <button
                        key={z}
                        onClick={() => setZ(z as ZLevel)}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors text-xs ${
                            currentZ === z 
                            ? 'bg-sky-600 text-white font-bold' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                    >
                        {z > 0 ? `+${z}` : z}
                    </button>
                ))}
            </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
            <span className="w-12">Zoom:</span>
            <div className="flex gap-1">
                <button 
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >-</button>
                <span className="w-12 text-center inline-block">{Math.round(zoom * 100)}%</span>
                <button 
                    onClick={() => setZoom(Math.min(3.0, zoom + 0.25))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >+</button>
            </div>
        </div>

        <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="text-xs text-slate-500">
                <span className="text-sky-300">Left Click:</span> Show Path<br/>
                <span className="text-sky-300">Dbl Click:</span> Move/Walk<br/>
                <span className="text-sky-300">Wheel:</span> Zoom
            </p>
        </div>
      </div>
    </div>
  );
};