/**
 * Layer Viewer Component
 * Shows 2D view of terrain with z-level controls
 * Based on user's diagram: Characters (red), Vision radius (green circles), Z-index slider
 */

import { useState } from 'react';
import { ChevronUp, ChevronDown, Layers, User } from 'lucide-react';
import { MapRenderer } from '../world/MapRenderer';

interface LayerViewerProps {
  roomId: string;
}

export function LayerViewer({ roomId }: LayerViewerProps) {
  const [currentLayer, setCurrentLayer] = useState(0);
  const maxLayers = 32; // Total depth
  const [showVisionRadius, setShowVisionRadius] = useState(true);
  const [showRoomGrid, setShowRoomGrid] = useState(true);

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300">
          <Layers className="inline-block w-5 h-5 mr-2" />
          Terrain Explorer
        </h3>

        {/* Z-Index Slider (Vertical Layer Control) */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-shadow-500">Z-Index</span>
          <button
            type="button"
            onClick={() => setCurrentLayer(Math.max(-16, currentLayer - 1))}
            disabled={currentLayer === -16}
            className="btn-secondary p-2 disabled:opacity-50"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-mono font-bold text-aurora-300">{currentLayer}</span>
            <span className="text-xs text-shadow-500">
              {currentLayer < 0 ? 'Underground' : currentLayer === 0 ? 'Surface' : 'Sky'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentLayer(Math.min(16, currentLayer + 1))}
            disabled={currentLayer === 16}
            className="btn-secondary p-2 disabled:opacity-50"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex gap-3 mb-4">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showVisionRadius}
            onChange={(e) => setShowVisionRadius(e.target.checked)}
            className="rounded border-midnight-400 text-aurora-400"
          />
          <span className="text-shadow-300">Vision Radius</span>
          <div className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showRoomGrid}
            onChange={(e) => setShowRoomGrid(e.target.checked)}
            className="rounded border-midnight-400 text-aurora-400"
          />
          <span className="text-shadow-300">Room Grid</span>
          <div className="w-3 h-3 border border-shadow-600 bg-shadow-900/50" />
        </label>
      </div>

      {/* Terrain Preview */}
      <div className="rounded-lg border border-midnight-600 bg-midnight-900/70 p-4 min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Layers className="w-12 h-12 text-shadow-600 mx-auto" />
          <p className="text-sm text-shadow-400">
            Layer {currentLayer} - {currentLayer < 0 ? 'Underground' : currentLayer === 0 ? 'Surface' : 'Sky'}
          </p>
          <p className="text-xs text-shadow-500">Voxel visualization coming soon</p>
          <div className="mt-4 text-xs text-shadow-500">
            <User className="inline-block w-4 h-4 text-red-400 mr-1" />
            Characters will appear as red dots with green vision radius
          </div>
        </div>
      </div>

      {/* Layer Legend */}
      <div className="mt-4 grid gap-2 grid-cols-2 md:grid-cols-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span className="text-shadow-400">User/Char</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
          <span className="text-shadow-400">Vision Radius</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-shadow-600 bg-shadow-900/50" />
          <span className="text-shadow-400">Room Grid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-stone-700" />
          <span className="text-shadow-400">Underground</span>
        </div>
      </div>
    </div>
  );
}
