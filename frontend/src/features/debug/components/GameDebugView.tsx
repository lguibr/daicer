import { useState, useEffect, useMemo, useRef } from 'react';
import type { WorldConfig as OldWorldConfig, Coordinates, Chunk } from '../utils/types';
import { MapRenderer } from './MapRenderer';
import { GodModeChat, type GodModeMessage } from './GodModeChat'; // New Chat Component
import useSocket from '@/hooks/useSocket';
import clsx from 'clsx';

// Default config
const DEFAULT_CONFIG: OldWorldConfig = {
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

interface GameDebugViewProps {
  roomId: string;
}

export function GameDebugView({ roomId }: GameDebugViewProps) {
  // Config State
  const [config] = useState<OldWorldConfig>(DEFAULT_CONFIG);

  // Entities
  const [entities, setEntities] = useState<DebugEntity[]>([]);
  // const [activeEntityId, setActiveEntityId] = useState<string>('');
  const activeEntityId = ''; // Default to empty or first if needed, logic below handles it
  const activeEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  // const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { socket } = useSocket(roomId, 'debug-user');

  // God Mode Chat State
  const [chatMessages, setChatMessages] = useState<GodModeMessage[]>([
    {
      id: 'system-welcome',
      role: 'system',
      content: 'God Mode Initialized. You have omnipotent control over this world.',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Socket Integration
  useEffect(() => {
    if (!socket) return;
    const handleEntitiesUpdate = (data: { entities: any[] }) => {
      console.log('Socket Update:', data);
      setEntities((prev) => {
        const next = [...prev];
        if (data.entities) {
          data.entities.forEach((u) => {
            const idx = next.findIndex((e) => e.id === u.id);
            if (idx !== -1 && next[idx]) {
              next[idx] = {
                ...next[idx],
                ...u,
                position: u.position || next[idx].position,
              };
            }
          });
        }
        return next;
      });
    };

    // Also listen for God Mode responses
    const handleGodModeResponse = (data: { message: string }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        },
      ]);
      setIsProcessing(false);
    };

    socket.on('entities:update', handleEntitiesUpdate);
    socket.on('godmode:response', handleGodModeResponse); // Hypothetical event

    return () => {
      socket.off('entities:update', handleEntitiesUpdate);
      socket.off('godmode:response', handleGodModeResponse);
    };
  }, [socket]);

  // Map & View State
  const [cameraPosition, setCameraPosition] = useState<Coordinates>({ x: 0, y: 0, z: 0 });

  // Handle Interactions
  const handleTileSingleClick = (target: Coordinates) => {
    // Append coordinates to chat input
    const coordString = `(${target.x}, ${target.y}, ${target.z})`;
    setChatInput((prev) => {
      const separator = prev.endsWith(' ') ? '' : ' ';
      return prev + separator + coordString;
    });

    // Open Context Menu (Still optional, but maybe user wants it?)
    // For now, let's keep context menu logic effectively disabled or minimal if God Mode is primary
  };

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
    if (activeEntity) {
      setCameraPosition(activeEntity.position);
      setViewZ(activeEntity.position.z);
    }
  }, [activeEntityId, activeEntity]);

  // Inspector State
  // const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  // const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  // Pathfinding State
  // const [pathDistance] = useState<number | null>(null);

  // Chunk Cache
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());

  // Active Entity Visibility (Derived)
  const visibleTiles = useMemo(() => {
    if (!activeEntity) return new Set<string>();

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
  }, [activeEntity?.position, activeEntity?.visionRadius]);

  // --- Effects ---

  // Batching Refs
  const batchQueue = useRef<Set<string>>(new Set());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper to get raw tile data - modified to fetch if missing
  const getChunkId = (cx: number, cy: number) => `${cx},${cy}`;

  const processBatch = async () => {
    if (batchQueue.current.size === 0) return;

    // Snapshot queue
    const queuedIds = Array.from(batchQueue.current);
    batchQueue.current.clear();
    batchTimeout.current = null;

    const chunksToFetch = queuedIds
      .map((id) => {
        const [x, y] = id.split(',').map(Number);
        if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) return null;
        return { x, y };
      })
      .filter((c): c is { x: number; y: number } => c !== null);

    try {
      // GraphQL Query
      const query = `
        query VoxelPreview($chunks: [ChunkRequestInput]!, $config: WorldConfigInput!) {
          voxelPreview(chunks: $chunks, config: $config)
        }
      `;

      const response = await fetch('http://localhost:1337/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt') || ''}`, // Pass auth if needed, though resolver is public
        },
        body: JSON.stringify({
          query,
          variables: {
            chunks: chunksToFetch,
            config: config,
          },
        }),
      });

      const json = await response.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      const results = json.data?.voxelPreview;

      if (Array.isArray(results)) {
        setChunkCache((prev) => {
          const next = { ...prev };
          results.forEach((chunk: Chunk, index: number) => {
            const req = chunksToFetch[index];
            if (req) {
              next[getChunkId(req.x, req.y)] = chunk;
            }
          });
          return next;
        });
      }
    } catch (e) {
      console.error('Batch Fetch Failed', e);
      // Remove from loading so they can be retried?
      // Or keep them as loading to prevent flood loop on error?
      // For now, allow retry after some time or just log.
    } finally {
      // Clear loading status
      setLoadingChunks((prev) => {
        const next = new Set(prev);
        queuedIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const fetchChunk = (cx: number, cy: number) => {
    const id = getChunkId(cx, cy);
    if (loadingChunks.has(id) || chunkCache[id]) return;

    // Add to loading immediately to prevent duplicate queueing
    setLoadingChunks((prev) => new Set(prev).add(id));

    // Add to batch queue
    batchQueue.current.add(id);

    // Debounce
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }
    batchTimeout.current = setTimeout(processBatch, 50); // 50ms batch window
  };

  // Initial load
  useEffect(() => {
    setChunkCache({});
    fetchChunk(0, 0); // Reload on seed change
  }, [config.seed]);

  // Chunk Provider for Renderer
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => {
        const chunk = chunkCache[getChunkId(x, y)];
        if (chunk) return chunk;

        // Trigger fetch if not found and not loading
        fetchChunk(x, y);
        return null; // Return null while loading
      },
    }),
    [chunkCache, config, loadingChunks]
  );

  const getTileAt = (x: number, y: number, z: number) => {
    const chunkX = Math.floor(x / 32);
    const chunkY = Math.floor(y / 32);
    const chunk = chunkCache[getChunkId(chunkX, chunkY)];

    if (!chunk) return null;

    const lx = ((x % 32) + 32) % 32;
    const ly = ((y % 32) + 32) % 32;
    const lz = z + 3;

    if (!chunk.tiles || lz < 0 || lz >= chunk.tiles.length) return null;

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
    if (!activeEntity) return;
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
  }, [visibleTiles, activeEntityId, activeEntity]);

  // Turn Logic (Movement only via Plan Move context menu for debug)
  const handlePlanMove = (target: Coordinates) => {
    if (!activeEntity) return;

    import('../utils/pathfinding').then(({ findPath, calculatePathLength }) => {
      const path = findPath(activeEntity.position, target, getTileCallback);
      if (!path) {
        console.warn('Cannot move there');
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
        console.log(`Planned partial move (${finalStep.cost.toFixed(1)} / ${maxDist} tiles)`);
      } else {
        setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, pendingPath: path } : e)));
        console.log(`Planned move (${totalCost.toFixed(1)} tiles)`);
      }
    });
  };

  const handleTileDoubleClick = (target: Coordinates) => {
    handlePlanMove(target);
  };

  const handleTileHover = (_: Coordinates | null) => {
    // Optional inspector hook
  };

  // Chat Handler
  const handleGodModeCommand = async (message: string) => {
    // Optimistic UI
    const userMsg: GodModeMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // Placeholder for backend call
      // In real implementation: await api.sendGodModeCommand(roomId, message);
      console.warn('God Mode Command Sent (Mock):', message);

      // Mock response for now if socket doesn't reply immediately
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'assistant',
            content: `I heard you say "${message}". (Backend service pending implementation)`,
            timestamp: Date.now(),
          },
        ]);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown'}`,
          timestamp: Date.now(),
        },
      ]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: God Mode Chat & Status */}
      <div className="w-[400px] flex-shrink-0 bg-midnight-950 border-r border-midnight-800 flex flex-col z-10 shadow-2xl">
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-4">
          {/* Chat takes up most space */}
          <div className="flex-1 min-h-0">
            <GodModeChat
              messages={chatMessages}
              onSendMessage={handleGodModeCommand}
              isProcessing={isProcessing}
              inputValue={chatInput}
              onInputChange={setChatInput}
            />
          </div>

          {/* Quick Status / Entity Inspector (Mini) */}
          <div className="h-1/3 bg-midnight-900/50 rounded-xl border border-midnight-800 p-4 overflow-y-auto min-h-[200px]">
            <h3 className="text-xs font-bold text-shadow-400 uppercase tracking-wider mb-2 sticky top-0 bg-midnight-900/50 backdrop-blur pb-2">
              Inspector
            </h3>
            {activeEntity ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-midnight-800 flex items-center justify-center text-lg">
                    {activeEntity.type === 'player' ? '👤' : '👾'}
                  </div>
                  <div>
                    <div className="font-bold text-aurora-300 text-sm">{activeEntity.name || activeEntity.id}</div>
                    <div className="text-[10px] text-shadow-400 font-mono">
                      {activeEntity.position.x}, {activeEntity.position.y}, {activeEntity.position.z}
                    </div>
                  </div>
                </div>
                {/* Stats if available */}
                {/* @ts-ignore */}
                {activeEntity.stats && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-shadow-300">
                    <div className="bg-midnight-950 p-1 rounded border border-midnight-700">
                      {/* @ts-ignore */}
                      HP: <span className="text-red-400">{activeEntity.stats.hp}</span>
                    </div>
                    <div className="bg-midnight-950 p-1 rounded border border-midnight-700">
                      {/* @ts-ignore */}
                      AC: <span className="text-blue-400">{activeEntity.stats.ac}</span>
                    </div>
                  </div>
                )}
                <div className="text-[10px] font-mono text-shadow-500 mt-2 break-all">ID: {activeEntity.id}</div>
              </div>
            ) : (
              <div className="text-center text-shadow-500 text-xs py-8">Select an entity on map to inspect</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Map & Overlays */}
      <div className="flex-1 relative bg-black flex flex-col min-w-0" ref={mapRef}>
        {/* Top Bar Overlays */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-20 pointer-events-none">
          {/* Left: Turn Info (Placeholder if needed, or just connection status) */}
          <div className="pointer-events-auto bg-midnight-900/90 backdrop-blur border border-midnight-700 rounded-lg p-2 shadow-xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socket ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[10px] font-mono text-shadow-300">{roomId}</span>
            </div>
          </div>

          {/* Right: View Controls */}
          <div className="pointer-events-auto bg-midnight-900/90 backdrop-blur border border-midnight-700 rounded-lg p-2 shadow-xl flex flex-col gap-2">
            <div className="flex flex-col items-center gap-1">
              <button
                className="h-6 w-6 flex items-center justify-center text-shadow-300 hover:text-white"
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              >
                +
              </button>
              <span className="text-[9px] font-mono text-shadow-300">{Math.round(zoom * 100)}%</span>
              <button
                className="h-6 w-6 flex items-center justify-center text-shadow-300 hover:text-white"
                onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* Layer Control (Bottom Center) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-midnight-900/90 backdrop-blur border border-midnight-700 rounded-full px-4 py-2 shadow-xl flex items-center gap-2">
            <span className="text-[10px] text-shadow-400 uppercase mr-2 font-bold">Z-Link</span>
            {[-1, 0, 1].map((z) => (
              <button
                key={z}
                // @ts-ignore
                onClick={() => setViewZ(z)}
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs transition-all',
                  viewZ === z
                    ? 'bg-aurora-500 text-midnight-950 font-bold shadow-lg shadow-aurora-500/50 scale-110'
                    : 'text-shadow-400 hover:bg-midnight-800 hover:text-aurora-200'
                )}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MapRenderer
            width={mapSize.w}
            height={mapSize.h}
            center={cameraPosition}
            viewZ={viewZ}
            scale={zoom}
            chunkProvider={chunkProvider}
            visibleTiles={visibleTiles}
            exploredTiles={activeEntity?.exploredTiles || new Set()}
            entities={entities}
            ghostEntities={[]}
            previewPath={activeEntity?.pendingPath}
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
              setCameraPosition((prev) => ({
                ...prev,
                x: prev.x - dx / TILE_SIZE,
                y: prev.y - dy / TILE_SIZE,
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
