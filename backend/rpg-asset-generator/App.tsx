import React, { useState, useCallback } from 'react';
import { AvatarCreator } from './components/AvatarCreator';
import { GridGenerator } from './components/GridGenerator';
import { SceneGenerator } from './components/SceneGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs';
import type { FinalAvatarImages, GridData, CellSelection } from './types';

type Tab = 'avatar' | 'grid' | 'scene';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('avatar');

  const [finalAvatars, setFinalAvatars] = useState<FinalAvatarImages | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<CellSelection | null>(null);

  const handleAvatarsGenerated = useCallback((images: FinalAvatarImages) => {
    setFinalAvatars(images);
  }, []);

  const handleGridGenerated = useCallback((grid: GridData) => {
    setGridData(grid);
    setSelectedCell(null);
    setAvatarPosition(null);
  }, []);

  const handleCellSelected = useCallback((selection: CellSelection) => {
    setSelectedCell(selection);
  }, []);

  const handlePlaceAvatar = useCallback((selection: CellSelection) => {
    setAvatarPosition(selection);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-4 md:p-8">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">RPG Asset Generator</h1>
          <p className="text-slate-400 mt-2">Create character avatars, maps, and scene illustrations with AI.</p>
        </header>

        <Tabs>
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger isActive={activeTab === 'avatar'} onClick={() => setActiveTab('avatar')}>
              1. Avatar Creator
            </TabsTrigger>
            <TabsTrigger isActive={activeTab === 'grid'} onClick={() => setActiveTab('grid')}>
              2. Map Generator
            </TabsTrigger>
            <TabsTrigger isActive={activeTab === 'scene'} onClick={() => setActiveTab('scene')}>
              3. Scene Illustrator
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {activeTab === 'avatar' && (
              <TabsContent>
                <AvatarCreator onAvatarsGenerated={handleAvatarsGenerated} />
              </TabsContent>
            )}
            {activeTab === 'grid' && (
              <TabsContent>
                <GridGenerator
                  onGridGenerated={handleGridGenerated}
                  onCellSelected={handleCellSelected}
                  selectedCell={selectedCell}
                  finalAvatarImages={finalAvatars}
                  avatarPosition={avatarPosition}
                  onPlaceAvatar={handlePlaceAvatar}
                />
              </TabsContent>
            )}
            {activeTab === 'scene' && (
              <TabsContent>
                <SceneGenerator finalAvatarImages={finalAvatars} gridData={gridData} selectedCell={selectedCell} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
