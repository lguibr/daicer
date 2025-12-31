import { useState, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import useSocket from '@/hooks/useSocket';
import { useChunkLoader } from '@/hooks/useChunkLoader';
import { TimeFrameProvider, useTimeFrame } from '@/contexts/TimeFrameContext'; // Added Provider
import { getRoomState } from '@/services/api';
import type { WorldConfig as OldWorldConfig, Coordinates } from '../utils/types';
import { GodModeChat, type GodModeMessage } from './GodModeChat'; // New Chat Component
import { TimeControls } from './TimeControls';

import { MapRenderer } from './MapRenderer';

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
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Room Data (History & TimeFrames) manually to avoid @apollo/client import issues
  useEffect(() => {
    let mounted = true;
    const fetchRoom = async () => {
      try {
        const r = await getRoomState(roomId);
        if (mounted) {
          setRoom(r);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchRoom();

    // Poll every 5s
    const interval = setInterval(fetchRoom, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // const room = data?.rooms?.[0]; // Removed

  if (loading) return <div className="text-white p-10">Loading Room...</div>;
  if (error) return <div className="text-red-500 p-10">Error loading room: {error}</div>;
  if (!room) return <div className="text-yellow-500 p-10">Room not found (ID: {roomId})</div>;

  return (
    <TimeFrameProvider room={room}>
      <GameDebugInner roomId={roomId} room={room} />
    </TimeFrameProvider>
  );
}

import { AgentToolPalette } from './AgentToolPalette';

// ... (existing imports)

function GameDebugInner({ roomId, room }: { roomId: string; room: any }) {
  // Config State
  const [activeTab, setActiveTab] = useState<'inspector' | 'tools'>('inspector');
  const [config] = useState<OldWorldConfig>(DEFAULT_CONFIG);

  // Time Travel Context
  const { currentTimeFrame, isLive } = useTimeFrame();

  const { socket, creatures: socketCreatures } = useSocket(room.documentId, 'debug-user');

  const [entities, setEntities] = useState<DebugEntity[]>([]);

  // Sync Entities: Either from Socket (Live) or from TimeFrame (History)
  useEffect(() => {
    let sourceData: any[] = [];

    if (isLive) {
      if (socketCreatures && socketCreatures.length > 0) {
        sourceData = socketCreatures;
      } else if (room && room.entities) {
        sourceData = room.entities;
      }
    } else if (currentTimeFrame && currentTimeFrame.gameState && (currentTimeFrame.gameState as any).entities) {
      sourceData = (currentTimeFrame.gameState as any).entities;
    }

    if (sourceData) {
      setEntities((_prev) =>
        sourceData.map((c: any) => ({
          id: c.id || c.documentId,
          name: c.name,
          type: c.type || 'monster',
          position: c.position || { x: 0, y: 0, z: 0 },
          speed: c.speed || 30,
          parsedSpeed: typeof c.speed === 'number' ? c.speed : 30,
          visionRadius: 10,
          color: c.type === 'player' ? '#4ade80' : '#f87171',
          exploredTiles: new Set<string>(),
          pendingPath: undefined,
          currentHp: c.currentHp,
          maxHp: c.maxHp,
        }))
      );
    }
  }, [socketCreatures, currentTimeFrame, isLive]);

  // Entity Selection State
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const activeEntity = useMemo(
    () => entities.find((e) => e.id === activeEntityId) || entities[0] || null,
    [entities, activeEntityId]
  );

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

  // Sync Room Messages to Chat
  useEffect(() => {
    if (room && room.messages) {
      const historicalMessages = room.messages.map((m: any) => ({
        id: m.documentId,
        role: m.senderType === 'dm' ? 'assistant' : m.senderType === 'player' ? 'user' : 'system',
        content: m.content,
        timestamp: new Date(m.timestamp).getTime(),
      }));

      // Merge with system welcome, but avoid duplicates if we wanted strictness.
      // For now just replacing local state with backend state + live socket updates is tricky.
      // Simplest: Just use backend state as base.

      // Filter by TimeFrame
      let visibleMessages = historicalMessages;
      if (!isLive && currentTimeFrame) {
        const frameTime = new Date(currentTimeFrame.timestamp).getTime();
        visibleMessages = historicalMessages.filter((m: any) => m.timestamp <= frameTime);
      }

      setChatMessages(visibleMessages);
    }
  }, [room, isLive, currentTimeFrame]);

  // Socket Integration
  useEffect(() => {
    if (!socket) return;
    // ... socket logic ...
    // Here we might receive new messages. Ideally we add them to the list.
    // But if we are polling or using live data, we need to handle "Live" vs "Snapshotted" mode.
    // If !isLive, we should ignore new socket messages in the UI (or show "New messages available" indicator).
    // For now, let's just append if isLive.
  }, [socket, isLive]);

  // Socket Integration Hook
  useEffect(() => {
    if (!socket) return;

    // Listen for God Mode responses
    const handleGodModeResponse = (data: { message: string }) => {
      if (!isLive) return; // Don't show live updates if scrubbing history

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

    socket.on('godmode:response', handleGodModeResponse);
    // Also listen for game messages
    // socket.on('message:new', ...) -> Add to list if isLive

    return () => {
      socket.off('godmode:response', handleGodModeResponse);
    };
  }, [socket, isLive]);

  // Map & View State
  const [cameraPosition, setCameraPosition] = useState<Coordinates>({ x: 0, y: 0, z: 0 });

  // Chat State
  const [activeLocation, setActiveLocation] = useState<{ label: string; x: number; y: number; z: number } | null>(null);

  // Handle Interactions
  const handleTileSingleClick = (target: Coordinates) => {
    // Set Active Location (Chip)
    setActiveLocation({
      label: `${target.x}, ${target.y}, ${target.z}`,
      x: target.x,
      y: target.y,
      z: target.z,
    });
    // Don't modify input string directly anymore
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

  // Chunk Loader
  const { chunkCache, getChunk } = useChunkLoader({ config });

  // Helper
  const getChunkId = (cx: number, cy: number) => `${cx},${cy}`;

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

  // Chunk Provider for Renderer
  const chunkProvider = useMemo(
    () => ({
      getChunk: (x: number, y: number) => getChunk(x, y),
    }),
    [getChunk]
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
        const validPath = path.filter((p) => p.cost <= maxDist);
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
      const { sendGodModeCommand } = await import('@/services/api');
      const response = await sendGodModeCommand(roomId, message);

      if (response && response.message) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: Date.now(),
          },
        ]);
      }
      setIsProcessing(false);
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

  // --- 3-COLUMN LAYOUT ---
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full w-full bg-black">
      {/* 2. MAIN 3-COLUMN AREA */}
      <div className="flex-1 flex min-h-0">
        {/* COLUMN 1: CHAT (Left) - 1/3 Width */}
        <div className="flex-1 min-w-0 flex-shrink-0 bg-midnight-950 border-r border-midnight-800 flex flex-col z-10 shadow-2xl">
          <div className="p-3 bg-midnight-900 border-b border-midnight-800 font-bold text-xs uppercase tracking-wider text-shadow-300">
            CHAT / LOG
          </div>
          <div className="flex-1 min-h-0 relative">
            <GodModeChat
              messages={chatMessages}
              onSendMessage={handleGodModeCommand}
              isProcessing={isProcessing}
              inputValue={chatInput}
              onInputChange={setChatInput}
              activeLocation={activeLocation}
              onClearLocation={() => setActiveLocation(null)}
              entities={entities}
              activeEntity={activeEntity}
            />
          </div>
        </div>

        {/* COLUMN 2: INSPECTOR (Middle) - 1/3 Width */}
        <div className="flex-1 min-w-0 flex-shrink-0 bg-midnight-900 border-r border-midnight-800 flex flex-col z-10">
          <div className="p-3 bg-midnight-900 border-b border-midnight-800 font-bold text-xs uppercase tracking-wider text-shadow-300 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('inspector')}
                className={clsx(
                  'transition-colors',
                  activeTab === 'inspector' ? 'text-white' : 'text-gray-500 hover:text-gray-400'
                )}
              >
                INSPECTOR
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={clsx(
                  'transition-colors',
                  activeTab === 'tools' ? 'text-white' : 'text-gray-500 hover:text-gray-400'
                )}
              >
                TOOLS
              </button>
            </div>
            {activeTab === 'inspector' && !isLive && <span className="text-cyan-400">HISTORICAL</span>}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'inspector' ? (
              <div className="absolute inset-0 overflow-y-auto p-2 space-y-2">
                {/* ENTITY LIST */}
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => setActiveEntityId(entity.id)}
                    className={clsx(
                      'group p-2 rounded border transition-colors cursor-pointer',
                      activeEntity?.id === entity.id
                        ? 'bg-midnight-800 border-aurora-500/50'
                        : 'bg-midnight-950/40 border-midnight-800 hover:bg-midnight-800/60'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-midnight-950 flex items-center justify-center text-lg shadow-inner">
                        {entity.type === 'player' ? '👤' : '👾'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-shadow-200 text-sm truncate group-hover:text-white transition-colors">
                          {entity.name || entity.id}
                        </div>
                        <div className="text-[10px] text-shadow-400 font-mono flex gap-2">
                          <span>
                            {entity.position.x}, {entity.position.y}, {entity.position.z}
                          </span>
                          {/* @ts-ignore */}
                          {entity.currentHp !== undefined && (
                            // @ts-ignore
                            <span className={clsx(entity.currentHp <= 0 ? 'text-red-500' : 'text-emerald-400')}>
                              {/* @ts-ignore */}
                              HP: {entity.currentHp}/{entity.maxHp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {entities.length === 0 && (
                  <div className="text-center text-shadow-500 text-xs py-8">
                    {isLive ? 'No entities in room.' : 'No entities in this snapshot.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0">
                <AgentToolPalette roomId={roomId} entities={entities} />
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: MAP (Right) - 1/3 Width */}
        <div className="flex-1 min-w-0 relative bg-black flex flex-col" ref={mapRef}>
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

      {/* 1. TIME CONTROLS (Bottom, Full Width) */}
      <TimeControls />
    </div>
  );
}
