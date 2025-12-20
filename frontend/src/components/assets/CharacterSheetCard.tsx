import { Card } from '@/components/ui/card';
import type { CharacterSheet } from '@daicer/shared';

interface CharacterSheetCardProps {
  character: CharacterSheet;
  onClick: () => void;
  className?: string;
}

export function CharacterSheetCard({ character, onClick, className = '' }: CharacterSheetCardProps) {
  const avatarUrl = character.avatarAssets?.publicUrl || '/default-avatar.png';

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-parchment-dark/30 dark:border-obsidian-light/30 hover:border-gilded-gold ${className}`}
      onClick={onClick}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Avatar */}
        <div className="flex justify-center">
          <img
            src={avatarUrl}
            alt={character.name || 'Character'}
            className="w-24 h-24 rounded-full object-cover border-4 border-gilded-gold shadow-lg"
          />
        </div>

        {/* Character Info */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-serif font-bold text-ink-primary dark:text-parchment-light">
            {character.name || 'Unnamed Character'}
          </h3>
          <p className="text-sm text-ink-secondary dark:text-parchment-medium">
            Level {character.level} {character.race} {character.characterClass}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
            <div className="font-semibold text-ink-primary dark:text-parchment-light">HP</div>
            <div className="text-ink-secondary dark:text-parchment-medium">
              {character.hp}/{character.maxHp}
            </div>
          </div>
          <div className="p-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
            <div className="font-semibold text-ink-primary dark:text-parchment-light">AC</div>
            <div className="text-ink-secondary dark:text-parchment-medium">{character.armorClass || 10}</div>
          </div>
          <div className="p-2 bg-parchment-medium/20 dark:bg-obsidian-light/20 rounded">
            <div className="font-semibold text-ink-primary dark:text-parchment-light">Prof</div>
            <div className="text-ink-secondary dark:text-parchment-medium">+{character.proficiencyBonus}</div>
          </div>
        </div>

        {/* Background */}
        {character.background && (
          <div className="text-center text-xs text-ink-tertiary dark:text-parchment-dark italic">
            {character.background}
          </div>
        )}
      </div>
    </Card>
  );
}
