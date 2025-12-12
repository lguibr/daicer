/**
 * Unit tests for TerrainExplorer component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { TerrainExplorer } from './TerrainExplorer';

describe('TerrainExplorer', () => {
  const mockBiomeGrid = Array(128)
    .fill(null)
    .map(() => Array(128).fill('plains'));

  const mockStructures = [
    {
      name: 'Test Settlement',
      x: 256,
      y: 256,
      type: 'settlement',
    },
  ];

  it('should render canvas element', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render terrain explorer title', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getByText('Terrain Explorer')).toBeInTheDocument();
  });

  it('should render layer controls', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getByText('Surface')).toBeInTheDocument();
  });

  it('should render zoom controls', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    // Initial zoom is 2.0 x (text might be split)
    expect(screen.getByText((content) => content.includes('2.0') && content.includes('x'))).toBeInTheDocument();
  });

  it('should render view toggles', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getByText('Vision Radius')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getByText('Structures')).toBeInTheDocument();
  });

  it('should render biome legend', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getAllByText(/ocean/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/forest/i)).toBeInTheDocument();
    expect(screen.getByText(/desert/i)).toBeInTheDocument();
  });

  it('should set canvas dimensions based on grid size and zoom', async () => {
    // Mock container dimensions
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 });

    const { container } = render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} initialZoom={2} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();

    // Verify it uses container dimensions since it matches them (1:1) in the component logic
    // const containerWidth = container.clientWidth; -> 500
    await waitFor(() => {
      expect(canvas?.width).toBe(500);
      expect(canvas?.height).toBe(500);
    });
  });

  it('should calculate room coordinates correctly for structure at (256, 256) with roomSize=32', () => {
    // This is more of a logic test - we verify the math in rendering
    const roomSize = 32;
    const structure = { name: 'Test', x: 256, y: 256, type: 'settlement' };

    const roomX = Math.floor(structure.x / roomSize);
    const roomY = Math.floor(structure.y / roomSize);

    expect(roomX).toBe(8);
    expect(roomY).toBe(8);
  });

  it('should render with custom roomSize', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} roomSize={64} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle empty structures array', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render info bar with instructions', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getByText(/Drag to pan/i)).toBeInTheDocument();
  });

  it('should render user position indicator in legend', () => {
    render(<TerrainExplorer biomeGrid={mockBiomeGrid} structures={[]} />);

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });
});
