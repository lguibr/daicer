/**
 * Character creation screen with D20 character sheet
 */

import React, { useState } from 'react';
import type { Room, Player, Attribute } from '../../types/shared';
import { addCharacter } from '../../services/api';
import { setReady } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { MarkdownMessage } from '../game/MarkdownMessage';

interface CharacterCreationProps {
  room: Room;
  players: Player[];
}

const ATTRIBUTES: Attribute[] = [
  'Strength' as Attribute,
  'Dexterity' as Attribute,
  'Constitution' as Attribute,
  'Intelligence' as Attribute,
  'Wisdom' as Attribute,
  'Charisma' as Attribute,
];

/**
 * Character creation component
 * @param props - Component props
 * @returns Character creation UI
 */
export function CharacterCreation({ room, players }: CharacterCreationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user already has a character
  const userPlayer = players.find((p) => p.userId === user?.uid);
  const hasCharacter = !!userPlayer;

  const [formData, setFormData] = useState({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    alignment: 'True Neutral',
    attributes: {
      Strength: 10,
      Dexterity: 10,
      Constitution: 10,
      Intelligence: 10,
      Wisdom: 10,
      Charisma: 10,
    },
  });

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAttribute = (attr: Attribute, value: number) => {
    setFormData((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const armorClass = 10 + Math.floor((formData.attributes.Dexterity - 10) / 2);

      await addCharacter(room.id, {
        ...formData,
        armorClass,
      });

      // Character created successfully
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-aurora-300 mb-2">The Stage Is Set</h1>
          <p className="text-shadow-300">Prepare your character for the journey ahead</p>
        </div>

        {/* World Description */}
        <div className="p-6 card mb-8">
          <h2 className="text-xl font-bold text-aurora-300 mb-3">World</h2>
          <div className="text-shadow-200 leading-relaxed prose-invert max-w-none">
            {room.worldDescription ? (
              <MarkdownMessage content={room.worldDescription} />
            ) : (
              <p className="italic text-shadow-400">Generating world description...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Character Creation Form */}
          <div>
            <h2 className="text-2xl font-bold text-aurora-300 mb-4">
              {hasCharacter ? 'Your Character' : 'Create Your Character'}
            </h2>

            {hasCharacter ? (
              <div className="p-6 card space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-shadow-50 mb-2">{userPlayer?.character.name}</h3>
                  <p className="text-shadow-200 mb-2">
                    {userPlayer?.character.race} {userPlayer?.character.characterClass}
                  </p>
                  <p className="text-shadow-400 text-xs">{userPlayer?.character.alignment}</p>
                </div>

                {userPlayer?.isReady ? (
                  <div>
                    <p className="text-aurora-200 font-semibold">✓ You are ready!</p>
                    <p className="text-shadow-400 text-sm mt-1">Waiting for other players...</p>
                    <button
                      onClick={() => setReady(room.id, false)}
                      className="mt-3 w-full btn-secondary"
                    >
                      Unready
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReady(room.id, true)}
                    className="w-full px-6 py-3 bg-aurora-500 text-midnight-100 font-bold rounded-lg hover:bg-aurora-400 transition-colors shadow-lg"
                  >
                    Ready Up!
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 card space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">Character Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter name..."
                    className="input-style w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-shadow-300 mb-1">Race</label>
                    <input
                      type="text"
                      value={formData.race}
                      onChange={(e) => updateField('race', e.target.value)}
                      placeholder="e.g., Human, Elf"
                      className="input-style w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-shadow-300 mb-1">Class</label>
                    <input
                      type="text"
                      value={formData.characterClass}
                      onChange={(e) => updateField('characterClass', e.target.value)}
                      placeholder="e.g., Fighter, Wizard"
                      className="input-style w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">Alignment</label>
                  <input
                    type="text"
                    value={formData.alignment}
                    onChange={(e) => updateField('alignment', e.target.value)}
                    placeholder="e.g., Lawful Good, Chaotic Neutral"
                    className="input-style w-full"
                  />
                </div>

                {/* Attributes */}
                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-2">Attributes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ATTRIBUTES.map((attr) => {
                      const score = formData.attributes[attr];
                      const modifier = Math.floor((score - 10) / 2);
                      return (
                        <div key={attr} className="bg-midnight-500/60 p-3 rounded-lg border border-midnight-600/60">
                          <label className="block text-xs text-shadow-400 mb-1">
                            {attr.slice(0, 3).toUpperCase()}
                          </label>
                          <input
                            type="number"
                            value={score}
                            onChange={(e) => updateAttribute(attr, parseInt(e.target.value, 10) || 10)}
                            min="1"
                            max="30"
                            className="w-full bg-midnight-600 text-shadow-50 px-2 py-1 rounded text-center font-bold focus:outline-none focus:ring-2 focus:ring-aurora-400"
                          />
                          <p className="text-xs text-center text-shadow-400 mt-1">
                            {modifier >= 0 ? '+' : ''}
                            {modifier}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Creating...' : 'Create Character'}
                </button>
              </form>
            )}
          </div>

          {/* Player List */}
          <div>
            <h2 className="text-2xl font-bold text-aurora-300 mb-4">Adventuring Party</h2>
            <div className="space-y-3">
              {players.length === 0 && (
                <p className="text-shadow-400 text-center p-8">Waiting for players to create characters...</p>
              )}
              {players.map((player) => (
                <div key={player.id} className="p-4 card border border-midnight-600/60">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-shadow-50">{player.character.name}</h3>
                    {player.isReady && <span className="text-aurora-200 text-sm font-semibold">✓ Ready</span>}
                  </div>
                  <p className="text-shadow-200 text-sm">
                    {player.character.race} {player.character.characterClass}
                  </p>
                  <p className="text-shadow-400 text-xs">{player.character.alignment}</p>
                </div>
              ))}
            </div>

            {hasCharacter && (
              <div className="mt-6 p-4 bg-aurora-500/10 border border-aurora-400/40 rounded-lg">
                <p className="text-aurora-200 text-sm font-semibold">
                  {players.filter((p) => p.isReady).length} / {room.settings?.playerCount || players.length} players ready
                </p>
                <p className="text-shadow-400 text-xs mt-1">Game starts when all players are ready</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

