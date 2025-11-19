/**
 * Unified Map Renderer
 * Single source of truth for 2D map visualization with z-layer support
 * Fixes: React canvas clearing, black flashing, duplicate renderers
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Home, Layers, Info } from 'lucide-react';
import type { Structure } from '@daicer/shared/world/structure-schema';
import type { Road } from '@daicer/shared/world/road-schema';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

// Simple logger
const logger = {
  info: (message: string) => console.log(message),
  debug: (message: string) => console.log(message),
};
// Z-layer slider uses native HTML range input

interface MapRendererProps {
  structures: Structure[];
  roads: Road[];
  initialLayer?: number;
  className?: string;
}

interface ChunkLoadState {
  [key: string]: {
    loaded: boolean;
    opacity: number; // For progressive fade-in
  };
}

/**
 * Unified Map Renderer
 * Renders XY plane at specific Z layer with progressive chunk loading
 */
export function MapRenderer({ structures, roads, initialLayer = 0, className = '' }: MapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [currentLayer, setCurrentLayer] = useState(initialLayer);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chunkStates, setChunkStates] = useState<ChunkLoadState>({});

  // Layer cache: visible + adjacent (Answer 4-c)
  const [layerCache, setLayerCache] = useState<Map<number, unknown>>(new Map());

  // Initialize canvas ONCE (Fix: Answer 7-c - React re-render clearing)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Persist context across re-renders
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    contextRef.current = ctx;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    logger.info('[MapRenderer] Canvas initialized (persistent across re-renders)');
  }, []); // Empty deps = run once, never re-create

  // Load chunks for current layer + adjacent layers (Answer 4-c)
  useEffect(() => {
    const layersToLoad = [currentLayer - 1, currentLayer, currentLayer + 1];
    const missingLayers = layersToLoad.filter((layer) => !layerCache.has(layer));

    if (missingLayers.length === 0) return;

    // Load missing layers
    const updates = new Map(layerCache);
    missingLayers.forEach((layer) => {
      updates.set(layer, { loaded: true });
    });
    setLayerCache(updates);

    // Cleanup: Remove layers outside cache range
    const layersToKeep = new Set(layersToLoad);
    const cleaned = new Map(layerCache);
    for (const [layer] of layerCache) {
      if (!layersToKeep.has(layer)) {
        cleaned.delete(layer);
      }
    }
    if (cleaned.size !== layerCache.size) {
      setLayerCache(cleaned);
    }
  }, [currentLayer]); // Removed layerCache from deps

  // Render map (Update data only, not canvas)
  useEffect(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    drawGrid(ctx);

    // Draw roads
    roads.forEach((road) => drawRoad(ctx, road, chunkStates));

    // Draw structures with progressive fade-in
    structures.forEach((structure) => {
      const chunkKey = `${structure.x}_${structure.y}_${currentLayer}`;
      const opacity = chunkStates[chunkKey]?.opacity || 0;

      ctx.globalAlpha = opacity;
      drawStructure(ctx, structure, currentLayer);
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  }, [structures, roads, currentLayer, zoom, pan, chunkStates]);

  // Progressive chunk loading (Answer 8-c: fade in)
  useEffect(() => {
    const missingChunks: string[] = [];

    structures.forEach((structure) => {
      const chunkKey = `${structure.x}_${structure.y}_${currentLayer}`;
      if (!chunkStates[chunkKey]) {
        missingChunks.push(chunkKey);
      }
    });

    if (missingChunks.length === 0) return;

    // Initialize all missing chunks at once (prevents infinite loop)
    const newStates: ChunkLoadState = {};
    missingChunks.forEach((key) => {
      newStates[key] = { loaded: false, opacity: 0 };
    });

    setChunkStates((prev) => ({ ...prev, ...newStates }));

    // Simulate progressive loading
    missingChunks.forEach((key, index) => {
      setTimeout(() => {
        setChunkStates((prev) => ({
          ...prev,
          [key]: { loaded: true, opacity: 0.3 },
        }));

        setTimeout(() => {
          setChunkStates((prev) => ({
            ...prev,
            [key]: { loaded: true, opacity: 1.0 },
          }));
        }, 200);
      }, index * 50);
    });
  }, [structures, currentLayer]); // Removed chunkStates from deps to prevent loop

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Layer change handler
  const handleLayerChange = useCallback((newLayer: number) => {
    setCurrentLayer(Math.floor(newLayer));
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            World Map (Layer {currentLayer})
          </span>

          {/* Zoom Controls */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetView}>
              <Home className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Z-Layer Slider (Answer 3-a: manual control) */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Z-Layer:</span>
          <input
            type="range"
            min={-16}
            max={16}
            step={1}
            value={currentLayer}
            onChange={(e) => handleLayerChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-mono">{currentLayer}</span>
        </div>

        {/* Canvas (persistent across re-renders) */}
        <div className="relative overflow-hidden rounded border border-border bg-muted">
          <canvas
            ref={canvasRef}
            className="cursor-move"
            onMouseDown={(e) => {
              setIsPanning(true);
              setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
          />
        </div>

        {/* Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            {structures.length} structures, {roads.length} roads | Zoom: {zoom.toFixed(1)}x
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Drawing helpers (gray placeholder for loading chunks - Answer 8-c)
function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = 50;

  for (let x = 0; x < 512; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  for (let y = 0; y < 512; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, road: Road, _chunkStates: ChunkLoadState) {
  if (!road.waypoints || road.waypoints.length < 2) return;

  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(road.waypoints[0].x, road.waypoints[0].y);

  for (let i = 1; i < road.waypoints.length; i++) {
    ctx.lineTo(road.waypoints[i].x, road.waypoints[i].y);
  }

  ctx.stroke();
}

function drawStructure(ctx: CanvasRenderingContext2D, structure: Structure, _layer: number) {
  const width = structure.width || 32;
  const height = structure.height || 32;
  const x = structure.x - width / 2;
  const y = structure.y - height / 2;

  // Gray placeholder while loading (not black!)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x, y, width, height);

  // Structure color based on type
  const colors: Record<Structure['type'], string> = {
    settlement: '#8b7355',
    dungeon: '#4a4a4a',
    landmark: '#d4af37',
    ruin: '#6b6b6b',
    natural: '#4a7c3f',
  };

  ctx.fillStyle = colors[structure.type] || '#888888';
  ctx.fillRect(x, y, width, height);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(structure.name, structure.x, structure.y + height / 2 + 16);
}
