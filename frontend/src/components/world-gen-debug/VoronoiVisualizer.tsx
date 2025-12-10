/**
 * Voronoi + Poisson Disc Visualizer
 * Shows evenly distributed points and colored Voronoi regions
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';
import { poissonDiskSampling2D } from '@daicer/shared/world-gen/voronoi';
import { GridCanvas } from './GridCanvas';
import { SeedControl } from './SeedControl';
import { DebugStats } from './DebugStats';

interface Point2D {
  x: number;
  y: number;
}

export function VoronoiVisualizer() {
  const [seed, setSeed] = useState('voronoi-demo');
  const [gridSize] = useState({ width: 512, height: 512 });
  const [minDistance, setMinDistance] = useState(40);
  const [maxAttempts, setMaxAttempts] = useState(30);
  const [points, setPoints] = useState<Point2D[]>([]);
  const [generationTime, setGenerationTime] = useState(0);

  // Generate Poisson points
  const generatePoints = useCallback(() => {
    const startTime = performance.now();
    const pts = poissonDiskSampling2D(gridSize.width, gridSize.height, minDistance, maxAttempts, seed);
    setPoints(pts);
    setGenerationTime(performance.now() - startTime);
  }, [seed, gridSize, minDistance, maxAttempts]);

  // Generate on mount or param change
  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  // Render Voronoi diagram
  const renderVoronoi = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      if (points.length === 0) return;

      // Draw Voronoi regions (simple nearest-point coloring)
      const imageData = ctx.createImageData(width, height);
      const { data } = imageData;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Find nearest point
          let minDist = Infinity;
          let nearestIdx = 0;

          for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            if (!pt) continue;
            const dx = pt.x - x;
            const dy = pt.y - y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              nearestIdx = i;
            }
          }

          // Color based on nearest point index
          const hue = (nearestIdx * 137.5) % 360;
          const rgb = hslToRgb(hue / 360, 0.6, 0.4);

          const idx = (y * width + x) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw points on top
      points.forEach((pt, i) => {
        const hue = (i * 137.5) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw minimum distance circles (visual aid)
      if (points.length > 0 && points.length < 20) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        points.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, minDistance, 0, Math.PI * 2);
          ctx.stroke();
        });
      }
    },
    [points, minDistance]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voronoi Diagram + Poisson Disc Sampling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seed Control */}
          <SeedControl seed={seed} onSeedChange={setSeed} />

          {/* Parameters */}
          <div className="space-y-4">
            <Label className="text-base">Poisson Disc Parameters:</Label>

            <div className="space-y-2">
              <Label>Min Distance: {minDistance}px</Label>
              <Slider
                value={[minDistance]}
                onValueChange={([v]) => v != null && setMinDistance(v)}
                min={20}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Minimum spacing between any two points. Ensures even distribution.
                <br />
                <strong>Smaller (20-40px):</strong> Dense point clusters, many regions, busy map
                <br />
                <strong>Larger (60-100px):</strong> Sparse points, large regions, clean map
                <br />
                <strong>Use case:</strong> Trees/rocks (small), Towns/cities (large)
                <br />
                <strong>Deterministic:</strong> ✅ Same seed + distance = identical point placement
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Attempts: {maxAttempts}</Label>
              <Slider
                value={[maxAttempts]}
                onValueChange={([v]) => v != null && setMaxAttempts(v)}
                min={10}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> How hard algorithm tries to place points near existing ones before giving
                up.
                <br />
                <strong>Lower (10-20):</strong> Faster, but may miss spots. Fewer points.
                <br />
                <strong>Higher (30-50):</strong> Slower, but fills space better. More points.
                <br />
                <strong>Recommended:</strong> 30 for good coverage without slowdown
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button onClick={generatePoints} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          {/* Canvas */}
          <GridCanvas width={512} height={512} onRender={renderVoronoi} />

          {/* Stats */}
          <DebugStats
            stats={{
              'Grid Size': `${gridSize.width}x${gridSize.height}`,
              'Points Generated': points.length,
              'Min Distance': `${minDistance}px`,
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
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-sm">Sample Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
              <span className="text-sm">Voronoi Regions (colored by nearest point)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Poisson disc sampling creates evenly spaced points. Voronoi diagram colors each pixel by its nearest point,
            creating natural-looking regions for biome distribution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: HSL to RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
