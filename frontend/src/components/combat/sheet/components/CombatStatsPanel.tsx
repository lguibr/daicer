import type { CombatCharacter } from '../../../../types/combat';
import { SECTION_TITLE_CLASSES } from '../utils';
import { InfoTile } from './SharedComponents';

export function CombatStatsPanel({ character }: { character: CombatCharacter }) {
  return (
    <div className="rounded-2xl border border-shadow-700 bg-shadow-900/70 p-4 space-y-3">
      <h3 className={SECTION_TITLE_CLASSES}>Combat Snapshot</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoTile
          label="Hit Points"
          value={`${character.hp}/${character.maxHp}`}
          hint={character.tempHp > 0 ? `+${character.tempHp} temporary` : undefined}
        />
        <InfoTile label="Armor Class" value={character.armorClass} />
        <InfoTile label="Speed" value={`${character.speed} ft`} hint={`${character.movementRemaining} ft remaining`} />
        <InfoTile label="Reach" value={`${character.reach * 5} ft`} />
        <InfoTile label="Proficiency" value={`+${character.proficiencyBonus}`} />
        {character.deathSaves ? (
          <InfoTile
            label="Death Saves"
            value={`${character.deathSaves.successes} success`}
            hint={`${character.deathSaves.failures} failure`}
          />
        ) : null}
      </div>
    </div>
  );
}
