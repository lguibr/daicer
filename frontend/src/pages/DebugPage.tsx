import { useState } from 'react';
// import { Loader2 } from 'lucide-react'; // Loader2 was used in the pending state overlay I removed? No I removed the overlay logic? Let me check line 121 in view.
// Wait, I didn't remove the overlay logic in JSX, just the isCreating state set calls.
// If I remove isCreating state, I need to remove the overlay JSX too.
// Let's remove lines 121-128 in the file as well.
import Navbar from '../components/layout/Navbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { Button } from '../components/ui/button';

import { RoomSelection } from '../features/debug/components/RoomSelection';
import { GameDebugView } from '../features/debug/components/GameDebugView';
import { WorldConfigForm } from '../features/debug/components/WorldConfigForm';

import type { WorldConfig } from '../features/debug/utils/types';

type Stage = 'selection' | 'dm-setup' | 'world' | 'debug';

export default function DebugPage() {
  const [stage, setStage] = useState<Stage>('selection');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // World Config State for the 'world' stage
  const [worldConfig, setWorldConfig] = useState<WorldConfig>({
    seed: `new-campaign-${Math.random().toString(36).substring(7)}`,
    chunkSize: 32,
    globalScale: 0.01,
    seaLevel: 0,
    elevationScale: 1,
    roughness: 0.5,
    detail: 4,
    moistureScale: 1,
    temperatureOffset: 0,
    structureChance: 0.1,
    structureSpacing: 10,
    structureSizeAvg: 10,
    roadDensity: 0.5,
    fogRadius: 10,
  });

  // Handlers
  const handleRoomSelect = (roomId: string) => {
    setActiveRoomId(roomId);
    setStage('debug'); // Jump straight to debug for existing rooms
  };

  const handleLaunchGame = async () => {
    // Here we would save the world config to the room via mutation
    // For now, we just proceed to debug view which uses the config locally or re-seeds
    setStage('debug');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-midnight-950 text-shadow-100 font-sans">
      <Navbar />

      <div className="flex px-6 py-2 border-b border-midnight-800 bg-midnight-900/50 backdrop-blur">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setStage('selection');
                }}
              >
                Debug
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {stage === 'selection' && 'Lobby'}
                {stage === 'dm-setup' && 'Campaign Setup'}
                {stage === 'world' && 'World Generation'}
                {stage === 'debug' && 'Engine Debugger'}
              </BreadcrumbPage>
            </BreadcrumbItem>
            {activeRoomId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-mono text-xs text-muted-foreground">
                    {activeRoomId.slice(0, 8)}...
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {stage === 'selection' && (
          <div className="h-full overflow-y-auto p-6">
            <RoomSelection
              onSelect={handleRoomSelect}
              onCreate={() => {
                // Redirect to unified wizard with debug target
                window.location.href = '/create?target=debug';
              }}
            />
          </div>
        )}

        {stage === 'world' && (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-aurora-500 tracking-tighter">INITIALIZE WORLD</h1>
              <p className="text-muted-foreground">Configure the physical terrain and biomes</p>
            </div>

            <div className="w-full max-w-md bg-midnight-900 border border-midnight-800 rounded-xl p-6 shadow-2xl">
              <WorldConfigForm
                config={worldConfig}
                onConfigChange={setWorldConfig}
                isActive
                onRegenerate={() => {}} // No-op in this preview view
              />

              <div className="mt-8">
                <Button
                  onClick={handleLaunchGame}
                  className="w-full bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold py-3 text-lg"
                >
                  Launch Simulation
                </Button>
              </div>
            </div>
          </div>
        )}

        {stage === 'debug' && activeRoomId && <GameDebugView roomId={activeRoomId} />}
      </div>
    </div>
  );
}
