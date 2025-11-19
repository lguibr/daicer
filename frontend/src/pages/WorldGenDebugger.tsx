/**
 * World Generation Debugger
 * Comprehensive visualization and testing tool for all procedural generation algorithms
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoiseVisualizer } from '@/components/world-gen-debug/NoiseVisualizer';
import { CAVisualizer } from '@/components/world-gen-debug/CAVisualizer';
import { BSPVisualizer } from '@/components/world-gen-debug/BSPVisualizer';
import { VoronoiVisualizer } from '@/components/world-gen-debug/VoronoiVisualizer';
import { WFCVisualizer } from '@/components/world-gen-debug/WFCVisualizer';
import { CompleteMapVisualizer } from '@/components/world-gen-debug/CompleteMapVisualizer';
import { StructureVisualizer } from '@/components/world-gen-debug/StructureVisualizer';

export default function WorldGenDebugger() {
  const [activeTab, setActiveTab] = useState('complete');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">World Generation Toolkit Debugger</h1>
          <p className="text-muted-foreground mt-2">Visualize and test procedural generation algorithms</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="complete">Complete Map</TabsTrigger>
            <TabsTrigger value="structures">Structures</TabsTrigger>
            <TabsTrigger value="noise">Noise</TabsTrigger>
            <TabsTrigger value="ca">Caves (CA)</TabsTrigger>
            <TabsTrigger value="bsp">BSP</TabsTrigger>
            <TabsTrigger value="voronoi">Voronoi</TabsTrigger>
            <TabsTrigger value="wfc">WFC</TabsTrigger>
          </TabsList>

          <TabsContent value="complete" className="mt-4">
            <CompleteMapVisualizer />
          </TabsContent>

          <TabsContent value="structures" className="mt-4">
            <StructureVisualizer />
          </TabsContent>

          <TabsContent value="noise" className="mt-4">
            <NoiseVisualizer />
          </TabsContent>

          <TabsContent value="ca" className="mt-4">
            <CAVisualizer />
          </TabsContent>

          <TabsContent value="bsp" className="mt-4">
            <BSPVisualizer />
          </TabsContent>

          <TabsContent value="voronoi" className="mt-4">
            <VoronoiVisualizer />
          </TabsContent>

          <TabsContent value="wfc" className="mt-4">
            <WFCVisualizer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
