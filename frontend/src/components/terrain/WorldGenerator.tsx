import { useState, useEffect } from 'react';
import { useWorldGeneration, type GeneratedStructure } from '../../hooks/useWorldGeneration';
import { TerrainExplorer } from './TerrainExplorer';
import { Loader2, Wand2, Dice5, RefreshCcw, Map as MapIcon, Layers } from 'lucide-react';
import { toast } from 'sonner';
// import { useI18n } from '../../i18n'; // Removed unused
import cn from '@/lib/utils';
import { gildedTokens } from '@/theme/gildedTokens';

interface WorldGeneratorProps {
  onWorldGenerated: (data: {
    room_code: string;
    width: number;
    height: number;
    seed: string;
    structures: GeneratedStructure[];
  }) => void;
  isGenerating?: boolean;
}

export function WorldGenerator({ onWorldGenerated, isGenerating: externalIsGenerating }: WorldGeneratorProps) {
  // const { t } = useI18n(); // Removed unused t
  const [params, setParams] = useState({
    seed: Math.random().toString(36).substring(7),
    width: 64,
    height: 64,
    scale: 45,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    moistureScale: 45,
    moistureOffset: 0,
    rivers: 5,
  });

  // We can use the hook's returned state directly instead of maintaining local previewData
  const {
    generateWorld,
    isGenerating: hookIsGenerating,
    grid, // GridTile[][]
    grid3D, // GridTile[][][]
    structures, // The generated structures
  } = useWorldGeneration();

  const isGenerating = externalIsGenerating || hookIsGenerating;

  // Sync hook state to parent
  useEffect(() => {
    if (grid && grid.length > 0) {
      onWorldGenerated({
        room_code: 'DRAFT',
        width: params.width,
        height: params.height,
        seed: params.seed,
        structures: structures,
      });
    }
  }, [grid, structures, params, onWorldGenerated]);

  const handleGeneratePreview = async () => {
    try {
      // Use standard preview size
      const previewSize = 64;
      await generateWorld(params.seed, previewSize, {
        // Map flat params to GenerationParams structure if needed, or pass full params object
        // For now assuming params align or we pass a constructed object
        elevationScale: params.scale / 1000, // Example conversion if needed, simplified here
        elevationOctaves: params.octaves,
        elevationPersistence: params.persistence,
        moistureScale: params.moistureScale / 1000,
        moistureOctaves: 3,
        moisturePersistence: 0.5,
        structureMinDistance: 15,
        maxStructures: 10,
        caveFillPercentage: 0.45,
        caveIterations: 4,
        caveBirthLimit: 4,
        caveDeathLimit: 3,
        bspSize: 128,
        bspMinRoomSize: 10,
        bspMaxRoomSize: 30,
        featureMinDistance: 4,
        featureAttempts: 30,
        generateRoads: true,
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    }
  };

  const handleRandomize = () => {
    setParams((prev) => ({
      ...prev,
      seed: Math.random().toString(36).substring(7),
      scale: Math.floor(Math.random() * 60) + 20,
      rivers: Math.floor(Math.random() * 10),
    }));
  };

  // Generate initial preview on mount
  // Generate initial preview on mount
  useEffect(() => {
    if (!grid?.length && !isGenerating) {
      handleGeneratePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Controls Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className={cn(gildedTokens.glassPanel, 'flex flex-col gap-6 relative overflow-hidden')}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-midnight-600/50 pb-4">
            <div className="p-2 rounded-lg bg-midnight-800/50 border border-midnight-600 text-aurora-300">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-shadow-100 uppercase tracking-wider">World Shaper</h3>
              <p className="text-xs text-shadow-400">Forge the boundaries of your realm.</p>
            </div>
          </div>

          {/* Seed Input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-shadow-300 flex items-center justify-between">
              <span>World Seed</span>
              <button
                onClick={handleRandomize}
                className="text-aurora-400 hover:text-aurora-200 transition-colors"
                title="Randomize"
                type="button"
              >
                <Dice5 className="h-4 w-4 animate-pulse-slow" />
              </button>
            </label>
            <div className="relative group">
              <input
                type="text"
                value={params.seed}
                onChange={(e) => setParams({ ...params, seed: e.target.value })}
                className="input-style font-mono text-center tracking-widest text-aurora-100 border-aurora-500/20 focus:border-aurora-500/50"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-aurora-500/20 pointer-events-none transition-all" />
            </div>
          </div>

          <div className="h-px bg-midnight-700/50" />

          {/* Sliders Grid */}
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Scale */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-shadow-300">
                <span className="flex items-center gap-2">
                  <MapIcon className="h-3 w-3" /> Terrain Scale
                </span>
                <span className="font-mono text-aurora-300">{params.scale}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={params.scale}
                onChange={(e) => setParams({ ...params, scale: Number(e.target.value) })}
                className="w-full accent-aurora-500 h-1.5 bg-midnight-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Rivers */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-shadow-300">
                <span className="flex items-center gap-2">
                  <RefreshCcw className="h-3 w-3" /> Hydrography
                </span>
                <span className="font-mono text-aurora-300">{params.rivers}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={params.rivers}
                onChange={(e) => setParams({ ...params, rivers: Number(e.target.value) })}
                className="w-full accent-nebula-500 h-1.5 bg-midnight-700 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Persistence */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-shadow-300">
                <span className="flex items-center gap-2">
                  <Layers className="h-3 w-3" /> Ruggedness
                </span>
                <span className="font-mono text-aurora-300">{params.persistence}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.persistence}
                onChange={(e) => setParams({ ...params, persistence: Number(e.target.value) })}
                className="w-full accent-shadow-400 h-1.5 bg-midnight-700 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            type="button"
            className={cn(
              'btn-primary w-full flex items-center justify-center gap-2',
              isGenerating && 'opacity-80 cursor-wait'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Weaving Reality...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Regenerate World</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
        <div className="relative flex-1 rounded-2xl border border-midnight-500/50 bg-black/40 shadow-2xl overflow-hidden group">
          {/* Frame Decoration */}
          <div className="absolute inset-0 pointer-events-none z-20 border-[6px] border-midnight-800/80 rounded-2xl" />
          <div className="absolute inset-0 pointer-events-none z-20 border border-aurora-500/20 rounded-2xl mix-blend-overlay" />

          {/* Title Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-midnight-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-aurora-500/30">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aurora-200">
              Cartographer's View
            </span>
          </div>

          {grid && grid.length > 0 ? (
            <TerrainExplorer
              biomeGrid={grid}
              biomeGrid3D={grid3D}
              structures={structures}
              roomSize={32}
              initialZoom={2}
              enableInfinite={false}
            />
          ) : null}

          {(!grid || grid.length === 0) && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center text-midnight-500">
              <div className="flex flex-col items-center gap-4">
                <MapIcon className="h-12 w-12 opacity-50" />
                <p className="text-sm uppercase tracking-widest">Awaiting Generation</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend / Info */}
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-none opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-900/50 border border-midnight-700/50 text-[10px] uppercase tracking-wider text-shadow-300">
            <div className="h-2 w-2 rounded-full bg-blue-500" /> Water
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-900/50 border border-midnight-700/50 text-[10px] uppercase tracking-wider text-shadow-300">
            <div className="h-2 w-2 rounded-full bg-green-600" /> Forest
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-900/50 border border-midnight-700/50 text-[10px] uppercase tracking-wider text-shadow-300">
            <div className="h-2 w-2 rounded-full bg-stone-500" /> Mountain
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-midnight-900/50 border border-midnight-700/50 text-[10px] uppercase tracking-wider text-shadow-300">
            <div className="h-2 w-2 rounded-full bg-red-500" /> Structure
          </div>
        </div>
      </div>
    </div>
  );
}
