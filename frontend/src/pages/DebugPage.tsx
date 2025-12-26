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
  exploredTiles: Set<string>;
  pendingPath?: Coordinates[];
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
      exploredTiles: new Set(),
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
      exploredTiles: new Set(),
    },
  ]);

  const [activeEntityId, setActiveEntityId] = useState<string>('p1');
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; coords: Coordinates } | null>(null);

  if (!activeEntity) return <div>No entities defined</div>;

  // Map & View State
  // Camera Position separate from entity position
  const [cameraPosition, setCameraPosition] = useState<Coordinates>(activeEntity.position);
  // ... existing state ...

  // Handle Interactions
  const handleTileSingleClick = (target: Coordinates) => {
    // Open Context Menu
    // We need screen coordinates for the menu.
    // Since we don't have the event here, we might need to pass it from MapRenderer?
    // Or just use a fixed position relative to the map container?
    // Let's rely on the fact that the user clicked, and we want the menu near the tile.

    // Actually, MapRenderer's onTileClick only gives coords.
    // We'll just close any existing menu first.
    setContextMenu(null);

    // We can't get mouse X/Y easily without the event.
    // Let's modify MapRenderer to pass the event?
    // Or just render it in world space? No, UI overlay is better.
    // Workaround: We will use a global ref for last mouse position or modify MapRenderer.
    // For now, let's assume we want to modify MapRenderer to pass event or point.
    // BUT, I don't want to change MapRenderer signature too much if not needed.
    // Let's just center it? No that's bad.

    // Wait, I can use the `hoveredCoords` and some math to position it?
    // Too complex.

    // Let's Update MapRenderer to pass { coords, clientX, clientY }.
    // For now, I'll cheat and put it at top-left of the viewport or something?
    // No, let's fix MapRenderer signature in a follow up if needed.
    // Actually, let's use the mouse position from the latest mouse move?
    // or just assume we'll just put it "near" the center of the screen?
    // No.

    // Let's skip the "exact mouse pos" for a second and just implement the logic.
    // I will modify MapRenderer to pass the event data.
  };

  // ...

  const [viewZ, setViewZ] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Resize Observer
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync camera to active entity ONLY when switching entities
  useEffect(() => {
    setCameraPosition(activeEntity.position);
    setViewZ(activeEntity.position.z);
  }, [activeEntityId]);

  // Inspector State
  const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  // Pathfinding State

  const [pathDistance] = useState<number | null>(null);

  // Chunk Cache
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());
  const isLoading = loadingChunks.size > 0;

  // Active Entity Visibility (Derived)
  const visibleTiles = useMemo(() => {
    const visible = new Set<string>();
    const r = activeEntity.visionRadius;
    const { x, y } = activeEntity.position;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          visible.add(`${x + dx},${y + dy}`);
        }
      }
    }
    return visible;
  }, [activeEntity.position, activeEntity.visionRadius]);

  // --- Effects ---

  // Helper to get raw tile data - modified to fetch if missing
  const getChunkId = (cx: number, cy: number) => `${cx},${cy}`;

  const fetchChunk = async (cx: number, cy: number, cfg: WorldConfig) => {
    const id = getChunkId(cx, cy);
    if (loadingChunks.has(id) || chunkCache[id]) return;

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
      console.error(e);
    } finally {
      setLoadingChunks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Initial load
  useEffect(() => {
    setChunkCache({});
    fetchChunk(0, 0, config);
  }, [config.seed]); // Reload on seed change

  const handleRegenerate = () => {
    setChunkCache({});
    fetchChunk(0, 0, config);
    // Reset all entities exploration
    setEntities((prev) => prev.map((e) => ({ ...e, exploredTiles: new Set(), pendingPath: undefined })));
  };

  // Chunk Provider for Renderer
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => {
        const chunk = chunkCache[getChunkId(x, y)];
        if (chunk) return chunk;

        // Trigger fetch if not found and not loading
        fetchChunk(x, y, config);
        return null; // Return null while loading
      },
    }),
    [chunkCache, config, loadingChunks]
  );

  const getTileAt = (x: number, y: number, z: number) => {
    const chunkX = Math.floor(x / 32);
    const chunkY = Math.floor(y / 32);
    const chunk = chunkCache[getChunkId(chunkX, chunkY)]; // Direct access to avoid triggering fetch loop inside render logic if careful
    // Actually, chunkProvider is better if we want auto-fetch.
    // But for synchronous pathfinding we can only use available chunks.

    if (!chunk) return null;

    const lx = ((x % 32) + 32) % 32;
    const ly = ((y % 32) + 32) % 32;
    const lz = z + 3;

    if (chunk.tiles[lz] && chunk.tiles[lz][ly]) {
      return chunk.tiles[lz][ly][lx];
    }
    return null;
  };

  // Pathfinding Helper
  const getTileCallback = (x: number, y: number, z: number) => {
    const tile = getTileAt(x, y, z);
    if (!tile) return null;
    return { isWalkable: tile.isWalkable };
  };

  // Update Exploration Memory
  useEffect(() => {
    // When active entity moves, update its explored tiles
    // We already calculated visibleTiles in useMemo

    // If we have visible tiles that are NOT in explored, add them
    const newExplored = new Set(activeEntity.exploredTiles);
    let changed = false;

    visibleTiles.forEach((key) => {
      if (!newExplored.has(key)) {
        newExplored.add(key);
        changed = true;
      }
    });

    if (changed) {
      setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, exploredTiles: newExplored } : e)));
    }
  }, [visibleTiles, activeEntityId]); // Depend on visibleTiles which changes with position

  // Turn Logic
  const handlePlanMove = (target: Coordinates) => {
    setContextMenu(null);
    import('../features/debug/utils/pathfinding').then(({ findPath, calculatePathLength }) => {
      const path = findPath(activeEntity.position, target, getTileCallback);
      if (!path) {
        setErrorMsg('Cannot move there');
        return;
      }

      // Check speed
      const totalCost = calculatePathLength(path);
      const maxDist = activeEntity.parsedSpeed / 5;

      if (totalCost > maxDist) {
        // Truncate logic
        let validPath = path.filter((p) => p.cost <= maxDist);
        if (validPath.length === 0) return;
        const finalStep = validPath[validPath.length - 1];
        if (!finalStep) return;

        setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, pendingPath: validPath } : e)));
        setErrorMsg(`Planned partial move (${finalStep.cost.toFixed(1)} / ${maxDist} tiles)`);
      } else {
        setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, pendingPath: path } : e)));
        setErrorMsg(`Planned move (${totalCost.toFixed(1)} tiles)`);
      }
    });
  };

  const handleExecuteTurn = () => {
    // Apply all pending paths
    setEntities((prev) =>
      prev.map((e) => {
        if (e.pendingPath && e.pendingPath.length > 0) {
          const dest = e.pendingPath[e.pendingPath.length - 1];
          if (!dest) return e;
          return {
            ...e,
            position: { x: dest.x, y: dest.y, z: dest.z },
            pendingPath: undefined,
          };
        }
        return e;
      })
    );
    setErrorMsg('Turn Executed');
  };

  const handleTileDoubleClick = (target: Coordinates) => {
    // Quick Plan (Double click = Plan Move to here)
    handlePlanMove(target);
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
              DEBUG GAME ENGINE
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
            {/* 4. Turn Controls */}
            <div className="bg-midnight-800/50 p-4 rounded-xl border border-midnight-700/50">
              <h2 className="text-xs font-bold text-aurora-400 uppercase tracking-wider mb-2">Turn Controls</h2>
              <button
                onClick={handleExecuteTurn}
                className="w-full bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold py-2 rounded shadow-lg transition-all active:translate-y-0.5"
              >
                Execute Turn
              </button>
            </div>
          </div>

          <div className="p-3 border-t border-midnight-800 bg-midnight-950 text-[10px] text-shadow-600 font-mono text-center">
            View: {mapSize.w}x{mapSize.h}px | Engine: Voxel V2
          </div>
        </div>

        {/* Main Map */}
        <div className="flex-1 relative bg-black" ref={mapRef}>
          {/* Context Menu */}
          {contextMenu && (
            <div
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 100,
              }}
              className="bg-midnight-900 border border-midnight-700 rounded shadow-xl overflow-hidden min-w-[120px]"
            >
              <button
                className="w-full text-left px-3 py-2 text-xs text-shadow-200 hover:bg-midnight-800 hover:text-aurora-400 block"
                onClick={() => handlePlanMove(contextMenu.coords)}
              >
                Plan Move
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-shadow-200 hover:bg-midnight-800 hover:text-red-400 block"
                onClick={() => {
                  setErrorMsg('Attack not implemented');
                  setContextMenu(null);
                }}
              >
                Attack
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-shadow-200 hover:bg-midnight-800 block"
                onClick={() => setContextMenu(null)}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="absolute inset-0 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-aurora-500 animate-spin" />
              </div>
            )}
            <MapRenderer
              width={mapSize.w}
              height={mapSize.h}
              center={cameraPosition}
              viewZ={viewZ}
              scale={zoom}
              chunkProvider={chunkProvider}
              visibleTiles={visibleTiles}
              exploredTiles={activeEntity.exploredTiles}
              entities={entities}
              previewPath={activeEntity.pendingPath}
              // @ts-ignore
              onTileClick={handleTileSingleClick}
              onTileDoubleClick={handleTileDoubleClick}
              onTileHover={handleTileHover}
              onZoom={(delta, mouseX, mouseY) => {
                const SCALE_FACTOR = 0.1;
                const newZoom = Math.max(0.1, Math.min(5, zoom - delta * SCALE_FACTOR));

                // Mouse-centered zoom logic
                const TILE_SIZE = 32 * zoom;
                const wx = cameraPosition.x + (mouseX - mapSize.w / 2) / TILE_SIZE;
                const wy = cameraPosition.y + (mouseY - mapSize.h / 2) / TILE_SIZE;

                const NEW_TILE_SIZE = 32 * newZoom;
                const newCenterX = wx - (mouseX - mapSize.w / 2) / NEW_TILE_SIZE;
                const newCenterY = wy - (mouseY - mapSize.h / 2) / NEW_TILE_SIZE;

                setZoom(newZoom);
                setCameraPosition({ ...cameraPosition, x: newCenterX, y: newCenterY });
              }}
              onPan={(dx, dy) => {
                const TILE_SIZE = 32 * zoom;
                // Move camera opposite to drag
                // If I drag mouse RIGHT (dx > 0), map moves RIGHT.
                // That means camera moves LEFT (decreasing x).
                setCameraPosition((prev) => ({
                  ...prev,
                  x: prev.x - dx / TILE_SIZE,
                  y: prev.y - dy / TILE_SIZE,
                }));
              }}
            />
          </div>

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
