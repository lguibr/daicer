/**
 * Reusable Canvas Grid Renderer
 * Supports both per-cell and full-canvas rendering
 */

import React, { useEffect, useRef } from 'react';

export interface GridCanvasProps {
  width: number;
  height: number;
  cellSize?: number;
  renderCell?: (ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  className?: string;
}

export function GridCanvas({ width, height, cellSize = 10, renderCell, onRender, className }: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Full canvas render mode
    if (onRender) {
      try {
        onRender(ctx, canvas.width, canvas.height);
      } catch (error) {
        console.error('[GridCanvas] Render error:', error);
      }
      return;
    }

    // Per-cell render mode
    if (renderCell) {
      try {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            renderCell(ctx, x, y, cellSize);
          }
        }
      } catch (error) {
        console.error('[GridCanvas] Render error:', error);
      }
    }
  }, [width, height, cellSize, renderCell, onRender]);

  const canvasWidth = onRender ? width : width * cellSize;
  const canvasHeight = onRender ? height : height * cellSize;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={className}
      style={{
        imageRendering: 'pixelated',
        border: '1px solid var(--border)',
      }}
    />
  );
}
