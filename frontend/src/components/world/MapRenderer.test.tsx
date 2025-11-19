/**
 * MapRenderer Component Tests
 * Fast, reliable tests for map rendering without full E2E
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MapRenderer } from './MapRenderer';

describe('MapRenderer', () => {
  const mockStructures = [
    {
      id: 'struct-1',
      name: 'Test Settlement',
      x: 100,
      y: 100,
      size: 'medium' as const,
      width: 32,
      height: 32,
      type: 'settlement' as const,
      significance: 8,
      era: 0,
      description: 'A test settlement',
    },
    {
      id: 'struct-2',
      name: 'Dark Tower',
      x: 200,
      y: 150,
      size: 'large' as const,
      width: 48,
      height: 48,
      type: 'landmark' as const,
      significance: 9,
      era: 1,
      description: 'A mysterious tower',
    },
  ];

  const mockRoads = [
    {
      id: 'road-1',
      from: 'struct-1',
      to: 'struct-2',
      waypoints: [
        { x: 100, y: 100, type: 'junction' as const },
        { x: 150, y: 125, type: 'path' as const },
        { x: 200, y: 150, type: 'junction' as const },
      ],
      terrain: 'flat' as const,
      quality: 'road' as const,
    },
  ];

  it('renders canvas element', () => {
    render(<MapRenderer roomId="test-room" structures={mockStructures} roads={mockRoads} />);

    const canvas = screen.getByRole('img', { hidden: true }) || document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('displays layer controls', () => {
    render(<MapRenderer roomId="test-room" structures={mockStructures} roads={mockRoads} />);

    expect(screen.getByText(/Layer/i)).toBeInTheDocument();
    expect(screen.getByText(/Z-Layer/i)).toBeInTheDocument();
  });

  it('shows structure count', () => {
    render(<MapRenderer roomId="test-room" structures={mockStructures} roads={mockRoads} />);

    expect(screen.getByText(/2 structures/i)).toBeInTheDocument();
    expect(screen.getByText(/1 roads/i)).toBeInTheDocument();
  });

  it('renders without black pixels', async () => {
    render(<MapRenderer roomId="test-room" structures={mockStructures} roads={mockRoads} />);

    await waitFor(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();

      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let blackPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0 && pixels[i + 3] > 128) {
          blackPixels++;
        }
      }

      // Should have < 10 black pixels (virtually none)
      expect(blackPixels).toBeLessThan(10);
    });
  });

  it('persists canvas across re-renders', async () => {
    const { rerender } = render(<MapRenderer roomId="test-room" structures={mockStructures} roads={mockRoads} />);

    const canvas1 = document.querySelector('canvas');
    expect(canvas1).toBeTruthy();

    // Re-render with new props
    rerender(<MapRenderer roomId="test-room" structures={[...mockStructures]} roads={mockRoads} />);

    const canvas2 = document.querySelector('canvas');
    expect(canvas2).toBe(canvas1); // Same canvas element (not re-created)
  });
});
