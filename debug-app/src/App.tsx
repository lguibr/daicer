import { useState, useEffect, useMemo, useRef } from 'react';
import {
  WorldGenerator,
  PhysicsEngine,
  type WorldConfig,
  type Coordinates,
  type Tile,
  parseSpeed,
} from '@daicer/engine';
import { RefreshCw, Eye } from 'lucide-react';
import clsx from 'clsx';
import { MapRenderer } from './components/MapRenderer';
import { WorldConfigForm } from './components/WorldConfigForm';
import { TileInspector } from './components/TileInspector';

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

export default function App() {
  // Config State
  const [config, setConfig] = useState<WorldConfig>(DEFAULT_CONFIG);
  const [activeConfig, setActiveConfig] = useState<WorldConfig>(DEFAULT_CONFIG);

  // Engine Instances
  const generator = useMemo(() => new WorldGenerator(activeConfig), [activeConfig]);
  const physics = useMemo(() => new PhysicsEngine(generator), [generator]);

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

  // Map & View State
  const [viewZ, setViewZ] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Inspector State
  const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  const [pathDistance, setPathDistance] = useState<number | null>(null);

  // POV Logic
  const [exploredTiles, setExploredTiles] = useState<Set<string>>(new Set());
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());
  const [entityMemories, setEntityMemories] = useState<Record<string, Set<string>>>({});

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

  // FOV Calculation (Per Entity Memory)
  useEffect(() => {
    setEntityMemories((prev) => {
      const next = { ...prev };
      entities.forEach((ent) => {
        if (!next[ent.id]) next[ent.id] = new Set();
        const fov = physics.calculateFieldOfView(ent.position, ent.visionRadius);
        fov.forEach((t) => next[ent.id].add(t));

        if (ent.id === activeEntityId) {
          setVisibleTiles(fov);
          setExploredTiles(next[ent.id]);
        }
      });
      return next;
    });
  }, [entities, physics, activeEntityId]);

  // Handle Regenerate
  const handleRegenerate = () => {
    setActiveConfig({ ...config });
    // Reset memories is optional, users might expect full wipe or keep. Reference implies "Regenerate World"
    // Usually means fresh start.
    setEntityMemories({});
    setExploredTiles(new Set());
    setVisibleTiles(new Set());
    // Also reset entities to start pos?
    setEntities((prev) => prev.map((e) => ({ ...e, position: { x: 0, y: 0, z: 0 } })));
  };

  // Handle Map Interaction
  const handleTileClick = (target: Coordinates) => {
    setEntities((prev) => prev.map((e) => (e.id === activeEntityId ? { ...e, position: target } : e)));
    if (target.z !== viewZ) setViewZ(target.z);
  };

  const handleTileHover = (coords: Coordinates | null) => {
    setHoveredCoords(coords);
    if (!coords) {
      setHoveredTile(null);
      setPathDistance(null);
      return;
    }

    // Get Tile Data
    const chunkX = Math.floor(coords.x / 32);
    const chunkY = Math.floor(coords.y / 32);
    const chunk = generator.getChunk(chunkX, chunkY);
    const lx = ((coords.x % 32) + 32) % 32;
    const ly = ((coords.y % 32) + 32) % 32;
    const lz = coords.z + 3;

    if (chunk && chunk.tiles[lz]) {
      setHoveredTile(chunk.tiles[lz][ly][lx]);

      // Path check (if walkable and same Z)
      // Optimization: debounce this if needed
      if (coords.z === activeEntity.position.z) {
        // Physics A* usually assumes connected space, strict Z might be tricky without stairs logic fully separate
        const path = physics.findPath(activeEntity.position, coords);
        setPathDistance(path ? path.length - 1 : null);
      } else {
        setPathDistance(null);
      }
    } else {
      setHoveredTile(null);
      setPathDistance(null);
    }
  };

  return (
    <div className="flex w-full h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col z-10 shadow-xl">
        <div className="p-4 border-b border-neutral-800 bg-neutral-900 sticky top-0 z-20">
          <h1 className="text-xl font-black text-blue-500 tracking-tighter flex items-center gap-2">
            AETHER ENGINE <span className="text-[10px] text-neutral-500 font-mono font-normal mt-1">V4.0 DEBUG</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {/* 1. World Gen */}
          <WorldConfigForm config={config} isActive={true} onConfigChange={setConfig} onRegenerate={handleRegenerate} />

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
                    className={clsx(
                      'w-6 h-6 rounded flex items-center justify-center font-mono transition-colors',
                      viewZ === z ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-700'
                    )}
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
                className={clsx(
                  'flex items-center justify-between p-2 rounded cursor-pointer border transition-all',
                  activeEntityId === ent.id
                    ? 'bg-blue-900/20 border-blue-500/50'
                    : 'bg-neutral-800 border-transparent hover:border-neutral-600'
                )}
              >
                <div className="text-xs font-bold text-neutral-300">{ent.name}</div>
                <Eye className={clsx('w-3 h-3', activeEntityId === ent.id ? 'text-blue-400' : 'text-neutral-600')} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-2 border-t border-neutral-800 text-[10px] text-neutral-600 font-mono text-center">
          Map Size: {mapSize.w}x{mapSize.h} | Render: Canvas 2D
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative bg-black" ref={mapRef}>
        <div className="absolute inset-0 overflow-hidden">
          <MapRenderer
            width={mapSize.w}
            height={mapSize.h}
            center={activeEntity.position}
            viewZ={viewZ}
            scale={zoom}
            generator={generator}
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
