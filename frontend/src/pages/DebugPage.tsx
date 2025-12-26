import { useState, useEffect, useMemo, useRef } from 'react';
import type { WorldConfig, Coordinates, Tile, Chunk } from '../features/debug/utils/types';
import { Eye, Loader2, AlertCircle } from 'lucide-react';
import { MapRenderer } from '../features/debug/components/MapRenderer';
import { WorldConfigForm } from '../features/debug/components/WorldConfigForm';
import { TileInspector } from '../features/debug/components/TileInspector';
import Navbar from '../components/layout/Navbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';

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
      parsedSpeed: 30, // tiles? let's assume 1 tile = 5ft, so 30ft = 6 tiles
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeEntity) return <div>No entities defined</div>;

  // Map & View State
  const [viewZ, setViewZ] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Inspector State
  const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  // Disabled pathfinding for now
  const [pathDistance] = useState<number | null>(null);

  // Chunk Cache
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [isLoading, setIsLoading] = useState(false);

  // POV Logic
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
  }, [config.seed]);

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
        if (!isLoading) {
          if (Math.abs(x) <= 1 && Math.abs(y) <= 1) {
            // floating promise ok for debug
            // fetchChunk(x, y, config);
          }
        }
        return null;
      },
    }),
    [chunkCache, config, isLoading]
  );

  // Helper to get tile data
  const getTileAt = (x: number, y: number, z: number) => {
    const chunkX = Math.floor(x / 32);
    const chunkY = Math.floor(y / 32);
    const chunk = chunkProvider.getChunk(chunkX, chunkY);
    if (!chunk) return null;

    const lx = ((x % 32) + 32) % 32;
    const ly = ((y % 32) + 32) % 32;
    // Map z -3..3 to 0..6
    const lz = z + 3;

    if (chunk.tiles[lz] && chunk.tiles[lz][ly]) {
      return chunk.tiles[lz][ly][lx];
    }
    return null;
  };

  // Visibility Logic
  useEffect(() => {
    // Recompute visibility whenever entities move
    const newVisible = new Set<string>();
    const newExplored = new Set(exploredTiles);

    entities.forEach((ent) => {
      const r = ent.visionRadius;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const tx = ent.position.x + dx;
            const ty = ent.position.y + dy;
            // For now, visibility is cylindrical (sees all Z) or just current Z?
            // Typically similar Z. Let's say +/- 1 Z level.
            // But map is 2D projection mostly. Let's just use 2D coords.
            const key = `${tx},${ty}`;
            newVisible.add(key);
            newExplored.add(key);
          }
        }
      }
    });

    setVisibleTiles(newVisible);
    setExploredTiles(newExplored);
  }, [entities]); // Should depend on entities positions

  // Handle Map Interaction
  const handleTileClick = (target: Coordinates) => {
    setErrorMsg(null);

    // 1. Check Walkability
    // Need to fetch tile data from cache
    const tile = getTileAt(target.x, target.y, target.z);

    // If we don't know the tile (chunk not loaded), we can't walk there usually.
    // But for debug, maybe allow if void? No, let's block.
    if (!tile) {
      setErrorMsg('Unknown terrain - chunk not loaded');
      return;
    }

    if (!tile.isWalkable) {
      setErrorMsg('Terrain is not walkable');
      return;
    }

    // 2. Check Collision (2 entities same place)
    const occupant = entities.find(
      (e) => e.position.x === target.x && e.position.y === target.y && e.position.z === target.z
    );
    if (occupant && occupant.id !== activeEntityId) {
      setErrorMsg(`Space occupied by ${occupant.name}`);
      return;
    }

    // 3. Check Speed / Distance
    // 5ft per tile. Speed is in ft (e.g. 30).
    const dx = target.x - activeEntity.position.x;
    const dy = target.y - activeEntity.position.y;
    // Euclidean distance in tiles
    const dist = Math.sqrt(dx * dx + dy * dy);

    // dist is in tiles. speed is in ft.
    // maxTiles = parsedSpeed / 5
    const maxTiles = activeEntity.parsedSpeed / 5;

    // We allow small float error margin or use Ceiling
    if (Math.ceil(dist) > maxTiles) {
      setErrorMsg(
        `Too far! Speed ${activeEntity.parsedSpeed}ft (${maxTiles} tiles). Target is ${dist.toFixed(1)} tiles away.`
      );
      return;
    }

    // Move
    setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, position: target } : e)));
    if (target.z !== viewZ) setViewZ(target.z);
  };

  const handleTileHover = (coords: Coordinates | null) => {
    setHoveredCoords(coords);
    if (!coords) {
      setHoveredTile(null);
      return;
    }

    const tile = getTileAt(coords.x, coords.y, coords.z);
    setHoveredTile(tile || null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-midnight-950 text-shadow-100 font-sans">
      <Navbar />

      <div className="flex px-6 py-2 border-b border-midnight-800 bg-midnight-900/50 backdrop-blur">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>World Engine Debug</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-midnight-900 border-r border-midnight-800 flex flex-col z-10 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-midnight-800 bg-midnight-950/80 sticky top-0 z-20">
            <h1 className="text-xl font-black text-aurora-500 tracking-tighter flex items-center gap-2">
              AETHER ENGINE
            </h1>
            <p className="text-[10px] text-shadow-500 font-mono font-normal mt-1 uppercase tracking-widest">
              Real-time Map & Entity Debugger
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent">
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-500" />
                {errorMsg}
              </div>
            )}

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
            <div className="space-y-3 bg-midnight-800/50 p-4 rounded-xl border border-midnight-700/50">
              <h2 className="text-xs font-bold text-aurora-400 uppercase tracking-wider mb-2">View Controls</h2>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-shadow-300">View Layer (Z)</span>
                  <span className="font-mono text-aurora-300">{viewZ}</span>
                </div>
                <div className="flex items-center gap-1 bg-midnight-950/50 rounded-lg p-1 border border-midnight-800">
                  {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
                    // @ts-ignore
                    <button
                      key={z}
                      // @ts-ignore
                      onClick={() => setViewZ(z)}
                      className={`flex-1 h-6 rounded flex items-center justify-center font-mono text-[10px] transition-all ${
                        viewZ === z
                          ? 'bg-aurora-500 text-midnight-950 font-bold shadow-lg shadow-aurora-500/20'
                          : 'text-shadow-500 hover:text-shadow-100 hover:bg-midnight-800'
                      }`}
                    >
                      {z === 0 ? '0' : z}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-midnight-700/50">
                <span className="text-shadow-300">Zoom Level</span>
                <div className="flex items-center gap-2 bg-midnight-950/50 rounded-lg p-1 border border-midnight-800">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
                    className="w-8 h-6 flex items-center justify-center text-shadow-400 hover:text-white hover:bg-midnight-800 rounded"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono text-aurora-400">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    className="w-8 h-6 flex items-center justify-center text-shadow-400 hover:text-white hover:bg-midnight-800 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Entities List (Compact) */}
            <div className="space-y-3 p-4 bg-midnight-800/30 rounded-xl border border-midnight-700/30">
              <h2 className="text-xs font-bold text-shadow-400 uppercase tracking-wider">Active Entities</h2>
              <div className="space-y-2">
                {entities.map((ent) => (
                  <div
                    key={ent.id}
                    onClick={() => setActiveEntityId(ent.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                      activeEntityId === ent.id
                        ? 'bg-aurora-500/10 border-aurora-500/50 shadow-[inset_0_0_10px_rgba(211,143,31,0.05)]'
                        : 'bg-midnight-950/40 border-transparent hover:border-midnight-700 hover:bg-midnight-900'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${activeEntityId === ent.id ? 'text-aurora-200' : 'text-shadow-300'}`}
                      >
                        {ent.name}
                      </span>
                      <span className="text-[10px] text-shadow-500 uppercase tracking-wide">{ent.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-mono text-right">
                        <div className="text-shadow-400">SPD: {ent.parsedSpeed}</div>
                        <div className="text-shadow-600">VIS: {ent.visionRadius}</div>
                      </div>
                      <Eye className={`w-4 h-4 ${activeEntityId === ent.id ? 'text-aurora-400' : 'text-shadow-600'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-midnight-800 bg-midnight-950 text-[10px] text-shadow-600 font-mono text-center">
            View: {mapSize.w}x{mapSize.h}px | Engine: Voxel V2
          </div>
        </div>

        {/* Main Map */}
        <div className="flex-1 relative bg-black" ref={mapRef}>
          <div className="absolute inset-0 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-aurora-500 animate-spin" />
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
          <div className="absolute top-4 right-4 bg-midnight-950/80 backdrop-blur border border-midnight-700/50 px-4 py-2 rounded-full text-xs font-mono text-shadow-400 flex gap-4 pointer-events-none shadow-xl">
            <div>
              X: <span className="text-shadow-100">{activeEntity.position.x}</span>
            </div>
            <div>
              Y: <span className="text-shadow-100">{activeEntity.position.y}</span>
            </div>
            <div>
              Z: <span className="text-aurora-400">{activeEntity.position.z}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
