import { Download } from 'lucide-react';
import type { GridTile } from '@daicer/shared/world/world';
import { Button } from '../ui/button';

interface DebugMapExportProps {
  context: 'PREVIEW' | 'GAME';
  grid: (GridTile | string | null)[][];
  seed?: string | number;
  params?: any;
  roomId?: string;
}

export function DebugMapExport({ context, grid, seed, params, roomId }: DebugMapExportProps) {
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      context,
      roomId,
      seed,
      params,
      gridSummary: {
        width: grid[0]?.length || 0,
        height: grid.length || 0,
        // Sample top-left 5x5
        sample: grid
          .slice(0, 5)
          .map((row) => row.slice(0, 5).map((cell) => (typeof cell === 'string' ? cell : cell?.biome))),
      },
      // simple hash or full dump? User asked for rendered values.
      // Let's dump a simplified text map for easy diffing
      fullGridMap: grid.map((row) =>
        row.map((cell) => {
          const biome = typeof cell === 'string' ? cell : cell?.biome;
          return biome || 'Empty';
        })
      ),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map-debug-${context}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExport}
      size="sm"
      variant="destructive"
      className="fixed bottom-4 right-4 z-[9999] opacity-80 hover:opacity-100 shadow-xl border-2 border-red-500 font-mono text-xs"
    >
      <Download className="w-4 h-4 mr-2" />
      DEBUG MAP ({context})
    </Button>
  );
}
