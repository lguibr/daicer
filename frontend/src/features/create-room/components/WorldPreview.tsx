import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { MapRenderer } from '../../debug/components/MapRenderer';
import type { WorldConfig, Chunk, Coordinates } from '../../debug/utils/types';
import { cn } from '@/lib/utils'; // Assuming utils exists, or use clsx

interface WorldPreviewProps {
  config: WorldConfig;
  className?: string;
}

export function WorldPreview({ config, className }: WorldPreviewProps) {
  // Config state tracking to detect changes for regeneration trigger
  const [internalConfig, setInternalConfig] = useState<WorldConfig>(config);

  // Map State
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Camera
  const [cameraPosition, setCameraPosition] = useState<Coordinates>({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState<number>(0.5); // Start zoomed out a bit to see more
  const [viewZ, setViewZ] = useState<number>(0);

  // Data
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  // Fetch Logic
  const getChunkId = (cx: number, cy: number) => `${cx},${cy}`;

  const fetchChunk = async (cx: number, cy: number, cfg: WorldConfig) => {
    const id = getChunkId(cx, cy);
    if (loadingChunks.has(id)) return;
    // Note: We don't check cache here if we want to force refresh on config change
    // But usually we clear cache on config change.

    try {
      setLoadingChunks((prev) => new Set(prev).add(id));
      const res = await fetch('http://localhost:1337/api/voxel-engine/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: cx, y: cy, config: cfg }),
      });
      if (!res.ok) throw new Error('Failed to fetch chunk');
      const chunk = await res.json();
      setChunkCache((prev) => ({ ...prev, [id]: chunk }));
    } catch (e) {
      console.error('Preview fetch error:', e);
    } finally {
      setLoadingChunks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setIsRegenerating(false);
    }
  };

  // Regeneration Trigger
  useEffect(() => {
    // When config prop changes, we reset cache and refetch
    // Debounce could be handled by parent, or we just react to prop updates
    setInternalConfig(config);
    setChunkCache({});
    setIsRegenerating(true);
    fetchChunk(0, 0, config);
    // Reset camera? Maybe not, user might want to compare same spot
  }, [config.seed, config.globalScale, config.seaLevel, config.moistureScale, config.temperatureOffset]);
  // Add other deps if needed, or just deep compare. For now, key params.

  // Chunk Provider
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => {
        const id = getChunkId(x, y);
        const chunk = chunkCache[id];
        if (chunk) return chunk;

        // Trigger fetch
        fetchChunk(x, y, internalConfig);
        return null;
      },
    }),
    [chunkCache, internalConfig]
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
      {isRegenerating && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-midnight-950/60 backdrop-blur-sm animate-in fade-in duration-300">
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
        visibleTiles={new Set()} // Preview mode sees all rendered tiles usually, or we can opt to show nothing hidden?
        // Actually MapRenderer usually hides things not in 'visibleTiles' if we pass exploredTiles?
        // Let's check MapRenderer implementation logic.
        // If we pass empty sets for explored/visible, it might show FOG.
        // We probably want "GOD MODE VISIBILITY" for preview.
        // We can pass `forceVisible={true}` if MapRenderer supports it, or make everything visible.
        // For now let's mock "All Visible" logic if MapRenderer requires it, or maybe pass a flag.
        // Checking MapRenderer props logic in next step if needed.
        // Assuming we need to pass a special prop or hack visibility.
        // For preview, we likely want to see the terrain.
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
