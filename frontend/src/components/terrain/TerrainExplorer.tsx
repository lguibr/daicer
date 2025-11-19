/**
 * Unified Terrain Explorer
 * Combines biome grid + layer viewer into one explorable map
 * Drag to pan, scroll to zoom, Z-slider for layers
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { GlobalPlacementMap } from '@daicer/shared/world-gen/structures';
import { VoxelMetadataPanel, type VoxelMetadata } from './VoxelMetadataPanel';
import { useKeyboardMovement } from '../../hooks/useKeyboardMovement';
import {
  InfiniteChunksProvider,
  useInfiniteChunksView,
  useInfiniteChunksActions,
} from '../../contexts/infinite-chunks';
import { AspectRatio } from '../ui/aspect-ratio';

interface TerrainExplorerProps {
  biomeGrid: string[][]; // 2D grid for backward compatibility (surface layer)
  biomeGrid3D?: string[][][]; // Optional 3D grid [floor][y][x] for multi-floor structures (7 floors: -3 to +3)
  structures?: Array<{ name: string; x: number; y: number; type: string; [key: string]: any }>;
  roomSize?: number;
  initialZoom?: number;
  roomId?: string;
  enableInfinite?: boolean;
  chunkGenerator?: {
    generateChunk: (worldX: number, worldY: number, width: number, height: number) => string[][];
    generateChunk3D?: (worldX: number, worldY: number, width: number, height: number) => string[][][];
  };
  placementMap?: GlobalPlacementMap | null; // NEW: Global structure placement map
}

const BIOME_COLORS: Record<string, string> = {
  ocean: '#1e3a8a',
  frozen_ocean: '#93c5fd',
  lake: '#3b82f6',
  river: '#60a5fa',
  frozen_river: '#bfdbfe',
  beach: '#fde047',
  plains: '#84cc16',
  forest: '#166534',
  taiga: '#0f766e',
  tundra: '#e0f2fe',
  swamp: '#334155',
  desert: '#d97706',
  savanna: '#a16207',
  jungle: '#14532d',
  mountains: '#78716c',
  hills: '#a8a29e',
};

// Structure material colors (matching StructureVisualizer)
const MATERIAL_COLORS: Record<string, string> = {
  stone: '#6b7280',
  wood: '#92400e',
  brick: '#991b1b',
  marble: '#e5e7eb',
  obsidian: '#1f2937',
  crystal: '#3b82f6',
  iron: '#4b5563',
  gold: '#f59e0b',
};

/**
 * Parse structure biome name and return appropriate color
 * Format: structure_final_<material>_<tileType>_<floor>
 * or: structure_road_<material>
 */
function getStructureColor(biomeName: string): string | null {
  if (biomeName.startsWith('structure_road_')) {
    // Roads are bright brown/tan to stand out
    // const material = biomeName.split('_')[2];
    // const baseColor = MATERIAL_COLORS[material] || '#78716c';
    // Make roads brighter/more yellow-ish
    return '#a16207'; // Bright brown/tan for all roads
  }

  if (biomeName.startsWith('structure_final_')) {
    const parts = biomeName.split('_');
    const material = parts[2]; // structure_final_<material>_...
    const tileType = parts[3]; // structure_final_<material>_<tileType>_...

    const baseColor = MATERIAL_COLORS[material] || '#6b7280';

    // Walls are solid and distinct
    if (tileType === 'wall') {
      return baseColor;
    }
    // Floors are much lighter (add alpha for transparency blend)
    if (tileType === 'floor') {
      // Convert hex to RGB and lighten
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Lighten by 40%
      const lighter = `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`;
      return lighter;
    }
    // Doors are bright yellow-orange
    if (tileType === 'door') {
      return '#f59e0b';
    }
    // Stairs are bright blue
    if (tileType === 'stairs') {
      return '#3b82f6';
    }

    return baseColor;
  }

  return null; // Not a structure biome
}

export function TerrainExplorer({
  biomeGrid,
  biomeGrid3D,
  structures = [],
  roomSize = 32,
  initialZoom = 2,
  roomId = '',
  enableInfinite = true,
  chunkGenerator,
  placementMap, // NEW: Accept placement map
}: TerrainExplorerProps) {
  // Wrap with provider if infinite chunks enabled
  if (enableInfinite && roomId) {
    return (
      <InfiniteChunksProvider
        options={{
          roomId,
          initialGrid: biomeGrid,
          chunkSize: 4,
          loadRadius: 12,
          enabled: true,
          chunkGenerator,
          placementMap,
        }}
      >
        <TerrainExplorerInternal
          biomeGrid={biomeGrid}
          biomeGrid3D={biomeGrid3D}
          structures={structures}
          roomSize={roomSize}
          initialZoom={initialZoom}
          roomId={roomId}
          enableInfinite={enableInfinite}
        />
      </InfiniteChunksProvider>
    );
  }

  // No provider needed for static mode
  return (
    <TerrainExplorerInternal
      biomeGrid={biomeGrid}
      biomeGrid3D={biomeGrid3D}
      structures={structures}
      roomSize={roomSize}
      initialZoom={initialZoom}
      roomId={roomId}
      enableInfinite={false}
    />
  );
}

// Internal component that uses the hooks
function TerrainExplorerInternal({
  biomeGrid,
  biomeGrid3D,
  structures = [],
  roomSize = 32,
  initialZoom = 2,
  roomId = '',
  enableInfinite = false,
}: Omit<TerrainExplorerProps, 'chunkGenerator' | 'placementMap'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentLayer, setCurrentLayer] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showVisionRadius, setShowVisionRadius] = useState(true);
  const [showStructures, setShowStructures] = useState(true);
  const [selectedMetadata, setSelectedMetadata] = useState<VoxelMetadata | null>(null);

  // Helper to convert Z-layer to floor index (for 3D grid)
  // Z-layer buttons: -1, 0, 1 map to floors: -1, 0, +1 (but we have -3 to +3)
  // For now, we'll support -3 to +3 via the layer controls
  const getFloorIndex = (layer: number): number => 
    // layer can be -3 to +3
    // floor index in array: 0 to 6 (where 0 = floor -3, 3 = floor 0, 6 = floor +3)
     layer + 3
  ;

  // Infinite chunk loading (use new hooks if enabled)
  const infiniteChunksView = enableInfinite && roomId ? useInfiniteChunksView() : null;
  const infiniteChunksActions = enableInfinite && roomId ? useInfiniteChunksActions() : null;

  const expandedGrid = infiniteChunksView?.expandedGrid || biomeGrid;
  const isLoading = infiniteChunksView?.isLoading || false;
  const gridWorldOffset = infiniteChunksView?.gridWorldOffset || { x: 0, y: 0 };
  const checkChunkLoading = infiniteChunksActions?.checkChunkLoading || (() => {});

  // Use expanded grid if infinite chunks enabled, otherwise use initial grid
  const activeGrid = useMemo(
    () => (enableInfinite && roomId ? expandedGrid : biomeGrid),
    [enableInfinite, roomId, expandedGrid, biomeGrid]
  );

  const gridWidth = activeGrid[0]?.length || 128;
  const gridHeight = activeGrid.length || 128;

  // Track player in WORLD coordinates (not grid-local) to avoid teleport bug
  const initialGridCenterX = Math.floor((biomeGrid[0]?.length || 32) / 2);
  const initialGridCenterY = Math.floor((biomeGrid.length || 32) / 2);

  const { position: userPosition } = useKeyboardMovement({
    initialPosition: {
      x: initialGridCenterX, // Start at center of initial grid in world coords
      y: initialGridCenterY,
    },
    moveSpeed: 2,
    bounds: enableInfinite
      ? undefined // No bounds for infinite terrain
      : {
          minX: gridWorldOffset.x,
          maxX: gridWorldOffset.x + gridWidth - 1,
          minY: gridWorldOffset.y,
          maxY: gridWorldOffset.y + gridHeight - 1,
        },
    enabled: true,
    coordinateOffset: gridWorldOffset, // Pass for awareness
  });

  // Track previous offset to adjust pan when grid expands
  const prevGridOffsetRef = useRef(gridWorldOffset);

  // Adjust pan when grid expands to prevent visual jumping
  useEffect(() => {
    const prevOffset = prevGridOffsetRef.current;
    if (prevOffset.x !== gridWorldOffset.x || prevOffset.y !== gridWorldOffset.y) {
      // Calculate how many pixels the grid shifted
      const shiftX = (prevOffset.x - gridWorldOffset.x) * TILE_SIZE * zoom;
      const shiftY = (prevOffset.y - gridWorldOffset.y) * TILE_SIZE * zoom;

      setPan((p) => ({ x: p.x - shiftX, y: p.y - shiftY }));
      prevGridOffsetRef.current = gridWorldOffset;
    }
  }, [gridWorldOffset, zoom]);

  const visionRadius = 40; // tiles (world space)
  const TILE_SIZE = 16; // Fixed tile size in pixels

  // Debug: Log render scale and vision calculations
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container && activeGrid.length > 0) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const width = activeGrid[0]?.length || 0;
      const height = activeGrid.length;

      // Fixed scale logic
      const renderScale = TILE_SIZE * zoom;

      console.log('[TerrainExplorer] Vision Debug:', {
        gridSize: `${width}x${height}`,
        containerSize: `${containerWidth}x${containerHeight}`,
        zoom: zoom.toFixed(2),
        renderScale: renderScale.toFixed(4),
        visionRadiusPixels: (visionRadius * renderScale).toFixed(1),
        visionRadiusTiles: visionRadius,
        pan,
      });
    }
  }, [activeGrid, zoom, visionRadius, pan]);

  // Trigger chunk loading when player moves in world coords
  useEffect(() => {
    if (enableInfinite && roomId) {
      // userPosition is in world coordinates
      checkChunkLoading(userPosition.x, userPosition.y);
    }
  }, [userPosition.x, userPosition.y, enableInfinite, roomId, checkChunkLoading]);

  // Memoize rendering to avoid unnecessary canvas updates
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !activeGrid || activeGrid.length === 0 || !activeGrid[0]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const height = activeGrid.length;
    const width = activeGrid[0].length;

    // Get container size for responsive rendering
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Set canvas dimensions to match container (1:1 aspect ratio enforced by AspectRatio)
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Fixed scale rendering
    const renderScale = TILE_SIZE * zoom;

    // Apply pan transformation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);

    // Get the appropriate grid layer based on currentLayer and biomeGrid3D
    let layerGrid: string[][];

    if (biomeGrid3D && currentLayer >= -3 && currentLayer <= 3) {
      // Use 3D grid for multi-floor structures
      const floorIndex = getFloorIndex(currentLayer);
      layerGrid = biomeGrid3D[floorIndex] || activeGrid;
    } else {
      // Fallback to 2D grid (surface layer only)
      layerGrid = activeGrid;
    }

    // Layer-specific rendering
    if (currentLayer < 0) {
      // Underground floors: show structure basements, dungeons, caves
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const biome = layerGrid[y]?.[x] || '';

          // Empty = solid rock/earth
          if (biome === '') {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);
            continue;
          }

          // Structure tiles (walls, floors, stairs) render normally
          const structureColor = getStructureColor(biome);
          const isStructure = biome.startsWith('structure_final_') || biome.startsWith('structure_road_');
          const color = structureColor || '#2a2a2a'; // Dark gray for terrain underground

          ctx.fillStyle = color;
          ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);

          // AGGRESSIVE borders for structure tiles (same as surface)
          if (isStructure) {
            // THICK white outer border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(2, renderScale * 0.2);
            ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);

            // Walls: THICK black border
            if (biome.includes('_wall_')) {
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(3, renderScale * 0.25);
              ctx.strokeRect(x * renderScale + 1.5, y * renderScale + 1.5, renderScale - 3, renderScale - 3);

              // CENTER DOT: Visual indicator that walls are impassable
              const centerX = x * renderScale + renderScale / 2;
              const centerY = y * renderScale + renderScale / 2;
              const dotRadius = Math.max(2, renderScale * 0.15);

              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }

            // Doors: GLOWING golden
            if (biome.includes('_door_')) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }

            // Stairs: GLOWING cyan (super important underground!)
            if (biome.includes('_stairs_')) {
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);
              ctx.strokeStyle = '#67e8f9';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }
          }
        }
      }
    } else if (currentLayer === 0) {
      // Surface: biome tiles with structure detection
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const biome = layerGrid[y]?.[x] || '';

          // Empty string means structure empty tile (non-collapsed area) - render as black
          if (biome === '') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);
            continue;
          }

          // Check if it's a structure biome first
          const structureColor = getStructureColor(biome);
          const isStructure = biome.startsWith('structure_final_') || biome.startsWith('structure_road_');
          const color = structureColor || BIOME_COLORS[biome] || '#666666';

          ctx.fillStyle = color;
          ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);

          // AGGRESSIVE borders around structure tiles
          if (isStructure) {
            // THICK white outer border for ALL structure tiles
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(2, renderScale * 0.2); // Much thicker!
            ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);

            // Walls: THICK black border + dark shadow
            if (biome.includes('_wall_')) {
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(3, renderScale * 0.25); // Very thick
              ctx.strokeRect(x * renderScale + 1.5, y * renderScale + 1.5, renderScale - 3, renderScale - 3);

              // CENTER DOT: Visual indicator that walls are impassable
              const centerX = x * renderScale + renderScale / 2;
              const centerY = y * renderScale + renderScale / 2;
              const dotRadius = Math.max(2, renderScale * 0.15);

              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }

            // Doors: GLOWING golden border (double-stroke for emphasis)
            if (biome.includes('_door_')) {
              // Outer golden glow
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);

              // Inner bright yellow
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }

            // Stairs: GLOWING cyan border (double-stroke for emphasis)
            if (biome.includes('_stairs_')) {
              // Outer cyan glow
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);

              // Inner bright cyan
              ctx.strokeStyle = '#67e8f9';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }

            // Roads: THICK dashed golden pattern
            if (biome.startsWith('structure_road_')) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = Math.max(3, renderScale * 0.2); // Thicker
              ctx.setLineDash([renderScale * 0.3, renderScale * 0.15]); // Bigger dashes
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);
              ctx.setLineDash([]); // Reset
            }
          }
        }
      }
    } else if (currentLayer > 0) {
      // Upper floors: show structure towers, upper levels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const biome = layerGrid[y]?.[x] || '';

          // Empty = open air/sky
          if (biome === '') {
            ctx.fillStyle = 'rgba(135, 206, 250, 0.2)'; // Light blue transparent
            ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);
            continue;
          }

          // Structure tiles render normally
          const structureColor = getStructureColor(biome);
          const isStructure = biome.startsWith('structure_final_') || biome.startsWith('structure_road_');
          const color = structureColor || 'rgba(255, 255, 255, 0.3)'; // Light for sky

          ctx.fillStyle = color;
          ctx.fillRect(x * renderScale, y * renderScale, renderScale, renderScale);

          // AGGRESSIVE borders for structure tiles
          if (isStructure) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(2, renderScale * 0.2);
            ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);

            if (biome.includes('_wall_')) {
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(3, renderScale * 0.25);
              ctx.strokeRect(x * renderScale + 1.5, y * renderScale + 1.5, renderScale - 3, renderScale - 3);

              // CENTER DOT: Visual indicator that walls are impassable
              const centerX = x * renderScale + renderScale / 2;
              const centerY = y * renderScale + renderScale / 2;
              const dotRadius = Math.max(2, renderScale * 0.15);

              ctx.fillStyle = '#000000';
              ctx.beginPath();
              ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }

            if (biome.includes('_door_')) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }

            if (biome.includes('_stairs_')) {
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = Math.max(4, renderScale * 0.3);
              ctx.strokeRect(x * renderScale, y * renderScale, renderScale, renderScale);
              ctx.strokeStyle = '#67e8f9';
              ctx.lineWidth = Math.max(2, renderScale * 0.15);
              ctx.strokeRect(x * renderScale + 2, y * renderScale + 2, renderScale - 4, renderScale - 4);
            }
          }
        }
      }
    }

    // Draw room grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += roomSize) {
        ctx.beginPath();
        ctx.moveTo(x * renderScale, 0);
        ctx.lineTo(x * renderScale, height * renderScale);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += roomSize) {
        ctx.beginPath();
        ctx.moveTo(0, y * renderScale);
        ctx.lineTo(width * renderScale, y * renderScale);
        ctx.stroke();
      }
    }

    // Draw structures - Each structure x,y is in tile coordinates (same as biome grid)
    // Only show structure overlays if the biomeGrid doesn't already contain detailed structure tiles
    // (i.e., only show overlays for old-style structure metadata without stamped details)
    if (showStructures && currentLayer === 0) {
      structures.forEach((structure) => {
        // Check if this area has detailed structure tiles already
        const roomX = Math.floor(structure.x / roomSize);
        const roomY = Math.floor(structure.y / roomSize);
        const roomStartX = roomX * roomSize;
        const roomStartY = roomY * roomSize;

        // Sample a few tiles in the room to see if they're structure tiles
        let hasDetailedTiles = false;
        for (let sy = roomStartY; sy < roomStartY + 3 && sy < height; sy++) {
          for (let sx = roomStartX; sx < roomStartX + 3 && sx < width; sx++) {
            const biome = activeGrid[sy]?.[sx] || '';
            if (biome.startsWith('structure_final_') || biome.startsWith('structure_road_')) {
              hasDetailedTiles = true;
              break;
            }
          }
          if (hasDetailedTiles) break;
        }

        // Only draw overlay if no detailed tiles (backward compatibility)
        if (hasDetailedTiles) return;

        const structureColors: Record<string, string> = {
          settlement: '#ef4444',
          dungeon: '#7c2d12',
          landmark: '#eab308',
          ruin: '#6b7280',
          natural: '#22c55e',
        };

        const color = structureColors[structure.type] || '#ef4444';

        // Fill entire room with semi-transparent structure color
        ctx.fillStyle = `${color}BB`; // Semi-transparent
        ctx.fillRect(
          roomStartX * renderScale,
          roomStartY * renderScale,
          roomSize * renderScale,
          roomSize * renderScale
        );

        // Thick colored border around room
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, renderScale / 2);
        ctx.strokeRect(
          roomStartX * renderScale,
          roomStartY * renderScale,
          roomSize * renderScale,
          roomSize * renderScale
        );

        // Structure name label
        if (zoom >= 1.5) {
          const centerX = (roomStartX + roomSize / 2) * renderScale;
          const centerY = (roomStartY + roomSize / 2) * renderScale;
          const text = structure.name;

          // Black outline for readability
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.font = `bold ${Math.max(10, renderScale * 2)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeText(text, centerX, centerY);

          // White fill
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, centerX, centerY);
        }
      });
    }

    // Draw user position (red dot) - userPosition is in WORLD coordinates
    const userGridX = userPosition.x - gridWorldOffset.x;
    const userGridY = userPosition.y - gridWorldOffset.y;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(userGridX * renderScale, userGridY * renderScale, Math.max(3, renderScale), 0, Math.PI * 2);
    ctx.fill();

    // Draw vision radius (green circle)
    if (showVisionRadius) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(userGridX * renderScale, userGridY * renderScale, visionRadius * renderScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }, [
    activeGrid,
    structures,
    zoom,
    pan,
    showGrid,
    showVisionRadius,
    showStructures,
    currentLayer,
    roomSize,
    userPosition.x,
    userPosition.y,
    visionRadius,
    gridWorldOffset,
  ]);

  // Mouse wheel zoom handler - attached via ref to support non-passive listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Determine zoom direction (smoother increments)
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(8, zoom + zoomDelta));

      if (newZoom === zoom) return; // No change

      // Calculate world position at cursor before zoom
      const worldXBefore = (mouseX - pan.x) / zoom;
      const worldYBefore = (mouseY - pan.y) / zoom;

      // Calculate world position at cursor after zoom
      const worldXAfter = (mouseX - pan.x) / newZoom;
      const worldYAfter = (mouseY - pan.y) / newZoom;

      // Adjust pan to keep cursor at same world position
      setPan({
        x: pan.x + (worldXAfter - worldXBefore) * newZoom,
        y: pan.y + (worldYAfter - worldYBefore) * newZoom,
      });

      setZoom(newZoom);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan]);

  // Mouse handlers for pan - memoized to avoid recreations
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan.x, pan.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click handler to inspect tile metadata - memoized
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Calculate render scale
      const renderScale = TILE_SIZE * zoom;

      // Convert canvas coords to world coords accounting for pan and renderScale
      const worldX = Math.floor((clickX - pan.x) / renderScale);
      const worldY = Math.floor((clickY - pan.y) / renderScale);

      // Bounds check
      if (worldX < 0 || worldY < 0 || worldY >= activeGrid.length || worldX >= activeGrid[0].length) {
        return;
      }

      // Extract biome
      const biome = activeGrid[worldY][worldX];

      // Calculate room coordinates
      const roomX = Math.floor(worldX / roomSize);
      const roomY = Math.floor(worldY / roomSize);
      // const roomKey = `${roomX},${roomY}`; // Unused

      // Find structure in this room
      const structure = structures.find((s) => {
        const sRoomX = Math.floor(s.x / roomSize);
        const sRoomY = Math.floor(s.y / roomSize);
        return sRoomX === roomX && sRoomY === roomY;
      });

      // Build metadata
      const metadata: VoxelMetadata = {
        worldCoords: { x: worldX, y: worldY, z: currentLayer },
        roomCoords: { x: roomX, y: roomY },
        biome: biome || 'unknown',
        temperature: 0.5, // Placeholder
        moisture: 0.5, // Placeholder
        elevation: 0, // Placeholder
        // isWalkable is not in the interface, so we can omit it or add it if needed, but for now let's stick to the interface to fix the crash.
        // The interface has [key: string]: any on structure, but not on root.
        // Let's check VoxelMetadataPanel.tsx again. It has optional elevation, temperature, moisture.
        structure: structure
          ? {
              name: structure.name,
              type: structure.type,
              description: structure.description || 'A mysterious structure',
            }
          : undefined,
      };

      setSelectedMetadata(metadata);
    },
    [activeGrid, structures, zoom, pan, currentLayer, roomSize]
  );

  return (
    <div className="space-y-4">
      {/* Main terrain view */}
      <div className="card p-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300">Terrain Explorer</h3>

          <div className="flex items-center gap-4">
            {/* Z-Index Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-shadow-500">Z</span>
              <button
                type="button"
                onClick={() => setCurrentLayer(Math.max(-3, currentLayer - 1))}
                className="btn-secondary p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono font-bold text-aurora-300 min-w-[80px] text-center">
                {currentLayer < 0 ? `Floor ${currentLayer}` : currentLayer === 0 ? 'Surface' : `Floor +${currentLayer}`}
              </span>
              <button
                type="button"
                onClick={() => setCurrentLayer(Math.min(3, currentLayer + 1))}
                className="btn-secondary p-1"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newZoom = Math.max(0.5, zoom - 0.5);
                  const container = containerRef.current;
                  if (container) {
                    const centerX = container.clientWidth / 2;
                    const centerY = container.clientHeight / 2;
                    // Zoom toward center
                    const worldXBefore = (centerX - pan.x) / zoom;
                    const worldYBefore = (centerY - pan.y) / zoom;
                    const worldXAfter = (centerX - pan.x) / newZoom;
                    const worldYAfter = (centerY - pan.y) / newZoom;
                    setPan({
                      x: pan.x + (worldXAfter - worldXBefore) * newZoom,
                      y: pan.y + (worldYAfter - worldYBefore) * newZoom,
                    });
                  }
                  setZoom(newZoom);
                }}
                className="btn-secondary p-1"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-shadow-400">{zoom.toFixed(1)}x</span>
              <button
                type="button"
                onClick={() => {
                  const newZoom = Math.min(8, zoom + 0.5);
                  const container = containerRef.current;
                  if (container) {
                    const centerX = container.clientWidth / 2;
                    const centerY = container.clientHeight / 2;
                    // Zoom toward center
                    const worldXBefore = (centerX - pan.x) / zoom;
                    const worldYBefore = (centerY - pan.y) / zoom;
                    const worldXAfter = (centerX - pan.x) / newZoom;
                    const worldYAfter = (centerY - pan.y) / newZoom;
                    setPan({
                      x: pan.x + (worldXAfter - worldXBefore) * newZoom,
                      y: pan.y + (worldYAfter - worldYBefore) * newZoom,
                    });
                  }
                  setZoom(newZoom);
                }}
                className="btn-secondary p-1"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(2);
                  setPan({ x: 0, y: 0 });
                }}
                className="btn-secondary p-1"
                title="Reset view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex gap-3 mb-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showVisionRadius}
              onChange={(e) => setShowVisionRadius(e.target.checked)}
              className="rounded border-midnight-400 text-aurora-400"
            />
            <span className="text-shadow-300">Vision Radius</span>
            <div className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded border-midnight-400 text-aurora-400"
            />
            <span className="text-shadow-300">Room Grid</span>
            <div className="w-3 h-3 border border-shadow-600 bg-shadow-900/50" />
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showStructures}
              onChange={(e) => setShowStructures(e.target.checked)}
              className="rounded border-midnight-400 text-aurora-400"
            />
            <span className="text-shadow-300">Structures</span>
            <div className="w-3 h-3 bg-red-500 rounded" />
          </label>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden border border-midnight-600"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          // onWheel handled via ref in useEffect
        >
          <AspectRatio ratio={16 / 9} className="w-full h-full">
            <canvas
              ref={canvasRef}
              className={`w-full h-full cursor-move ${isDragging ? 'cursor-grabbing' : ''}`}
              onClick={handleCanvasClick}
            />
          </AspectRatio>
        </div>

        {/* Info Bar */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-shadow-400">
              Layer: {currentLayer < 0 ? 'Underground' : currentLayer === 0 ? 'Surface' : 'Sky'}
            </span>
            <span className="text-shadow-400">
              WASD to move, drag to pan, click to inspect
              {isLoading && <span className="ml-2 text-aurora-300">(Loading...)</span>}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-shadow-400">User</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-400" />
              <span className="text-shadow-400">Vision</span>
            </div>
          </div>
        </div>

        {/* Biome Legend */}
        <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
          {Object.entries(BIOME_COLORS)
            .slice(0, 16)
            .map(([biome, color]) => (
              <div key={biome} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-shadow-400 capitalize truncate">{biome}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Metadata Panel - Full Width Below */}
      <div>
        {selectedMetadata ? (
          <VoxelMetadataPanel metadata={selectedMetadata} onClose={() => setSelectedMetadata(null)} />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm text-shadow-400">Click any tile to inspect</p>
          </div>
        )}
      </div>
    </div>
  );
}
