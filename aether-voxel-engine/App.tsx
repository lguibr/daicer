import React, { useState, useEffect, useMemo, useRef } from 'react';

// Aether Library Imports
import { 
  WorldGenerator, 
  PhysicsEngine, 
  MapRenderer, 
  type WorldConfig, 
  type Coordinates, 
  type Tile, 
  type ZLevel, 
  CHUNK_SIZE 
} from './aether';

// Application Components
import { WorldConfigForm } from './components/WorldConfigForm';
import { TileInspector } from './components/TileInspector';

const DEFAULT_CONFIG: WorldConfig = {
  seed: 'aether-v5',
  chunkSize: CHUNK_SIZE,
  
  // Terrain
  globalScale: 1.0,
  seaLevel: -0.1,
  elevationScale: 0.015,
  roughness: 0.5,
  detail: 4,
  
  // Biomes
  moistureScale: 0.02,
  temperatureOffset: 0,
  
  // Civ
  structureChance: 0.8, // High chance
  structureSpacing: 2, // Close together
  structureSizeAvg: 16, // Large
  roadDensity: 0.8, // Many roads

  // Gameplay
  fogRadius: 16
};

const App: React.FC = () => {
  const [config, setConfig] = useState<WorldConfig>(DEFAULT_CONFIG);
  const [activeConfig, setActiveConfig] = useState<WorldConfig>(DEFAULT_CONFIG);

  const generator = useMemo(() => new WorldGenerator(activeConfig), [activeConfig]);
  const physics = useMemo(() => new PhysicsEngine(generator), [generator]);

  const [playerPos, setPlayerPos] = useState<Coordinates>({ x: 0, y: 0, z: 0 });
  const [viewZ, setViewZ] = useState<ZLevel>(0);
  const [zoom, setZoom] = useState<number>(0.75);
  
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());
  const [exploredTiles, setExploredTiles] = useState<Set<string>>(new Set());

  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [path, setPath] = useState<Coordinates[] | null>(null);
  const [pathDistance, setPathDistance] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const updateSize = () => {
        if (mapContainerRef.current) {
            setMapSize({
                w: mapContainerRef.current.clientWidth,
                h: mapContainerRef.current.clientHeight
            });
        }
    };
    window.addEventListener('resize', updateSize);
    updateSize(); 
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleRegenerate = () => {
     setActiveConfig({...config});
     setExploredTiles(new Set());
     setPlayerPos({ x: 0, y: 0, z: 0 }); 
  };

  // Safe Start Logic
  useEffect(() => {
    // Reveal start area
    const R = 64; 
    const Rsq = R * R;
    const initExplored = new Set<string>();
    for (let y = -R; y <= R; y++) {
        for (let x = -R; x <= R; x++) {
            if (x * x + y * y <= Rsq) {
                initExplored.add(`${x},${y}`);
            }
        }
    }
    setExploredTiles(initExplored);

    let startX = 0;
    let startY = 0;
    let safe = false;
    let attempts = 0;
    while(!safe && attempts < 500) {
        if (physics.isWalkable({x: startX, y: startY, z: 0})) {
            safe = true;
        } else {
            startX += Math.floor(Math.random() * 10) - 5;
            startY += Math.floor(Math.random() * 10) - 5;
        }
        attempts++;
    }
    setPlayerPos({ x: startX, y: startY, z: 0 });
    setViewZ(0);
  }, [physics]);

  // Fog of War Logic
  useEffect(() => {
    const fov = physics.calculateFieldOfView(playerPos, activeConfig.fogRadius); 
    setVisibleTiles(fov);
    setExploredTiles(prev => {
        const next = new Set(prev);
        fov.forEach(t => next.add(t));
        return next;
    });
  }, [playerPos, physics, activeConfig.fogRadius]);

  const handleTileClick = (x: number, y: number) => {
    if (viewZ !== playerPos.z) return;

    const targetCoords = { x, y, z: viewZ };
    setSelectedCoords(targetCoords);

    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const chunk = generator.getChunk(chunkX, chunkY);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = viewZ + 3;
    
    if (lz >= 0 && lz <= 6) {
        setSelectedTile(chunk.tiles[lz][ly][lx]);
    }

    if (physics.isWalkable(targetCoords)) {
        const p = physics.findPath(playerPos, targetCoords);
        setPath(p);
        setPathDistance(p ? p.length - 1 : null);
    } else {
        setPath(null);
        setPathDistance(null);
    }
  };

  const handleTileDoubleClick = (x: number, y: number) => {
    // If double clicking a specific spot, try to move there
    // If it's a stair, use it immediately
    const target = { x, y, z: viewZ };
    
    // Check path or immediate neighbor
    if ((path && path.length > 0) || (Math.abs(x - playerPos.x) <= 1 && Math.abs(y - playerPos.y) <= 1)) {
        // Move to location
        setPlayerPos(target);

        // Path fog reveal
        if (path) {
            const newExplored = new Set(exploredTiles);
            path.forEach(step => {
                const fov = physics.calculateFieldOfView(step, activeConfig.fogRadius);
                fov.forEach(t => newExplored.add(t));
            });
            setExploredTiles(newExplored);
            setPath(null);
            setPathDistance(null);
        }

        // CHECK FOR STAIRS AFTER MOVE
        const stairType = physics.checkStaircase(target);
        if (stairType) {
            let newZ = target.z;
            if (stairType === 'up' && target.z < 3) newZ = (target.z + 1) as ZLevel;
            if (stairType === 'down' && target.z > -3) newZ = (target.z - 1) as ZLevel;
            
            if (newZ !== target.z) {
                // Teleport Z
                setPlayerPos({ ...target, z: newZ });
                setViewZ(newZ);
            }
        }
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(10.0, Math.max(0.05, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
      const delta = -Math.sign(e.deltaY) * 0.1;
      handleZoom(delta);
  };

  return (
    <div className="flex w-full h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      <div className="w-80 flex-shrink-0 flex flex-col p-4 border-r border-slate-800 bg-slate-900 overflow-y-auto z-10 shadow-2xl">
        <h1 className="text-2xl font-bold text-sky-500 mb-6 tracking-tight">AETHER ENGINE</h1>
        
        <WorldConfigForm 
          config={config} 
          onConfigChange={setConfig} 
          onRegenerate={handleRegenerate}
        />

        <TileInspector 
          selectedTile={selectedTile}
          coords={selectedCoords}
          isReachable={!!path}
          distance={pathDistance}
        />

        <div className="bg-slate-800 p-4 rounded-lg shadow-lg mt-4 text-xs font-mono">
            <h2 className="text-sky-400 font-bold mb-3 border-b border-slate-700 pb-1">3. VIEW CONTROLS</h2>
            
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span>View Layer (Z)</span>
                    <span className="text-yellow-400 font-bold">{viewZ}</span>
                </div>
                <div className="flex gap-1 justify-center">
                {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
                    <button
                        key={z}
                        onClick={() => setViewZ(z as ZLevel)}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                            viewZ === z 
                            ? 'bg-sky-600 text-white' 
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        }`}
                    >
                        {z}
                    </button>
                ))}
                </div>

                <div className="flex justify-between items-center mt-2">
                    <span>Zoom</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleZoom(-0.25)} className="px-2 bg-slate-700 rounded">-</button>
                        <span>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => handleZoom(0.25)} className="px-2 bg-slate-700 rounded">+</button>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4 text-[10px] text-slate-600 font-mono">
            Map Size: {mapSize.w}x{mapSize.h}<br/>
            Engine: V3.5.0 (Lib Mode)<br/>
            Render: Canvas 2D
        </div>
      </div>

      <div 
        className="flex-1 relative bg-black" 
        ref={mapContainerRef} 
        onWheel={handleWheel}
      >
        <div className="absolute inset-0">
            <MapRenderer 
                width={mapSize.w} 
                height={mapSize.h}
                center={playerPos}
                viewZ={viewZ}
                scale={zoom}
                generator={generator}
                visibleTiles={visibleTiles}
                exploredTiles={exploredTiles}
                path={path}
                onTileClick={handleTileClick}
                onTileDoubleClick={handleTileDoubleClick}
            />
        </div>
        
        <div className="absolute bottom-4 right-4 pointer-events-none text-right">
             <div className="bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-mono text-slate-400">
                Left Click: Inspect / Path<br/>
                Dbl Click: Move / Use Stairs
             </div>
        </div>
      </div>

    </div>
  );
};

export default App;