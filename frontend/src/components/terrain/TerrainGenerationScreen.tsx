/**
 * Terrain Generation Screen
 * Owner generates and reviews 3D voxel terrain before unlocking character creation
 */

import { useState, useEffect } from 'react';
import { Sparkles, Mountain } from 'lucide-react';
import { auth } from '../../services/firebase';
import { DiceLoader } from '../ui/dice-loader';
import { GenerationTimeline } from '../world/GenerationTimeline';
import { TerrainExplorer } from './TerrainExplorer';
import MarkdownMessage from '../game/MarkdownMessage';
import type { Room } from '../../types/shared';

interface TerrainGenerationScreenProps {
  room: Room;
}

export function TerrainGenerationScreen({ room }: TerrainGenerationScreenProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biomeData, setBiomeData] = useState<any>(null);

  // Load existing terrain data (one-time only)
  useEffect(() => {
    if (room.terrainData?.biomeMapMetadata && !biomeData) {
      // Terrain was already generated - regenerate biome grid from seed (one time only)
      const regenerateBiomeGrid = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const token = await user.getIdToken();
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/terrain/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomId: room.id }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setBiomeData(result.data);
            }
          }
        } catch (err) {
          console.warn('[Terrain] Failed to regenerate biome grid:', err);
        }
      };

      regenerateBiomeGrid();
    }
  }, [room.terrainData, room.id, biomeData]);

  const handleGenerateTerrain = async () => {
    setGenerating(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/terrain/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: room.id }),
      });

      if (!response.ok) {
        throw new Error('Terrain generation failed');
      }

      const result = await response.json();
      if (result.success) {
        setBiomeData(result.data);
      }

      // Socket.IO will update room state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate terrain');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveTerrain = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/terrain/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: room.id }),
      });

      if (!response.ok) {
        throw new Error('Terrain approval failed');
      }

      // Socket.IO will update to CHARACTER_CREATION phase
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve terrain');
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-semibold text-aurora-200 mb-2">
            <Mountain className="inline-block w-6 h-6 mr-2" />
            Terrain Generation
          </h2>
          <p className="text-sm text-shadow-400">
            Generate the actual 3D voxel terrain where your adventure will take place.
          </p>
        </div>

        {/* World Info Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-shadow-500 mb-1">Structures</p>
            <p className="text-2xl font-bold text-aurora-300">{room.structures?.length || 0}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-shadow-500 mb-1">Roads</p>
            <p className="text-2xl font-bold text-aurora-300">{room.roads?.length || 0}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-shadow-500 mb-1">Grid Size</p>
            <p className="text-2xl font-bold text-aurora-300">
              {room.settings?.worldSize === 'intimate'
                ? '256×256'
                : room.settings?.worldSize === 'small'
                  ? '256×256'
                  : room.settings?.worldSize === 'medium'
                    ? '512×512'
                    : room.settings?.worldSize === 'large'
                      ? '1024×1024'
                      : '256×256'}
            </p>
          </div>
        </div>

        {/* Generation Timeline - FULL EVENT LOG */}
        <GenerationTimeline events={room.generationEvents || []} />

        {/* World Description - FULL TEXT */}
        {room.worldDescription && (
          <div className="card p-6">
            <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300 mb-4">
              World Description
            </h3>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-midnight-600 bg-midnight-900/70 p-6 text-sm text-shadow-200">
              <MarkdownMessage content={room.worldDescription} />
            </div>
          </div>
        )}

        {/* Terrain Generation Controls */}
        {!room.terrainData ? (
          <div className="card p-8 text-center space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-aurora-200">Ready to Generate Terrain</h3>
              <p className="text-sm text-shadow-400 max-w-2xl mx-auto">
                This will create the actual 3D voxel grid with biomes, elevation, and playable terrain based on your
                world's structures and roads.
              </p>
            </div>
            {generating ? (
              <div className="space-y-4">
                <DiceLoader size="large" diceCount={5} />
                <p className="text-sm text-shadow-500">Generating terrain...</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateTerrain}
                className="btn-primary"
                data-testid="generate-terrain-button"
              >
                <Mountain className="mr-2 inline-block h-5 w-5" />
                Generate Terrain
              </button>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        ) : (
          <>
            {/* Unified Terrain Explorer (biome grid + layers + controls) */}
            {biomeData?.biomeMap?.grid && (
              <TerrainExplorer
                biomeGrid={biomeData.biomeMap.grid}
                structures={room.structures || []}
                roomSize={32}
                initialZoom={2}
                roomId={room.id}
                enableInfinite
              />
            )}

            {/* Approve Button */}
            <div className="card p-6 text-center">
              <button
                type="button"
                onClick={handleApproveTerrain}
                className="btn-primary"
                data-testid="approve-terrain-button"
              >
                <Sparkles className="mr-2 inline-block h-5 w-5" />
                Approve Terrain & Continue
              </button>
              <p className="text-xs text-shadow-500 mt-3">This will unlock character creation for all players.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
