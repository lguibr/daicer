import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CharacterSheet } from '@daicer/shared/character';

interface CharacterSheetModalProps {
  character: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function CharacterSheetModal({ character, isOpen, onClose, onDelete }: CharacterSheetModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-parchment-light dark:bg-obsidian-dark">
        {/* Header */}
        <div className="sticky top-0 bg-parchment-light dark:bg-obsidian-dark border-b border-parchment-dark/30 dark:border-obsidian-light/30 p-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-serif font-bold text-ink-primary dark:text-parchment-light">
            {character.name || 'Character Sheet'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Level</div>
              <p className="text-lg text-ink-primary dark:text-parchment-light">{character.level}</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Race</div>
              <p className="text-lg text-ink-primary dark:text-parchment-light">{character.race}</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Class</div>
              <p className="text-lg text-ink-primary dark:text-parchment-light">{character.characterClass}</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Background</div>
              <p className="text-lg text-ink-primary dark:text-parchment-light">{character.background}</p>
            </div>
          </div>

          {/* Ability Scores */}
          <div>
            <h3 className="text-lg font-serif font-bold text-ink-primary dark:text-parchment-light mb-3">
              Ability Scores
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(character.attributes).map(([ability, score]) => (
                <div key={ability} className="p-3 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded text-center">
                  <div className="text-xs font-semibold text-ink-secondary dark:text-parchment-medium uppercase">
                    {ability}
                  </div>
                  <div className="text-2xl font-bold text-ink-primary dark:text-parchment-light">{score}</div>
                  <div className="text-xs text-ink-tertiary dark:text-parchment-dark">
                    {score >= 10 ? '+' : ''}
                    {Math.floor((score - 10) / 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combat Stats */}
          <div>
            <h3 className="text-lg font-serif font-bold text-ink-primary dark:text-parchment-light mb-3">
              Combat Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
                <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Hit Points</div>
                <div className="text-xl font-bold text-ink-primary dark:text-parchment-light">
                  {character.hp}/{character.maxHp}
                </div>
              </div>
              <div className="p-3 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
                <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Armor Class</div>
                <div className="text-xl font-bold text-ink-primary dark:text-parchment-light">
                  {character.armorClass || 10}
                </div>
              </div>
              <div className="p-3 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
                <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Initiative</div>
                <div className="text-xl font-bold text-ink-primary dark:text-parchment-light">
                  +{character.initiative || 0}
                </div>
              </div>
              <div className="p-3 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
                <div className="text-sm font-semibold text-ink-secondary dark:text-parchment-medium">Speed</div>
                <div className="text-xl font-bold text-ink-primary dark:text-parchment-light">{character.speed} ft</div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {character.skills && Object.keys(character.skills).length > 0 && (
            <div>
              <h3 className="text-lg font-serif font-bold text-ink-primary dark:text-parchment-light mb-3">Skills</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(character.skills).map(([skill, modifier]) => (
                  <div
                    key={skill}
                    className="px-3 py-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded text-sm text-ink-primary dark:text-parchment-light"
                  >
                    {skill} {modifier >= 0 ? '+' : ''}
                    {modifier}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {character.equipment && character.equipment.trim().length > 0 && (
            <div>
              <h3 className="text-lg font-serif font-bold text-ink-primary dark:text-parchment-light mb-3">
                Equipment
              </h3>
              <div className="px-3 py-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded text-sm text-ink-primary dark:text-parchment-light whitespace-pre-wrap">
                {character.equipment}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-parchment-light dark:bg-obsidian-dark border-t border-parchment-dark/30 dark:border-obsidian-light/30 p-4 flex items-center justify-between">
          <div>
            {showDeleteConfirm && (
              <p className="text-sm text-crimson-red font-semibold">Click delete again to confirm</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-crimson-red hover:bg-crimson-red/80">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
