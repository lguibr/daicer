/**
 * Maps Page - Procedural World Generation with Preview
 * Integrated world gen debugger with parameter selection, preview, and save workflow
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { WorldParametersForm, type WorldParameters } from '../components/assets/WorldParametersForm';
import { WorldGenParametersPanel } from '../components/assets/WorldGenParametersPanel';
import { WorldGenPreview } from '../components/assets/WorldGenPreview';
import { TerrainExplorer } from '../components/terrain/TerrainExplorer';
import { AssetPlacementOverlay } from '../components/assets/AssetPlacementOverlay';
import { useAssetsStore } from '../state/assetsStore';
import { createWorld, getWorlds, deleteWorld } from '../services/assetService';
import { initSocket } from '../services/socket';
import { useWorldGeneration, DEFAULT_GENERATION_PARAMS, type GenerationParams } from '../hooks/useWorldGeneration';
import Input from '../components/ui/input';

export default function AssetsMapsPage() {
  const { worlds, setWorlds, addWorld, removeWorld, isLoading, setLoading, setError } = useAssetsStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showPlacement, setShowPlacement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Preview mode state
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [previewSeed, setPreviewSeed] = useState('');
  const [previewMapSize, setPreviewMapSize] = useState(256);
  const [previewParams, setPreviewParams] = useState<GenerationParams>(DEFAULT_GENERATION_PARAMS);
  const [previewWorldName, setPreviewWorldName] = useState('');

  // World generation hook
  const { isGenerating, biomeGrid, biomeGrid3D, structures, generateWorld, createChunkGenerator } =
    useWorldGeneration();

  // Saved world data (for viewing existing worlds)
  const [selectedWorldBiomeGrid, setSelectedWorldBiomeGrid] = useState<string[][]>([]);
  const [selectedWorldBiomeGrid3D, setSelectedWorldBiomeGrid3D] = useState<string[][][]>([]);
  const [selectedWorldStructures, setSelectedWorldStructures] = useState<any[]>([]);

  // Chunk generator for preview
  const chunkGenerator = useMemo(() => {
    const generator = createChunkGenerator(previewSeed, previewParams);
    return {
      generateChunk: (worldX: number, worldY: number, width: number, height: number): string[][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        return (
          chunk3D[3] ||
          Array(height)
            .fill(0)
            .map(() => Array(width).fill('plains'))
        );
      },
      generateChunk3D: generator,
    };
  }, [createChunkGenerator, previewSeed, previewParams]);

  // Chunk generator for saved worlds
  const selectedWorldChunkGenerator = useMemo(() => {
    const selectedWorldData = worlds.find((w) => w.id === selectedWorld);
    if (!selectedWorldData) {
      return {
        generateChunk: () => [['plains']],
        generateChunk3D: () => [[[]]],
      };
    }

    const generator = createChunkGenerator(selectedWorldData.seed, previewParams);
    return {
      generateChunk: (worldX: number, worldY: number, width: number, height: number): string[][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        return (
          chunk3D[3] ||
          Array(height)
            .fill(0)
            .map(() => Array(width).fill('plains'))
        );
      },
      generateChunk3D: generator,
    };
  }, [createChunkGenerator, selectedWorld, worlds, previewParams]);

  // Initialize socket connection
  useEffect(() => {
    let mounted = true;

    const initializeSocket = async () => {
      try {
        await initSocket();
      } catch (err) {
        if (mounted) {
          console.error('Failed to initialize socket:', err);
        }
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
    };
  }, []);

  // Load worlds on mount
  useEffect(() => {
    let mounted = true;

    const loadWorlds = async () => {
      setLoading(true);
      try {
        const data = await getWorlds();
        if (mounted) {
          setWorlds(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load worlds');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWorlds();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize preview seed when entering preview mode
  useEffect(() => {
    if (showPreviewMode && !previewSeed) {
      setPreviewSeed(Math.random().toString(36).substring(2, 15));
    }
  }, [showPreviewMode, previewSeed]);

  // Regenerate world when selecting a saved world
  useEffect(() => {
    if (selectedWorld) {
      const worldData = worlds.find((w) => w.id === selectedWorld);
      if (worldData) {
        // Regenerate the world using the same seed and parameters
        const regenerateWorld = async () => {
          await generateWorld(worldData.seed, worldData.width, previewParams);
          // After generation, copy to saved world state
          setSelectedWorldBiomeGrid(biomeGrid);
          setSelectedWorldBiomeGrid3D(biomeGrid3D);
          setSelectedWorldStructures(structures);
        };
        regenerateWorld();
      }
    }
  }, [selectedWorld, worlds]);

  // Sync preview data to saved world data after generation
  useEffect(() => {
    if (selectedWorld && biomeGrid.length > 0) {
      setSelectedWorldBiomeGrid(biomeGrid);
      setSelectedWorldBiomeGrid3D(biomeGrid3D);
      setSelectedWorldStructures(structures);
    }
  }, [biomeGrid, biomeGrid3D, structures, selectedWorld]);

  const handleGeneratePreview = useCallback(() => {
    generateWorld(previewSeed, previewMapSize, previewParams);
  }, [generateWorld, previewSeed, previewMapSize, previewParams]);

  const handleSaveWorld = async () => {
    if (!previewWorldName.trim()) {
      setError('Please enter a world name');
      return;
    }

    if (biomeGrid.length === 0) {
      setError('Please generate a preview first');
      return;
    }

    setLoading(true);
    try {
      const result = await createWorld({
        name: previewWorldName,
        seed: previewSeed,
        width: previewMapSize,
        height: previewMapSize,
        waterLevel: -0.1,
        mountainousness: 1.0,
        jaggedness: 1.0,
        temperature: 0,
        moisture: 0,
      });

      addWorld({
        id: result.id,
        name: previewWorldName,
        width: previewMapSize,
        height: previewMapSize,
        seed: previewSeed,
        parameters: {
          name: previewWorldName,
          seed: previewSeed,
          width: previewMapSize,
          height: previewMapSize,
          waterLevel: -0.1,
          mountainousness: 1.0,
          jaggedness: 1.0,
          temperature: 0,
          moisture: 0,
          continentalness: 0,
          erosion: 0,
          weirdness: 0,
        },
        createdAt: new Date(),
        createdBy: 'current-user',
      });

      setShowPreviewMode(false);
      setSelectedWorld(result.id);
      setPreviewWorldName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save world');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorld = async (params: WorldParameters) => {
    setLoading(true);
    try {
      const result = await createWorld({
        name: params.name,
        seed: params.seed,
        width: params.width,
        height: params.height,
        waterLevel: params.waterLevel,
        mountainousness: params.mountainousness,
        jaggedness: params.jaggedness,
        temperature: params.temperature,
        moisture: params.moisture,
      });
      addWorld({
        id: result.id,
        name: params.name,
        width: params.width,
        height: params.height,
        seed: params.seed,
        parameters: params,
        createdAt: new Date(),
        createdBy: 'current-user',
      });
      setShowCreateForm(false);
      setSelectedWorld(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create world');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    setLoading(true);
    try {
      await deleteWorld(worldId);
      removeWorld(worldId);
      if (selectedWorld === worldId) {
        setSelectedWorld(null);
      }
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete world');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = useCallback((feature: any) => {
    console.log('[AssetsMaps] Feature clicked:', feature);
  }, []);

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);

  const hasPreview = biomeGrid.length > 0;

  return (
    <PrivateLayout showNavbar>
      {/* Header */}
      <div className="border-b border-shadow-800/70 bg-midnight-950/90 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <Link to="/assets" className="mb-2 inline-flex items-center text-sm text-shadow-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assets
            </Link>
            <h1 className="text-2xl font-bold text-white">Procedural Maps</h1>
            <p className="text-shadow-300 text-sm">
              {showPreviewMode
                ? 'Preview & customize world generation'
                : 'Generate worlds with advanced terrain controls'}
            </p>
          </div>
          <div className="flex gap-2">
            {showPreviewMode ? (
              <Button
                onClick={() => {
                  setShowPreviewMode(false);
                  setPreviewWorldName('');
                }}
                variant="ghost"
                className="text-shadow-300 hover:text-white"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Preview
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  variant="outline"
                  className="bg-midnight-800/50 text-shadow-200 hover:bg-midnight-700/50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {showCreateForm ? 'Hide Form' : 'Quick Create'}
                </Button>
                <Button
                  onClick={() => setShowPreviewMode(true)}
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Advanced Create
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}

      {/* Create World Form (Quick Mode) */}
      {showCreateForm && !showPreviewMode && (
        <div className="border-b border-shadow-800/70 bg-midnight-900/50 p-4">
          <div className="container mx-auto">
            <WorldParametersForm onSubmit={handleCreateWorld} loading={isLoading} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showPreviewMode ? (
          /* Preview Mode with Parameters */
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Parameters */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <div className="h-full bg-midnight-950 p-4 overflow-y-auto">
                    {/* World Name Input */}
                    <Card className="border-accent/30 bg-midnight-900/70 mb-4">
                      <CardContent className="p-4">
                        <label className="text-sm font-medium text-shadow-200 block mb-2">World Name</label>
                        <Input
                          value={previewWorldName}
                          onChange={(e) => setPreviewWorldName(e.target.value)}
                          placeholder="My Amazing World"
                          className="bg-midnight-800/50 border-midnight-500 text-white"
                        />
                      </CardContent>
                    </Card>

                    {/* Parameters Panel */}
                    <WorldGenParametersPanel
                      seed={previewSeed}
                      onSeedChange={setPreviewSeed}
                      mapSize={previewMapSize}
                      onMapSizeChange={setPreviewMapSize}
                      params={previewParams}
                      onParamsChange={setPreviewParams}
                      onGenerate={handleGeneratePreview}
                      onSave={handleSaveWorld}
                      isGenerating={isGenerating}
                      hasPreview={hasPreview}
                      showSaveButton={true}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Center Panel - Preview */}
                <ResizablePanel defaultSize={80}>
                  <WorldGenPreview
                    biomeGrid={biomeGrid}
                    biomeGrid3D={biomeGrid3D}
                    structures={structures}
                    seed={previewSeed}
                    params={previewParams}
                    chunkGenerator={chunkGenerator}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        ) : !selectedWorld ? (
          /* World List */
          <div className="container mx-auto p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Your Worlds</h2>
            {worlds.length === 0 ? (
              <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
                <CardContent className="p-12 text-center">
                  <p className="text-lg text-shadow-300">No worlds created yet</p>
                  <p className="mt-2 text-sm text-shadow-400">Create your first procedural world to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {worlds.map((world) => (
                  <Card
                    key={world.id}
                    className="group border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 transition-all duration-200 hover:border-accent/50 hover:shadow-[0_12px_30px_rgba(122,73,217,0.25)]"
                  >
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-white">{world.name}</h3>
                      <div className="mb-3 space-y-1 text-xs text-shadow-400">
                        <div>
                          Size: {world.width}x{world.height}
                        </div>
                        <div>Seed: {world.seed}</div>
                        <div>Created: {new Date(world.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedWorld(world.id)}
                          className="flex-1 bg-accent/20 text-accent hover:bg-accent/30"
                          size="sm"
                        >
                          View Map
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(world.id)}
                          variant="ghost"
                          size="sm"
                          className="text-shadow-300 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* World Viewer */
          <div className="h-full flex flex-col">
            {/* World Header */}
            <div className="border-b border-shadow-800/70 bg-midnight-900/50 p-4">
              <div className="container mx-auto flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedWorldData?.name}</h2>
                  <p className="text-sm text-shadow-400">
                    {selectedWorldData?.width}x{selectedWorldData?.height} • Seed: {selectedWorldData?.seed}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPlacement(!showPlacement)}
                    variant="default"
                    size="sm"
                    className="bg-accent/20 text-accent hover:bg-accent/30"
                  >
                    {showPlacement ? 'Hide' : 'Place'} Assets
                  </Button>
                  <Button
                    onClick={() => setSelectedWorld(null)}
                    variant="ghost"
                    size="sm"
                    className="text-shadow-300 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                  </Button>
                </div>
              </div>
            </div>

            {/* Map Viewer with TerrainExplorer */}
            <div className="flex-1 overflow-hidden">
              <ResizablePanelGroup direction="horizontal">
                {/* Map Panel */}
                <ResizablePanel defaultSize={100}>
                  <div className="h-full w-full bg-midnight-950 p-4">
                    <TerrainExplorer
                      biomeGrid={
                        selectedWorldBiomeGrid.length > 0
                          ? selectedWorldBiomeGrid
                          : [['plains']]
                      }
                      biomeGrid3D={selectedWorldBiomeGrid3D}
                      structures={selectedWorldStructures}
                      roomSize={32}
                      initialZoom={2}
                      enableInfinite
                      roomId={`saved-world-${selectedWorld}`}
                      chunkGenerator={selectedWorldChunkGenerator}
                      placementMap={null}
                    />

                    {showPlacement && (
                      <AssetPlacementOverlay worldId={selectedWorld} onClose={() => setShowPlacement(false)} />
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-900/90 p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <Card
            className="w-full max-w-md border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Delete World?</h3>
              <p className="mb-6 text-sm text-shadow-300">
                This will permanently delete the world and all associated data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="ghost"
                  className="flex-1 text-shadow-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteWorld(deleteConfirm)}
                  className="flex-1 bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PrivateLayout>
  );
}
