import { useState, useEffect, useMemo, useRef } from 'react';
import type { WorldConfig, Coordinates, Tile, Chunk } from '../features/debug/utils/types';
import { Eye, Loader2 } from 'lucide-react';
import { MapRenderer } from '../features/debug/components/MapRenderer';
import { WorldConfigForm } from '../features/debug/components/WorldConfigForm';
import { TileInspector } from '../features/debug/components/TileInspector';

// Default config
const DEFAULT_CONFIG: WorldConfig = {
  seed: 'debug-seed',
  chunkSize: 32,
  globalScale: 0.01,
  seaLevel: 0,
  elevationScale: 1,
  roughness: 0.5,
  detail: 4,
  moistureScale: 1,
  temperatureOffset: 0,
  structureChance: 0.1,
  structureSpacing: 10,
  structureSizeAvg: 10,
  roadDensity: 0.5,
  fogRadius: 10,
};

interface DebugEntity {
  id: string;
  name: string;
  type: 'player' | 'monster';
  position: Coordinates;
  speed: string | number | Record<string, string>;
  parsedSpeed: number;
  visionRadius: number;
  color: string;
}

export default function DebugPage() {
  // Config State
  const [config, setConfig] = useState<WorldConfig>(DEFAULT_CONFIG);

  // Entities
  const [entities, setEntities] = useState<DebugEntity[]>([
    {
      id: 'p1',
      name: 'Hero',
      type: 'player',
      position: { x: 0, y: 0, z: 0 },
      speed: 30,
      parsedSpeed: 30,
      visionRadius: 10,
      color: '#3b82f6',
    },
    {
      id: 'm1',
      name: 'Goblin',
      type: 'monster',
      position: { x: 5, y: 5, z: 0 },
      speed: '30 ft.',
      parsedSpeed: 30,
      visionRadius: 8,
      color: '#ef4444',
    },
  ]);

  const [activeEntityId, setActiveEntityId] = useState<string>('p1');
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!activeEntity) return <div>No entities defined</div>;

  // Map & View State
  const [viewZ, setViewZ] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Inspector State
  const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  const [pathDistance, setPathDistance] = useState<number | null>(null); // Pathfinding disabled for now as it needs backend

  // Chunk Cache
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [isLoading, setIsLoading] = useState(false);

  // POV Logic (Disabled for now until Physics ported to frontend or handled via API)
  const [exploredTiles, setExploredTiles] = useState<Set<string>>(new Set());
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());

  // --- Effects ---

  // Resize Handler
  useEffect(() => {
    const update = () => {
      if (mapRef.current) setMapSize({ w: mapRef.current.clientWidth, h: mapRef.current.clientHeight });
    };
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fetch Chunk logic
  const fetchChunk = async (cx: number, cy: number, cfg: WorldConfig) => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:1337/api/voxel-engine/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: cx, y: cy, config: cfg }),
      });
      if (!res.ok) throw new Error('Failed to fetch chunk');
      const chunk = await res.json();
      setChunkCache((prev) => ({ ...prev, [`${cx},${cy}`]: chunk }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-load center chunk on init or config change
  useEffect(() => {
    // Clear cache on config change
    setChunkCache({});
    fetchChunk(0, 0, config);
  }, [config.seed]); // Only aggressive regen on seed change, otherwise user clicks regenerate

  const handleRegenerate = () => {
    setChunkCache({});
    fetchChunk(0, 0, config);
    setExploredTiles(new Set());
    setVisibleTiles(new Set());
  };

  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => {
        const key = `${x},${y}`;
        if (chunkCache[key]) return chunkCache[key];
        // Simple "fetch on demand" trigger could be here, but React render loop might spam.
        // For debug app, limited to 0,0 usually.
        // If we want infinite scroll, we need a smarter hook.
        // For now, if missing and distance < 2, fetch?
        if (!isLoading) {
          // Debounce/limit logic needed. For now, trust the cache is populated by explicit interactions or centered logic.
          // Actually, let's just try to fetch if not present and close to center
          if (Math.abs(x) <= 1 && Math.abs(y) <= 1) {
            // Creating a floating promise here is dangerous but okay for a debug hack
            // fetchChunk(x, y, config);
          }
        }
        return null;
      },
    }),
    [chunkCache, config, isLoading]
  );

  // Handle Map Interaction
  const handleTileClick = (target: Coordinates) => {
    setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, position: target } : e)));
    if (target.z !== viewZ) setViewZ(target.z);
  };

  const handleTileHover = (coords: Coordinates | null) => {
    setHoveredCoords(coords);
    if (!coords) {
      setHoveredTile(null);
      return;
    }

    // Get Tile Data
    const chunkX = Math.floor(coords.x / 32);
    const chunkY = Math.floor(coords.y / 32);
    const chunk = chunkProvider.getChunk(chunkX, chunkY);
    const lx = ((coords.x % 32) + 32) % 32;
    const ly = ((coords.y % 32) + 32) % 32;
    const lz = coords.z + 3;

    if (chunk && chunk.tiles[lz]) {
      setHoveredTile(chunk.tiles[lz][ly][lx]);
    } else {
      setHoveredTile(null);
    }
  };

  return (
    <div className="flex w-full h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col z-10 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-neutral-900 sticky top-0 z-20">
          <h1 className="text-xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
            AETHER ENGINE <span className="text-[10px] text-neutral-500 font-mono font-normal mt-1">REMOTE DEBUG</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {/* 1. World Gen */}
          <WorldConfigForm
            config={config}
            isActive={!isLoading}
            onConfigChange={setConfig}
            onRegenerate={handleRegenerate}
          />

          {/* 2. Inspector */}
          <TileInspector
            coords={hoveredCoords}
            tileData={hoveredTile}
            isReachable={pathDistance !== null}
            distance={pathDistance}
          />

          {/* 3. View Controls */}
          <div className="space-y-2 bg-neutral-800 p-3 rounded border border-neutral-700">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">3. VIEW CONTROLS</h2>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300">View Layer (Z)</span>
              <div className="flex bg-neutral-900 rounded p-1 gap-1">
                {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
                  <button
                    key={z}
                    onClick={() => setViewZ(z)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono transition-colors ${
                      viewZ === z ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-700'
                    }`}
                  >
                    {z === 0 ? '0' : z}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-neutral-300">Zoom</span>
              <div className="flex items-center gap-2 bg-neutral-900 rounded p-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
                  className="px-2 text-neutral-400 hover:text-white"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono text-blue-400">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  className="px-2 text-neutral-400 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Entities List (Compact) */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Entities</h2>
            {entities.map((ent) => (
              <div
                key={ent.id}
                onClick={() => setActiveEntityId(ent.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-all ${
                  activeEntityId === ent.id
                    ? 'bg-blue-900/20 border-blue-500/50'
                    : 'bg-neutral-800 border-transparent hover:border-neutral-600'
                }`}
              >
                <div className="text-xs font-bold text-neutral-300">{ent.name}</div>
                <Eye className={`w-3 h-3 ${activeEntityId === ent.id ? 'text-blue-400' : 'text-neutral-600'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-2 border-t border-neutral-800 text-[10px] text-neutral-600 font-mono text-center">
          Map Size: {mapSize.w}x{mapSize.h} | Render: Check Backend
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative bg-black" ref={mapRef}>
        <div className="absolute inset-0 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <MapRenderer
            width={mapSize.w}
            height={mapSize.h}
            center={activeEntity.position}
            viewZ={viewZ}
            scale={zoom}
            chunkProvider={chunkProvider}
            visibleTiles={visibleTiles}
            exploredTiles={exploredTiles}
            entities={entities}
            onTileClick={handleTileClick}
            onTileHover={handleTileHover}
          />
        </div>

        {/* Overlay Info */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-neutral-400 flex gap-4">
          <div>
            X: <span className="text-white">{activeEntity.position.x}</span>
          </div>
          <div>
            Y: <span className="text-white">{activeEntity.position.y}</span>
          </div>
          <div>
            Z: <span className="text-blue-400">{activeEntity.position.z}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
