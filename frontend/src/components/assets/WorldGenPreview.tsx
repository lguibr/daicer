/**
 * WorldGenPreview Component
 * Combines TerrainExplorer with visualization tabs for world generation preview
 */

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TerrainExplorer } from '@/components/terrain/TerrainExplorer';
import { NoiseVisualizer } from '@/components/world-gen-debug/NoiseVisualizer';
import { CAVisualizer } from '@/components/world-gen-debug/CAVisualizer';
import { BSPVisualizer } from '@/components/world-gen-debug/BSPVisualizer';
import { VoronoiVisualizer } from '@/components/world-gen-debug/VoronoiVisualizer';
import { WFCVisualizer } from '@/components/world-gen-debug/WFCVisualizer';
import { StructureVisualizer } from '@/components/world-gen-debug/StructureVisualizer';
import type { GenerationParams } from '@/hooks/useWorldGeneration';

interface WorldGenPreviewProps {
    biomeGrid: string[][];
    biomeGrid3D: string[][][];
    structures: any[];
    seed: string;
    params: GenerationParams;
    chunkGenerator: {
        generateChunk: (worldX: number, worldY: number, width: number, height: number) => string[][];
        generateChunk3D: (worldX: number, worldY: number, width: number, height: number) => string[][][];
    };
}

export function WorldGenPreview({
    biomeGrid,
    biomeGrid3D,
    structures,
    seed,
    params,
    chunkGenerator,
}: WorldGenPreviewProps) {
    const [activeTab, setActiveTab] = useState('explorer');

    return (
        <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-8 bg-midnight-800/50">
                    <TabsTrigger value="explorer">Explorer</TabsTrigger>
                    <TabsTrigger value="structures">Structures</TabsTrigger>
                    <TabsTrigger value="noise">Noise</TabsTrigger>
                    <TabsTrigger value="ca">Caves (CA)</TabsTrigger>
                    <TabsTrigger value="bsp">BSP</TabsTrigger>
                    <TabsTrigger value="voronoi">Voronoi</TabsTrigger>
                    <TabsTrigger value="wfc">WFC</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="explorer" className="h-full m-0 p-4">
                        {biomeGrid.length > 0 ? (
                            <TerrainExplorer
                                biomeGrid={biomeGrid}
                                biomeGrid3D={biomeGrid3D}
                                structures={structures}
                                roomSize={32}
                                initialZoom={2}
                                enableInfinite
                                roomId={`preview-${seed}`}
                                chunkGenerator={chunkGenerator}
                                placementMap={null}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-shadow-500">Generate a preview to explore the world</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="structures" className="h-full m-0">
                        <StructureVisualizer />
                    </TabsContent>

                    <TabsContent value="noise" className="h-full m-0">
                        <NoiseVisualizer />
                    </TabsContent>

                    <TabsContent value="ca" className="h-full m-0">
                        <CAVisualizer />
                    </TabsContent>

                    <TabsContent value="bsp" className="h-full m-0">
                        <BSPVisualizer />
                    </TabsContent>

                    <TabsContent value="voronoi" className="h-full m-0">
                        <VoronoiVisualizer />
                    </TabsContent>

                    <TabsContent value="wfc" className="h-full m-0">
                        <WFCVisualizer />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
