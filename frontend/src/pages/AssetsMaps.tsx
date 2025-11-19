/**
 * Maps Page - Procedural World Generation
 * Grid-based layout with resizable panels
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GridTile, GridFeature } from '@daicer/shared';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { PrivateLayout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { WorldParametersForm, type WorldParameters } from '../components/assets/WorldParametersForm';
import { GridMapRenderer } from '../components/world/GridMapRenderer';
import { TileMetadataPanel } from '../components/world/TileMetadataPanel';
// MapTileDetails not currently used in this component
// import { MapTileDetails } from '../components/map/MapTileDetails';
import { FeatureRadiusPanel } from '../components/map/FeatureRadiusPanel';
import { AssetPlacementOverlay } from '../components/assets/AssetPlacementOverlay';
import { WorldHistoryViewer } from '../components/assets/WorldHistoryViewer';
import { useAssetsStore } from '../state/assetsStore';
import { createWorld, getWorlds, deleteWorld } from '../services/assetService';
import { initSocket } from '../services/socket';

export default function AssetsMapsPage() {
  const { worlds, setWorlds, addWorld, removeWorld, isLoading, setLoading, setError } = useAssetsStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showPlacement, setShowPlacement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState(0);

  // Grid interaction state
  const [selectedTile, setSelectedTile] = useState<GridTile | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<GridFeature[]>([]);
  const [radius, setRadius] = useState(10);
  const [viewMode, setViewMode] = useState<'player' | 'dm'>('dm');
  const [_features, _setFeatures] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      position: { x: number; y: number; z: number };
      isVisible: boolean;
      distance?: number;
    }>
  >([]);
  const [worldHistory, _setWorldHistory] = useState<{
    overallSummary: string;
    periods: Array<{
      name: string;
      yearStart: number;
      yearEnd: number;
      description: string;
      keyEvents: string[];
      structures: Array<{ id: string; name: string; type: string; position: { x: number; y: number } }>;
    }>;
  } | null>(null);

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
        createdBy: 'current-user', // TODO: Get from auth
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

  const handleFeatureClick = useCallback((feature: (typeof _features)[0]) => {
    // Center map on feature (convert to GridTile format)
    console.log('[AssetsMaps] Feature clicked:', feature);
    // TODO: Scroll map to feature position
  }, []);

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);

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
            <p className="text-shadow-300 text-sm">Generate worlds with noise-based terrain</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-accent text-white hover:bg-accent/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {showCreateForm ? 'Hide Form' : 'Create World'}
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}

      {/* Create World Form */}
      {showCreateForm && (
        <div className="border-b border-shadow-800/70 bg-midnight-900/50 p-4">
          <div className="container mx-auto">
            <WorldParametersForm onSubmit={handleCreateWorld} loading={isLoading} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!selectedWorld ? (
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
          /* World Viewer with Grid Layout */
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

            {/* Grid Layout: Map + Right Sidebar */}
            <div className="flex-1 overflow-hidden">
              <ResizablePanelGroup direction="horizontal">
                {/* Map Panel */}
                <ResizablePanel defaultSize={75} minSize={50}>
                  <div className="h-full w-full flex flex-col bg-midnight-950 p-4">
                    {/* Z-Layer Control */}
                    <div className="mb-4 flex items-center gap-4 border-b border-shadow-800/50 pb-3">
                      <span className="text-sm text-shadow-400">Z-Layer:</span>
                      <input
                        type="range"
                        min={-6}
                        max={5}
                        value={currentLayer}
                        onChange={(e) => setCurrentLayer(Number(e.target.value))}
                        className="flex-1"
                        data-testid="zlayer-slider-assets"
                      />
                      <span className="text-sm font-mono text-accent">{currentLayer}</span>
                      <span className="text-xs text-shadow-500">
                        {currentLayer < 0 ? '⛏️ Underground' : currentLayer === 0 ? '🌍 Surface' : '☁️ Sky'}
                      </span>
                    </div>

                    {/* Grid Map - Use assetId (world ID) instead of roomId */}
                    <div className="flex-1">
                      <GridMapRenderer
                        assetId={selectedWorld}
                        currentLayer={currentLayer}
                        onTileClick={(tile, features) => {
                          console.log('[AssetsMaps] Tile clicked:', tile, features);
                          setSelectedTile(tile);
                          setSelectedFeatures(features);
                        }}
                      />
                    </div>

                    {showPlacement && (
                      <AssetPlacementOverlay worldId={selectedWorld} onClose={() => setShowPlacement(false)} />
                    )}
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Sidebar Panel */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <div className="h-full flex flex-col gap-4 p-4 bg-midnight-900/90 overflow-y-auto">
                    {/* Tile Details (Grid Format) */}
                    {selectedTile && (
                      <TileMetadataPanel
                        tile={selectedTile}
                        features={selectedFeatures}
                        onClose={() => {
                          setSelectedTile(null);
                          setSelectedFeatures([]);
                        }}
                      />
                    )}

                    {/* Feature Radius Panel */}
                    <FeatureRadiusPanel
                      center={selectedTile ? { x: selectedTile.x, y: selectedTile.y } : null}
                      radius={radius}
                      onRadiusChange={setRadius}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      features={_features}
                      onFeatureClick={handleFeatureClick}
                      isLoading={false}
                    />

                    {/* World History Viewer */}
                    {worldHistory && (
                      <WorldHistoryViewer
                        history={worldHistory}
                        onStructureClick={(structure) => {
                          console.log('[AssetsMaps] Structure clicked:', structure);
                          // TODO: Scroll map to structure position
                        }}
                      />
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
