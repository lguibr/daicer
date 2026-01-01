import { useState, useEffect, useMemo } from 'react';
import useSocket from '@/hooks/useSocket';
import { TimeFrameProvider, useTimeFrame } from '@/contexts/TimeFrameContext';
import { getRoomState } from '@/services/api';
import { Room, Message } from '@daicer/engine';
import { WorldConfig as OldWorldConfig, Coordinates, DebugEntity, ZLevel } from '../utils/types';
import { GodModeChat, type GodModeMessage } from './GodModeChat';
import { TimeControls } from './TimeControls';

import { GameDebugInspector } from './GameDebugInspector';
import { GameDebugMap } from './GameDebugMap';

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

interface GameDebugViewProps {
  roomId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GameDebugInner({ roomId, room }: { roomId: string; room: any }) {
  // Config State
  const [activeTab, setActiveTab] = useState<'inspector' | 'tools'>('inspector');
  const [config] = useState<OldWorldConfig>(DEFAULT_CONFIG);

  // Time Travel Context
  const { currentTimeFrame, isLive } = useTimeFrame();

  const { socket, creatures: socketCreatures, gameEvents } = useSocket(room.documentId, 'debug-user');

  const [entities, setEntities] = useState<DebugEntity[]>([]);

  // Sync Entities: Either from Socket (Live) or from TimeFrame (History)
  useEffect(() => {
    // Union of possible source types (Player, Creature, EntitySheet)
    // We treat them as generic objects with common fields for mapping
    let sourceData: Array<{
      id?: string;
      documentId?: string;
      name?: string;
      type?: string;
      position?: { x: number; y: number; z: number };
      speed?: number | string | Record<string, string>;
      currentHp?: number;
      maxHp?: number;
      // Add missing props to satisfy loose downstream usage if needed, or fix downstream
      [key: string]: unknown;
    }> = [];

    if (isLive) {
      if (socketCreatures && socketCreatures.length > 0) {
        sourceData = socketCreatures;
      } else if (room && room.entities) {
        sourceData = room.entities;
      }
    } else if (currentTimeFrame && currentTimeFrame.gameState && currentTimeFrame.gameState.entities) {
      sourceData = currentTimeFrame.gameState.entities;
    }

    if (sourceData) {
      setEntities((_prev) =>
        sourceData.map((c) => ({
          id: c.id || c.documentId || 'unknown',
          name: c.name || 'Unknown Entity',
          type: (c.type as 'player' | 'monster') || 'monster',
          position: c.position ? { ...c.position, z: (c.position.z as ZLevel) || 0 } : { x: 0, y: 0, z: 0 as ZLevel },
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
  }, [socketCreatures, currentTimeFrame, isLive, room]);

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
      const historicalMessages = (room.messages || []).map((m: Message) => ({
        id: m.documentId || m.id,
        role: (m.type === 'narration' ? 'assistant' : m.sender === 'system' ? 'system' : 'user') as
          | 'system'
          | 'user'
          | 'assistant', // Approximate mapping
        content: m.text || (m as any).content, // Fallback if schema differs from API (MessageSchema uses 'text')
        timestamp: new Date(m.timestamp).getTime(),
      }));

      // Merge with system welcome, but avoid duplicates if we wanted strictness.
      // For now just replacing local state with backend state + live socket updates is tricky.
      // Simplest: Just use backend state as base.

      // Filter by TimeFrame
      let visibleMessages = historicalMessages;
      if (!isLive && currentTimeFrame) {
        const frameTime = new Date(currentTimeFrame.timestamp).getTime();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visibleMessages = historicalMessages.filter((m: any) => m.timestamp <= frameTime);
      }

      setChatMessages(visibleMessages);
    }
  }, [room, isLive, currentTimeFrame]);

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

  // Map & View State - activeLocation moved here for coordination
  const [activeLocation, setActiveLocation] = useState<{ label: string; x: number; y: number; z: number } | null>(null);

  // Handle Interactions (Callbacks)
  const handleTileSingleClick = (target: Coordinates) => {
    // Set Active Location (Chip)
    setActiveLocation({
      label: `${target.x}, ${target.y}, ${target.z}`,
      x: target.x,
      y: target.y,
      z: target.z,
    });
  };

  const handleTileHover = (_: Coordinates | null) => {
    // Optional inspector hook
  };

  // Turn Logic (Movement only via Plan Move context menu for debug)
  // NOTE: This logic was in the main component, but it requires 'activeEntity' which is here,
  // and 'getTileAt' which is now in GameDebugMap.
  // To keep it simple, we can move the pathfinding logic to GameDebugMap OR keep it here but we need a callback from Map for getting tiles
  // For now, let's keep the plan logic in GameDebugMap or pass a callback down?
  // Actually, handlePlanMove was used in handleTileDoubleClick.
  // Let's defer path calculation to inside the Map component or pass the handler down.
  // Ideally, pathfinding needs 'getTileAt' which depends on chunkCache in the Map component.
  // So handlePlanMove should move to GameDebugMap, but it needs to update Entities state which is here.
  // We can pass `setEntities` or a `onEntityUpdate` callback to GameDebugMap.
  // OR, we can do the pathfinding inside GameDebugMap and just fire onPathCalculated(entityId, path).

  // Revised Strategy: Move pathfinding to GameDebugMap and expose onPathPlanned.
  const handlePathPlanned = (entityId: string, path: Coordinates[]) => {
    setEntities((prev) => prev.map((e) => (e.id === entityId ? { ...e, pendingPath: path } : e)));
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
              events={gameEvents}
            />
          </div>
        </div>

        {/* COLUMN 2: INSPECTOR (Middle) - 1/3 Width */}
        <GameDebugInspector
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isLive={isLive}
          entities={entities}
          activeEntityId={activeEntityId}
          setActiveEntityId={setActiveEntityId}
          activeEntity={activeEntity}
          activeLocation={activeLocation}
          onGodModeCommand={handleGodModeCommand}
        />

        {/* COLUMN 3: MAP (Right) - 1/3 Width */}
        <GameDebugMap
          roomId={roomId}
          socket={socket}
          activeEntity={activeEntity}
          entities={entities}
          activeEntityId={activeEntityId}
          config={config}
          onTileClick={handleTileSingleClick}
          onPathPlanned={handlePathPlanned}
          onTileHover={handleTileHover}
        />
      </div>

      {/* 1. TIME CONTROLS (Bottom, Full Width) */}
      <TimeControls />
    </div>
  );
}

// Moved to bottom to satisfy no-use-before-define
export function GameDebugView({ roomId }: GameDebugViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [room, setRoom] = useState<Room | null>(null);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (loading) return <div className="text-white p-10">Loading Room...</div>;
  if (error) return <div className="text-red-500 p-10">Error loading room: {error}</div>;
  if (!room) return <div className="text-yellow-500 p-10">Room not found (ID: {roomId})</div>;

  return (
    <TimeFrameProvider room={room}>
      <GameDebugInner roomId={roomId} room={room} />
    </TimeFrameProvider>
  );
}
