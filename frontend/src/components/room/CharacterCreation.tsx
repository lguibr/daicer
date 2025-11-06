/**
 * Character creation screen with D20 character sheet
 */

import React, { useState } from 'react';
import type { Room, Player, Attribute } from '../../types/shared';
import { addCharacter } from '../../services/api';
import { setReady } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';

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
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Room Code */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">The Stage Is Set</h1>
            <p className="text-slate-400">Room Code: <span className="font-mono text-cyan-500 text-xl">{room.code}</span></p>
          </div>
        </div>

        {/* World Description */}
        <div className="p-6 bg-slate-800 rounded-lg mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">World</h2>
          <p className="text-slate-300 italic leading-relaxed">{room.worldDescription || 'Generating...'}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Character Creation Form */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              {hasCharacter ? 'Your Character' : 'Create Your Character'}
            </h2>

            {hasCharacter ? (
              <div className="p-6 bg-slate-800 rounded-lg space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{userPlayer?.character.name}</h3>
                  <p className="text-slate-300 mb-2">
                    {userPlayer?.character.race} {userPlayer?.character.characterClass}
                  </p>
                  <p className="text-slate-400 text-xs">{userPlayer?.character.alignment}</p>
                </div>

                {userPlayer?.isReady ? (
                  <div>
                    <p className="text-green-400 font-semibold">✓ You are ready!</p>
                    <p className="text-slate-400 text-sm mt-1">Waiting for other players...</p>
                    <button
                      onClick={() => setReady(room.id, false)}
                      className="mt-3 w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Unready
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReady(room.id, true)}
                    className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ready Up!
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 bg-slate-800 rounded-lg space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Character Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Race</label>
                    <input
                      type="text"
                      value={formData.race}
                      onChange={(e) => updateField('race', e.target.value)}
                      placeholder="e.g., Human, Elf"
                      className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Class</label>
                    <input
                      type="text"
                      value={formData.characterClass}
                      onChange={(e) => updateField('characterClass', e.target.value)}
                      placeholder="e.g., Fighter, Wizard"
                      className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Alignment</label>
                  <input
                    type="text"
                    value={formData.alignment}
                    onChange={(e) => updateField('alignment', e.target.value)}
                    placeholder="e.g., Lawful Good, Chaotic Neutral"
                    className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Attributes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Attributes</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ATTRIBUTES.map((attr) => {
                      const score = formData.attributes[attr];
                      const modifier = Math.floor((score - 10) / 2);
                      return (
                        <div key={attr} className="bg-slate-700 p-3 rounded-lg">
                          <label className="block text-xs text-slate-400 mb-1">
                            {attr.slice(0, 3).toUpperCase()}
                          </label>
                          <input
                            type="number"
                            value={score}
                            onChange={(e) => updateAttribute(attr, parseInt(e.target.value, 10) || 10)}
                            min="1"
                            max="30"
                            className="w-full bg-slate-600 text-white px-2 py-1 rounded text-center font-bold"
                          />
                          <p className="text-xs text-center text-slate-400 mt-1">
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
                  className="w-full px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-md hover:bg-cyan-700 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Character'}
                </button>
              </form>
            )}
          </div>

          {/* Player List */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Adventuring Party</h2>
            <div className="space-y-3">
              {players.length === 0 && (
                <p className="text-slate-400 text-center p-8">Waiting for players to create characters...</p>
              )}
              {players.map((player) => (
                <div key={player.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-white">{player.character.name}</h3>
                    {player.isReady && <span className="text-green-400 text-sm font-semibold">✓ Ready</span>}
                  </div>
                  <p className="text-slate-300 text-sm">
                    {player.character.race} {player.character.characterClass}
                  </p>
                  <p className="text-slate-400 text-xs">{player.character.alignment}</p>
                </div>
              ))}
            </div>

            {hasCharacter && (
              <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-500/50 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  {players.filter((p) => p.isReady).length} / {room.settings?.playerCount || players.length} players ready
                </p>
                <p className="text-slate-400 text-xs mt-1">Game starts when all players are ready</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

