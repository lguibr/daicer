import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import type { CharacterSheet } from '@daicer/shared/character';
import { CharacterSheetCard } from './CharacterSheetCard';
import { CharacterSheetModal } from './CharacterSheetModal';

interface UserCharacter {
  id: string;
  roomId: string;
  character: CharacterSheet;
  createdAt: number;
}

export function CharacterSheetGrid() {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<UserCharacter | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's characters
  useEffect(() => {
    if (!user?.uid) return;

    const fetchCharacters = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/characters/user/${user.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.statusText}`);
        }

        const data = await response.json();
        setCharacters(data.data || []);
      } catch (err) {
        console.error('Error fetching characters:', err);
        setError(err instanceof Error ? err.message : 'Failed to load characters');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [user]);

  // Delete character
  const handleDelete = async (character: UserCharacter) => {
    if (!user?.uid) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/characters/${character.roomId}/${character.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete character: ${response.statusText}`);
      }

      // Remove from local state
      setCharacters((prev) => prev.filter((c) => c.id !== character.id));
      setSelectedCharacter(null);
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete character');
    }
  };

  const handleCreateNew = () => {
    navigate('/assets/character-sheet/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gilded-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-crimson-red mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-ink-primary dark:text-parchment-light">
          Your Character Sheets
        </h2>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Character
        </Button>
      </div>

      {/* Grid */}
      {characters.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-parchment-dark/30 dark:border-obsidian-light/30 rounded-lg">
          <p className="text-ink-secondary dark:text-parchment-medium mb-4">
            No characters created yet. Start by creating your first character!
          </p>
          <Button onClick={handleCreateNew} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create First Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {characters.map((char) => (
            <CharacterSheetCard key={char.id} character={char.character} onClick={() => setSelectedCharacter(char)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedCharacter && (
        <CharacterSheetModal
          character={selectedCharacter.character}
          isOpen={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onDelete={() => handleDelete(selectedCharacter)}
        />
      )}
    </div>
  );
}
