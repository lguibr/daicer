/**
 * BSP Room Layout Visualizer
 * Animated binary space partitioning visualization
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Alea } from '@daicer/shared/world-gen/noise';
import { GridCanvas } from './GridCanvas';
import { SeedControl } from './SeedControl';
import { DebugStats } from './DebugStats';

interface BSPRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  isLeaf: boolean;
  leftChild?: BSPRoom;
  rightChild?: BSPRoom;
  corridorStart?: { x: number; y: number };
  corridorEnd?: { x: number; y: number };
}

interface BSPParams {
  minRoomSize: number;
  maxRoomSize: number;
  splitRatio: number;
}

export function BSPVisualizer() {
  const [seed, setSeed] = useState('bsp-demo');
  const [gridSize, setGridSize] = useState({ width: 64, height: 64 });
  const [params, setParams] = useState<BSPParams>({
    minRoomSize: 4,
    maxRoomSize: 12,
    splitRatio: 0.5,
  });

  const [rooms, setRooms] = useState<BSPRoom[]>([]);
  const [allRooms, setAllRooms] = useState<BSPRoom[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(400);
  const [generationTime, setGenerationTime] = useState(0);

  // Generate BSP tree with step tracking
  const generateBSP = useCallback(() => {
    const startTime = performance.now();
    const rng = Alea(seed);

    const root: BSPRoom = {
      x: 0,
      y: 0,
      width: gridSize.width,
      height: gridSize.height,
      isLeaf: true,
    };

    const steps: BSPRoom[] = [];

    const splitRoom = (room: BSPRoom, depth: number = 0): void => {
      if (depth > 6) return;
      if (room.width <= params.maxRoomSize && room.height <= params.maxRoomSize) {
        room.isLeaf = true;
        return;
      }

      const canSplitH = room.height >= params.minRoomSize * 2;
      const canSplitV = room.width >= params.minRoomSize * 2;

      if (!canSplitH && !canSplitV) {
        room.isLeaf = true;
        return;
      }

      let splitH: boolean;
      if (canSplitH && !canSplitV) splitH = true;
      else if (!canSplitH && canSplitV) splitH = false;
      else splitH = rng() > 0.5;

      room.isLeaf = false;

      // Save snapshot BEFORE split
      steps.push(JSON.parse(JSON.stringify(root)));

      if (splitH) {
        const splitY = Math.floor(room.height * (0.4 + rng() * 0.2));
        room.leftChild = {
          x: room.x,
          y: room.y,
          width: room.width,
          height: splitY,
          isLeaf: true,
        };
        room.rightChild = {
          x: room.x,
          y: room.y + splitY,
          width: room.width,
          height: room.height - splitY,
          isLeaf: true,
        };
      } else {
        const splitX = Math.floor(room.width * (0.4 + rng() * 0.2));
        room.leftChild = {
          x: room.x,
          y: room.y,
          width: splitX,
          height: room.height,
          isLeaf: true,
        };
        room.rightChild = {
          x: room.x + splitX,
          y: room.y,
          width: room.width - splitX,
          height: room.height,
          isLeaf: true,
        };
      }

      splitRoom(room.leftChild, depth + 1);
      splitRoom(room.rightChild, depth + 1);
    };

    splitRoom(root);
    steps.push(JSON.parse(JSON.stringify(root))); // Final state

    setAllRooms(steps);
    setCurrentStep(0);
    setGenerationTime(performance.now() - startTime);
  }, [seed, gridSize, params]);

  // Auto-animate
  useEffect(() => {
    if (!isAnimating) return;
    if (currentStep >= allRooms.length - 1) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentStep, allRooms.length, animationSpeed]);

  // Generate on mount or param change
  useEffect(() => {
    generateBSP();
  }, [generateBSP]);

  // Render BSP tree
  const renderBSP = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const scaleX = width / gridSize.width;
      const scaleY = height / gridSize.height;

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const currentTree = allRooms[currentStep];
      if (!currentTree) return;

      // Collect all leaf rooms from current tree
      const leafRooms: BSPRoom[] = [];
      const collectLeaves = (room: BSPRoom) => {
        if (room.isLeaf) {
          leafRooms.push(room);
        } else {
          if (room.leftChild) collectLeaves(room.leftChild);
          if (room.rightChild) collectLeaves(room.rightChild);
        }
      };
      collectLeaves(currentTree);

      // Draw all leaf rooms
      leafRooms.forEach((room, i) => {
        const hue = (i * 137.5) % 360;
        ctx.fillStyle = `hsl(${hue}, 60%, 40%)`;
        ctx.fillRect(room.x * scaleX, room.y * scaleY, room.width * scaleX, room.height * scaleY);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x * scaleX, room.y * scaleY, room.width * scaleX, room.height * scaleY);
      });
    },
    [allRooms, currentStep, gridSize]
  );

  const currentTree = allRooms[currentStep];
  const leafRooms: BSPRoom[] = [];
  if (currentTree) {
    const collectLeaves = (room: BSPRoom) => {
      if (room.isLeaf) {
        leafRooms.push(room);
      } else {
        if (room.leftChild) collectLeaves(room.leftChild);
        if (room.rightChild) collectLeaves(room.rightChild);
      }
    };
    collectLeaves(currentTree);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BSP Room Layout Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seed Control */}
          <SeedControl seed={seed} onSeedChange={setSeed} />

          {/* Grid Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width: {gridSize.width}</Label>
              <Slider
                value={[gridSize.width]}
                onValueChange={([w]) => setGridSize((prev) => ({ ...prev, width: w }))}
                min={32}
                max={128}
                step={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Height: {gridSize.height}</Label>
              <Slider
                value={[gridSize.height]}
                onValueChange={([h]) => setGridSize((prev) => ({ ...prev, height: h }))}
                min={32}
                max={128}
                step={8}
              />
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <Label className="text-base">BSP Parameters:</Label>

            <div className="space-y-2">
              <Label>Min Room Size: {params.minRoomSize} tiles</Label>
              <Slider
                value={[params.minRoomSize]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, minRoomSize: v }))}
                min={3}
                max={8}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Smallest allowed room dimension. Algorithm stops splitting when rooms hit
                this size.
                <br />
                <strong>Smaller (3-4):</strong> Many tiny rooms, complex mazes
                <br />
                <strong>Larger (6-8):</strong> Fewer, bigger rooms, simpler layouts
                <br />
                <strong>Deterministic:</strong> ✅ Same seed + min size = identical room pattern
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Room Size: {params.maxRoomSize} tiles</Label>
              <Slider
                value={[params.maxRoomSize]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, maxRoomSize: v }))}
                min={8}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Target room size. Algorithm keeps splitting until rooms are smaller than
                this.
                <br />
                <strong>Smaller (8-12):</strong> Uniform, grid-like layout
                <br />
                <strong>Larger (15-20):</strong> Varied room sizes, organic feel
                <br />
                <strong>Note:</strong> Must be &gt; 2× min size for splitting to work
              </p>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="space-y-2">
            <Label>Animation Speed: {animationSpeed}ms</Label>
            <Slider
              value={[animationSpeed]}
              onValueChange={([v]) => setAnimationSpeed(v)}
              min={100}
              max={1000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">Lower = faster animation</p>
          </div>

          {/* Step Controls */}
          <div className="flex items-center gap-3">
            <Button onClick={generateBSP} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => setIsAnimating(!isAnimating)}
              variant="default"
              size="sm"
              disabled={currentStep >= rooms.length - 1}
            >
              {isAnimating ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Animate
                </>
              )}
            </Button>
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, allRooms.length - 1))}
              variant="outline"
              size="sm"
              disabled={currentStep >= allRooms.length - 1}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Step
            </Button>
            <span className="text-sm text-muted-foreground">
              Step: {currentStep + 1} / {allRooms.length}
            </span>
          </div>

          {/* Canvas */}
          <GridCanvas width={512} height={512} onRender={renderBSP} />

          {/* Stats */}
          <DebugStats
            stats={{
              'Grid Size': `${gridSize.width}x${gridSize.height}`,
              'Split Step': `${currentStep + 1}/${allRooms.length}`,
              'Leaf Rooms': leafRooms.length,
              'Generation Time': `${generationTime.toFixed(2)}ms`,
            }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-green-500 rounded" />
              <span className="text-sm">Current Split</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-white bg-blue-500 rounded" />
              <span className="text-sm">Leaf Rooms (colored by hue)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Binary Space Partitioning recursively splits the area into non-overlapping rooms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
