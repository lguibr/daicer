/**
 * Character Creation Modal
 * Full-screen overlay for creating character before entering room
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface CharacterCreationData {
  name: string;
  race: string;
  characterClass: string;
  alignment: string;
  background: string;
  attributes: Record<string, number>;
}

interface CharacterCreationModalProps {
  onSubmit: (character: CharacterCreationData) => Promise<void>;
  onCancel: () => void;
}

const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk'];
const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
];

export function CharacterCreationModal({ onSubmit, onCancel }: CharacterCreationModalProps) {
  const [name, setName] = useState('');
  const [race, setRace] = useState('Human');
  const [characterClass, setCharacterClass] = useState('Fighter');
  const [alignment, setAlignment] = useState('Neutral Good');
  const [background, setBackground] = useState('');

  const [attributes, setAttributes] = useState({
    Strength: 10,
    Dexterity: 10,
    Constitution: 10,
    Intelligence: 10,
    Wisdom: 10,
    Charisma: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pointsUsed = Object.values(attributes).reduce((sum, val) => sum + Math.max(0, val - 8), 0);
  const pointsRemaining = 27 - pointsUsed;

  const handleAttributeChange = (attr: keyof typeof attributes, value: number) => {
    const newValue = Math.max(8, Math.min(15, value));
    setAttributes((prev) => ({ ...prev, [attr]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Character name is required');
      return;
    }

    if (pointsRemaining < 0) {
      setError(`You are over budget by ${Math.abs(pointsRemaining)} points`);
      return;
    }

    setLoading(true);
    try {
      const character = {
        name: name.trim(),
        race,
        characterClass,
        alignment,
        background: background.trim(),
        attributes,
        armorClass: 10 + Math.floor((attributes.Dexterity - 10) / 2),
      };

      await onSubmit(character);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/95 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-3xl border-accent/30 bg-gradient-to-br from-midnight-900/95 via-midnight-800/95 to-midnight-700/95 max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-[0.3em] text-aurora-300">
                Create Your Character
              </h2>
              <p className="mt-1 text-sm text-shadow-400">Build your hero for the adventure ahead</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-midnight-900/80 p-2 text-shadow-300 transition-colors hover:bg-midnight-800 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="char-name" className="text-shadow-200">
                  Character Name *
                </Label>
                <Input
                  id="char-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Thorin Ironforge"
                  className="mt-1 border-midnight-500 bg-midnight-800/50 text-white"
                  disabled={loading}
                  data-testid="character-name-input"
                />
              </div>

              <div>
                <Label htmlFor="char-race" className="text-shadow-200">
                  Race *
                </Label>
                <Select value={race} onValueChange={setRace} disabled={loading}>
                  <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-midnight-500 bg-midnight-800">
                    {RACES.map((r) => (
                      <SelectItem key={r} value={r} className="text-white">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="char-class" className="text-shadow-200">
                  Class *
                </Label>
                <Select value={characterClass} onValueChange={setCharacterClass} disabled={loading}>
                  <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-midnight-500 bg-midnight-800">
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="char-alignment" className="text-shadow-200">
                  Alignment *
                </Label>
                <Select value={alignment} onValueChange={setAlignment} disabled={loading}>
                  <SelectTrigger className="mt-1 border-midnight-500 bg-midnight-800/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-midnight-500 bg-midnight-800">
                    {ALIGNMENTS.map((a) => (
                      <SelectItem key={a} value={a} className="text-white">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Background */}
            <div>
              <Label htmlFor="char-background" className="text-shadow-200">
                Background (optional)
              </Label>
              <Textarea
                id="char-background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="A brief backstory for your character..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Attributes */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-shadow-200">Attributes (Point-Buy)</Label>
                <span className={`text-sm font-semibold ${pointsRemaining < 0 ? 'text-red-400' : 'text-aurora-300'}`}>
                  {pointsRemaining} / 27 points remaining
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(attributes).map(([attr, value]) => (
                  <div key={attr} className="space-y-1">
                    <Label htmlFor={`attr-${attr}`} className="text-xs text-shadow-400">
                      {attr}
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAttributeChange(attr as keyof typeof attributes, value - 1)}
                        disabled={value <= 8 || loading}
                        className="rounded bg-midnight-700 px-2 py-1 text-white disabled:opacity-30"
                      >
                        -
                      </button>
                      <Input
                        id={`attr-${attr}`}
                        type="number"
                        value={value}
                        readOnly
                        className="w-16 border-midnight-500 bg-midnight-800/50 text-center text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAttributeChange(attr as keyof typeof attributes, value + 1)}
                        disabled={value >= 15 || pointsRemaining <= 0 || loading}
                        className="rounded bg-midnight-700 px-2 py-1 text-white disabled:opacity-30"
                      >
                        +
                      </button>
                      <span className="text-xs text-shadow-500">
                        {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}
                        {Math.floor((value - 10) / 2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onCancel}
                variant="ghost"
                className="flex-1 text-shadow-300 hover:text-white"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent text-white hover:bg-accent/90"
                disabled={loading || pointsRemaining < 0}
                data-testid="character-submit-button"
              >
                {loading ? 'Creating...' : 'Create Character & Enter Room'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
