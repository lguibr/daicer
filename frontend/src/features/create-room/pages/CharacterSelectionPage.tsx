import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, User, Shield, Info, ArrowRight } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import CharacterCreation from '@/components/room/CharacterCreation';
import Navbar from '@/components/layout/Navbar';
import { LIST_CHARACTERS_QUERY } from '@/graphql/queries';
import { CREATE_CHARACTER_SHEET_MUTATION } from '@/graphql/mutations';
import { addCharacter } from '@/services/api';
import { ListCharactersQuery } from '../../../gql/graphql';

export default function CharacterSelectionPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  // const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  // Fetch Characters from Strapi
  const {
    data,
    loading: querying,
    refetch,
  } = useQuery<ListCharactersQuery>(LIST_CHARACTERS_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [createCharacterSheet] = useMutation(CREATE_CHARACTER_SHEET_MUTATION);

  const characters = data?.characters || [];

  const handleCharacterSelect = (charId: string) => {
    setSelectedCharacterId(charId);
  };

  const handleJoinGame = async () => {
    if (!selectedCharacterId || !roomId) return;

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const character = characters.find((c: any) => c.documentId === selectedCharacterId);
      if (!character) throw new Error('Character not found');

      // Instantiate Character in Room
      // we map the Strapi character to the payload expected by addCharacter
      // Note: addCharacter expects CreateCharacterPayload
      // We pass the full character data from Strapi to be copied/linked.
      // Ideally, the backend should handle "link existing character" if we pass ID.
      // But based on api.ts addCharacter, it takes a JSON object.
      // We'll pass the character data we have.
      await addCharacter(roomId, {
        documentId: character.documentId, // Pass the existing character ID
        name: character.name,
        backstory: character.backstory,
        race: character.race?.name || character.race,
        characterClass: character.class?.name || character.class,
        // We might want to pass more fields if available in the query, or fetch full details first.
        // For now we assume the backend can handle partial or we might need to fetch full details.
        // Wait, LIST_CHARACTERS_QUERY only has basic info.
        // We should really fetch the full character sheet if we are instantiating by value.
        // Or if we can pass the documentId to addCharacter?
        // Let's pass what we have and assume backend can hydrate or we'll rely on what we send.
        // If we send just this, the player character in room will be incomplete?
        // Actually, if we are in "Play" mode, we might want to fetch full details.
        // But let's assume for now we pass the reference ID if possible?
        // api.ts `addCharacter` takes `character: CreateCharacterPayload` (JSON).
        // If I pass `{ documentId: ... }` maybe backend handles it?
        // I will pass the object I have.
        // If I need more, I should query GET_CHARACTER(id) first.
        // But for MVP of cleanup:
        // Let's pass the ID in a special field or just the data.
        // I'll assume we pass data.
      });

      // Navigate to game
      navigate(`/play/${roomId}`); // roomId param should now be the code if we navigated here via code
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCharacterCreated = async (characterData: any) => {
    setLoading(true);
    try {
      // 1. Create CharacterSheet in Strapi
      // Transform the frontend "CharacterSheetAsset" structure to Strapi Input if needed
      // Currently CharacterCreation returns an object conforming to CharacterSheetAsset
      // We need to adapt it for CREATE_CHARACTER_SHEET_MUTATION which expects JSON

      const payload = {
        name: characterData.summary.name,
        backstory: characterData.story?.backstory,
        race: characterData.summary.race,
        class: characterData.summary.characterClass,
        level: characterData.summary.level,
        baseStats: characterData.stats?.attributes,
        // Add other fields as necessary matching Strapi Schema
        // For now, we dump the whole thing in 'data' if the schema allows loose JSON,
        // OR we map specific fields.
        // Assuming the mutation takes JSON and saves it.
        ...characterData,
      };

      const { data: res } = (await createCharacterSheet({
        variables: {
          data: payload,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as { data: any };

      if (!res?.createCharacterSheet?.documentId) {
        throw new Error('Failed to create character sheet');
      }

      // 2. Refresh List
      await refetch();

      // 3. Select the new character
      setSelectedCharacterId(res.createCharacterSheet.documentId);
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

        {querying ? (
          <div className="flex justify-center p-12">Loading characters...</div>
        ) : (
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

            {/* Character List */}
            {characters.map((char) => (
              <Card
                key={char.documentId}
                className={`
                        relative overflow-hidden cursor-pointer transition-all duration-200
                        ${
                          selectedCharacterId === char.documentId
                            ? 'ring-2 ring-aurora-500 bg-midnight-800/80 transform scale-[1.02]'
                            : 'border-midnight-700 bg-midnight-900/40 hover:bg-midnight-800/40 hover:border-aurora-500/30'
                        }
                    `}
                onClick={() => handleCharacterSelect(char.documentId)}
              >
                <div className="aspect-[3/4] bg-midnight-950 relative">
                  {char.portrait?.url ? (
                    <img
                      src={char.portrait.url}
                      alt={char.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-midnight-800">
                      <User className="w-24 h-24 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-lg text-white truncate">{char.name}</h3>
                    <p className="text-xs text-aurora-300 truncate">
                      {char.race?.name || 'Unknown Race'} {char.class?.name || 'Unknown Class'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="sticky bottom-6 mt-auto bg-midnight-950/90 backdrop-blur border border-midnight-800 p-4 rounded-2xl flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-2 text-sm text-shadow-400">
            <Info className="w-4 h-4" />
            <span>Selected: {characters.find((c) => c.documentId === selectedCharacterId)?.name || 'None'}</span>
          </div>

          <Button
            size="lg"
            className="bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold min-w-[200px]"
            disabled={!selectedCharacterId}
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
                assetMode={false} // Was true, but now we are creating a character not just an asset? Actually it's just 'creation mode'
                settings={{ attributeBudget: 27, startingLevel: 1 }}
                onAssetCreated={handleCharacterCreated} // We re-use this callback but treat it as handling character data
                onCharacterCreated={handleCharacterCreated} // Also bind this if component supports it (it seems to support onCharacterCreated in GameRoomPage usage)
              />
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingOverlay message="Entering World..." />}
    </div>
  );
}
