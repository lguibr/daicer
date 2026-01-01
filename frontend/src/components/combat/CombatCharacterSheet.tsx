import { useEffect } from 'react';
import type { EntitySheet } from '@daicer/engine';
import type { CombatCharacter } from '../../types/combat';
import { CombatSheetHeader } from './sheet/components/CombatSheetHeader';
import { PortraitPanel } from './sheet/components/PortraitPanel';
import { CombatStatsPanel } from './sheet/components/CombatStatsPanel';
import { TurnStatusPanel } from './sheet/components/TurnStatusPanel';
import { AbilityScoreGrid } from './sheet/components/AbilityScoreGrid';
import { SkillsPanel } from './sheet/components/SkillsPanel';
import { SpellcastingPanel } from './sheet/components/SpellcastingPanel';
import { FeaturesPanel } from './sheet/components/FeaturesPanel';
import { InventoryPanel } from './sheet/components/InventoryPanel';
import { AppearancePanel } from './sheet/components/AppearancePanel';
import { BackgroundPanel } from './sheet/components/BackgroundPanel';

interface CombatCharacterSheetProps {
  character: CombatCharacter;
  characterSheet?: EntitySheet | null;
  onClose: () => void;
}

export function CombatCharacterSheet({ character, characterSheet, onClose }: CombatCharacterSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div aria-hidden="true" className="absolute inset-0 bg-midnight-950/85 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-shadow-700 bg-midnight-200/95 shadow-2xl"
      >
        <CombatSheetHeader character={character} characterSheet={characterSheet} onClose={onClose} />

        <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
          <section className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]">
            <PortraitPanel character={character} characterSheet={characterSheet} />
            <div className="grid gap-4">
              <CombatStatsPanel character={character} />
              <TurnStatusPanel character={character} />
            </div>
          </section>

          <AbilityScoreGrid character={character} />

          <section className="grid gap-4 xl:grid-cols-2">
            <SkillsPanel characterSheet={characterSheet} />
            <SpellcastingPanel characterSheet={characterSheet} />
          </section>

          <FeaturesPanel characterSheet={characterSheet} />

          <section className="grid gap-4 xl:grid-cols-2">
            <InventoryPanel characterSheet={characterSheet} />
            <AppearancePanel characterSheet={characterSheet} />
          </section>

          <BackgroundPanel characterSheet={characterSheet} />
        </div>
      </div>
    </div>
  );
}
