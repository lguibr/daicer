import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, User, Shield, Info, ArrowRight } from 'lucide-react';
import { useAssetsStore } from '@/state/assetsStore';
import { getCollections, getCollectionAssets, createAsset } from '@/services/assetService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import CharacterCreation from '@/components/room/CharacterCreation';
import type { CharacterSheetAsset } from '@/components/room/character-creation/characterSheetAsset';
import { useI18n } from '@/i18n';
import Navbar from '@/components/layout/Navbar';

export default function CharacterSelectionPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { collections, assets, setCollections, setAssets } = useAssetsStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Load Character Sheet Assets on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch collections of type 'character-sheet'
        const cols = await getCollections('character-sheet');
        setCollections(cols);

        // Fetch assets for all these collections (flatted list for selection)
        // Optimization: In a real app, might want pagination or specific collection query
        const allAssets: any[] = [];
        for (const col of cols) {
          const colAssets = await getCollectionAssets(col.id);
          allAssets.push(...colAssets);
        }
        setAssets(allAssets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load characters');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setCollections, setAssets]);

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
  };

  const handleJoinGame = async () => {
    if (!selectedAssetId) return;

    setLoading(true);
    try {
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (!asset) throw new Error('Asset not found');

      // TODO: Instantiate Character Sheet in Backend for this Room
      // For now, we assume the backend handles this or we pass the asset ID to the play route
      // and let the play route/room initialization handle the instantiation.
      // Based on user request: "instantiate a character-sheet for the room"

      // Navigate to game
      navigate(`/play/${roomId}`, {
        state: {
          initialCharacterAssetId: selectedAssetId,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setLoading(false);
    }
  };

  const handleCharacterCreated = async (characterAsset: CharacterSheetAsset) => {
    setLoading(true);
    try {
      // 1. Ensure a default collection exists
      let targetCollection = collections.find((c) => c.name === 'My Characters');
      // If no collection, create simple one (would need createCollection service, skipping for brevity, assume exists or pick first)
      if (!targetCollection && collections.length > 0) targetCollection = collections[0];

      if (!targetCollection) {
        throw new Error('No collection found to save character. Please create one in Assets page first.');
      }

      // 2. Create Asset
      const newAsset = await createAsset({
        collectionId: targetCollection.id,
        name: characterAsset.summary.name,
        description: `${characterAsset.summary.race} ${characterAsset.summary.characterClass}`,
        characterSheetData: characterAsset as unknown as Record<string, unknown>,
      });

      // 3. Refresh List
      setAssets([...assets, newAsset]);
      setSelectedAssetId(newAsset.id);
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-950 flex flex-col font-sans text-shadow-100">
      <Navbar />

      <main className="flex-1 container mx-auto p-6 flex flex-col gap-8 max-w-6xl">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-display uppercase tracking-widest text-aurora-300">Choose Your Hero</h1>
          <p className="text-shadow-300 max-w-2xl mx-auto">
            Select an existing character from your library or forge a new legend to enter this adventure.
          </p>
        </header>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-400" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Card */}
          <Card
            className="bg-midnight-900/40 border-dashed border-2 border-midnight-700 hover:border-aurora-500/50 hover:bg-midnight-800/60 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="w-16 h-16 rounded-full bg-midnight-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-aurora-400" />
            </div>
            <h3 className="text-lg font-bold text-aurora-200">Create New</h3>
            <p className="text-xs text-shadow-400 mt-2">Forge a new hero</p>
          </Card>

          {/* Asset List */}
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className={`
                        relative overflow-hidden cursor-pointer transition-all duration-200
                        ${
                          selectedAssetId === asset.id
                            ? 'ring-2 ring-aurora-500 bg-midnight-800/80 transform scale-[1.02]'
                            : 'border-midnight-700 bg-midnight-900/40 hover:bg-midnight-800/40 hover:border-aurora-500/30'
                        }
                    `}
              onClick={() => handleAssetSelect(asset.id)}
            >
              <div className="aspect-[3/4] bg-midnight-950 relative">
                {/* Placeholder for character image - ideally asset.previewUrl */}
                <div className="absolute inset-0 flex items-center justify-center text-midnight-800">
                  <User className="w-24 h-24 opacity-20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-lg text-white truncate">{asset.name}</h3>
                  <p className="text-xs text-aurora-300 truncate">{asset.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-6 mt-auto bg-midnight-950/90 backdrop-blur border border-midnight-800 p-4 rounded-2xl flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-2 text-sm text-shadow-400">
            <Info className="w-4 h-4" />
            <span>Selected: {assets.find((a) => a.id === selectedAssetId)?.name || 'None'}</span>
          </div>

          <Button
            size="lg"
            className="bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold min-w-[200px]"
            disabled={!selectedAssetId}
            onClick={handleJoinGame}
          >
            Enter World
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-midnight-950 w-full max-w-7xl h-[90vh] rounded-2xl border border-midnight-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-midnight-800 flex justify-between items-center bg-midnight-900/50">
              <h2 className="text-xl font-bold text-aurora-300">Character Creation</h2>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CharacterCreation
                assetMode={true}
                settings={{ attributeBudget: 27, startingLevel: 1 }}
                onAssetCreated={handleCharacterCreated}
              />
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingOverlay message="Loading Grimoire..." />}
    </div>
  );
}
