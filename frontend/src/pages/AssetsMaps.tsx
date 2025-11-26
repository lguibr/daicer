import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Map, Plus, Trash2, Globe, Search } from 'lucide-react';
import { useAssetsStore } from '@/state/assetsStore';
import { WorldGenerator } from '@/components/terrain/WorldGenerator';
import { TerrainExplorer } from '@/components/terrain/TerrainExplorer';
import { useWorldGeneration, type GenerationParams } from '@/hooks/useWorldGeneration';
import { GridTile } from '../../../shared/world';
import { PrivateLayout } from '@/components/layout';

export default function AssetsMapsPage() {
  const { worlds, addWorld, removeWorld } = useAssetsStore();
  const [activeTab, setActiveTab] = useState('new');
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [worldName, setWorldName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // We only need useWorldGeneration here for the saved world chunk generator
  // The new world generation is handled by WorldGenerator component
  const { createChunkGenerator } = useWorldGeneration();

  const handleSaveWorld = async (seed: string, params: GenerationParams) => {
    if (!worldName.trim()) return;

    await addWorld({
      id: crypto.randomUUID(), // Generate ID locally for now or let backend handle it
      name: worldName,
      seed,
      width: 128,
      height: 128,
      params: params as any,
      createdAt: new Date(),
      createdBy: 'local',
    });

    setWorldName('');
    setActiveTab('saved');
  };

  const handleDeleteWorld = async (id: string) => {
    await removeWorld(id);
    if (selectedWorld === id) {
      setSelectedWorld(null);
    }
    setDeleteConfirm(null);
  };

  const filteredWorlds = worlds.filter((w) => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);

  // Chunk generator for saved worlds
  const selectedWorldChunkGenerator = useMemo(() => {
    if (!selectedWorldData) {
      return {
        generateChunk: (worldX: number, worldY: number, width: number, height: number) => 
          Array(height).fill(0).map(() => 
            Array(width).fill({
              x: 0, y: 0, z: 0, biome: 'plains', blockType: 'grass'
            } as GridTile)
          ),
        generateChunk3D: (worldX: number, worldY: number, width: number, height: number) => 
          Array(1).fill(0).map(() => 
            Array(height).fill(0).map(() => 
              Array(width).fill({
                x: 0, y: 0, z: 0, biome: 'plains', blockType: 'grass'
              } as GridTile)
            )
          ),
      };
    }

    const generator = createChunkGenerator(selectedWorldData.seed, selectedWorldData.params as unknown as GenerationParams);
    return {
      generateChunk: (worldX: number, worldY: number, width: number, height: number): GridTile[][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        const surfaceGrid = chunk3D[3] || Array(height).fill(0).map(() => Array(width).fill('plains'));
        
        return surfaceGrid.map((row, y) => 
          row.map((biome, x) => ({
            x: worldX + x,
            y: worldY + y,
            z: 0,
            biome,
            blockType: 'grass'
          } as GridTile))
        );
      },
      generateChunk3D: (worldX: number, worldY: number, width: number, height: number): GridTile[][][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        return chunk3D.map((floorGrid, z) => 
          floorGrid.map((row, y) => 
            row.map((biome, x) => ({
              x: worldX + x,
              y: worldY + y,
              z: z - 3,
              biome,
              blockType: 'grass'
            } as GridTile))
          )
        );
      },
    };
  }, [createChunkGenerator, selectedWorldData]);

  return (
    <PrivateLayout showNavbar>
      <div className="container mx-auto py-6 space-y-6 h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-aurora-300">Maps & Terrain</h1>
            <p className="text-muted-foreground">Generate and manage procedural worlds</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Sidebar */}
          <Card className="col-span-3 h-full flex flex-col bg-midnight-900/70 border-accent/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Globe className="w-4 h-4" />
                Saved Worlds
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search worlds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-midnight-800/50 border-midnight-500 text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  <Button
                    variant={activeTab === 'new' ? 'secondary' : 'ghost'}
                    className="w-full justify-start bg-accent/20 text-accent hover:bg-accent/30"
                    onClick={() => {
                      setActiveTab('new');
                      setSelectedWorld(null);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New World
                  </Button>
                  
                  {filteredWorlds.map((world) => (
                    <div
                      key={world.id}
                      className={`group flex items-center justify-between p-2 rounded-md hover:bg-midnight-800/50 cursor-pointer ${
                        selectedWorld === world.id ? 'bg-midnight-800/70' : ''
                      }`}
                      onClick={() => {
                        setSelectedWorld(world.id);
                        setActiveTab('saved');
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Map className="w-4 h-4 flex-shrink-0 text-shadow-300" />
                        <span className="truncate text-sm font-medium text-white">{world.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-shadow-300 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(world.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="col-span-9 h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start border-b border-shadow-800/70 rounded-none bg-midnight-950/90 p-0">
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:bg-midnight-900/70 data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-shadow-300 hover:text-white"
                >
                  New World
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="data-[state=active]:bg-midnight-900/70 data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-shadow-300 hover:text-white"
                  disabled={!selectedWorld}
                >
                  Saved World View
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 mt-4">
                <TabsContent value="new" className="h-full m-0 space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <Label className="text-shadow-200">World Name</Label>
                      <Input 
                        value={worldName} 
                        onChange={(e) => setWorldName(e.target.value)} 
                        placeholder="My New World"
                        className="bg-midnight-800/50 border-midnight-500 text-white"
                      />
                    </div>
                  </div>

                  <WorldGenerator 
                    onSave={handleSaveWorld}
                    className="h-full"
                  />
                </TabsContent>

                <TabsContent value="saved" className="h-full m-0">
                  {selectedWorldData ? (
                    <Card className="h-full flex flex-col bg-midnight-900/70 border-accent/30">
                      <CardHeader className="border-b border-shadow-800/70">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-white">{selectedWorldData.name}</CardTitle>
                          <div className="text-sm text-shadow-400">
                            Seed: {selectedWorldData.seed}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 relative overflow-hidden">
                        <div className="absolute inset-0">
                          <TerrainExplorer
                            biomeGrid={[]} // Infinite loader handles this
                            biomeGrid3D={[]}
                            structures={[]} // TODO: Load structures if saved
                            roomSize={32}
                            enableInfinite
                            roomId={`saved-${selectedWorldData.id}`}
                            chunkGenerator={selectedWorldChunkGenerator}
                            placementMap={null}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a world to view
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
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
      </div>
    </PrivateLayout>
  );
}
