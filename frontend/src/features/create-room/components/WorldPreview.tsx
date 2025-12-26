import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChunkLoader } from '@/hooks/useChunkLoader';
import { MapRenderer } from '../../debug/components/MapRenderer';
import type { WorldConfig, Coordinates } from '../../debug/utils/types';

interface WorldPreviewProps {
  config: WorldConfig;
  className?: string;
}

const PREVIEW_RADIUS_CHUNKS = 4; // Configurable radius

export function WorldPreview({ config, className }: WorldPreviewProps) {
  // Map State
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Camera
  const [cameraPosition, setCameraPosition] = useState<Coordinates>({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState<number>(0.5);
  const [viewZ, setViewZ] = useState<number>(0);

  // Chunk Loader
  const { getChunk, isLoading, resetCache } = useChunkLoader({ config });

  // Reset cache when config changes (handled by hook mostly, but if we need explicit reset on mount/unmount or special triggers)
  // The hook handles config dependency reset.

  // Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Chunk Provider with Radius Restriction
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => {
        // Limit fetching to a radius around center (0,0)
        // Since preview is centered at (0,0) usually
        const dist = Math.sqrt(x * x + y * y);
        if (dist > PREVIEW_RADIUS_CHUNKS) return null;

        return getChunk(x, y);
      },
    }),
    [getChunk]
  );

  return (
    <div
      className={cn(
        'relative w-full h-full bg-black rounded-xl overflow-hidden border border-midnight-700 shadow-inner group',
        className
      )}
      ref={mapContainerRef}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-midnight-950/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-none">
          <Loader2 className="w-8 h-8 text-aurora-500 animate-spin mb-2" />
          <p className="text-xs font-bold text-shadow-200 uppercase tracking-widest">Generating Preview</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 transition-opacity opacity-0 group-hover:opacity-100 duration-300">
        <div className="bg-midnight-900/80 backdrop-blur border border-midnight-700 rounded-lg p-1.5 flex flex-col gap-2 shadow-xl">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="w-6 h-6 flex items-center justify-center text-shadow-200 hover:text-white hover:bg-midnight-700 rounded transition-colors text-xs font-bold"
            >
              +
            </button>
            <span className="text-[9px] font-mono text-aurora-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
              className="w-6 h-6 flex items-center justify-center text-shadow-200 hover:text-white hover:bg-midnight-700 rounded transition-colors text-xs font-bold"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Layer Controls (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-opacity opacity-0 group-hover:opacity-100 duration-300">
        <div className="bg-midnight-900/80 backdrop-blur border border-midnight-700 rounded-lg px-2 py-1 flex items-center gap-1 shadow-xl">
          <span className="text-[10px] text-shadow-400 uppercase tracking-wider mr-2">Layer</span>
          {[-1, 0, 1].map((z) => (
            <button
              key={z}
              onClick={() => setViewZ(z)}
              className={cn(
                'w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] transition-all',
                viewZ === z
                  ? 'bg-aurora-500 text-midnight-950 font-bold shadow-lg shadow-aurora-500/20'
                  : 'text-shadow-500 hover:text-shadow-100 hover:bg-midnight-800'
              )}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <MapRenderer
        width={mapSize.w}
        height={mapSize.h}
        center={cameraPosition}
        viewZ={viewZ}
        scale={zoom}
        chunkProvider={chunkProvider}
        visibleTiles={new Set()}
        exploredTiles={new Set()}
        entities={[]}
        ghostEntities={[]}
        onTileClick={() => {}}
        onTileDoubleClick={() => {}}
        onTileHover={() => {}}
        onZoom={(delta) => setZoom((z) => Math.max(0.1, Math.min(3, z - delta * 0.1)))}
        onPan={(dx, dy) => {
          const TILE_SIZE = 32 * zoom;
          setCameraPosition((prev) => ({
            x: prev.x - dx / TILE_SIZE,
            y: prev.y - dy / TILE_SIZE,
            z: prev.z,
          }));
        }}
      />
    </div>
  );
}
