// import type { CombatDemoSpellScript } from 'daicer/backend/src/shared/spellLoadouts';
import type { CombatCharacter } from '../../types/combat';
import type { SpellData, SpellPreviewSnapshot, SpellResolutionSnapshot } from '../../types/spells';

export interface CombatDemoSpellScript {
  spellId: string;
  casterId: string;
  description: string;
  targetId?: string;
  targetPosition?: { x: number; y: number };
}

interface SpellLoadoutDetail {
  script: CombatDemoSpellScript;
  spell: SpellData | null;
}

interface SpellSummaryPanelProps {
  spell: SpellData | null;
  preview: SpellPreviewSnapshot | null;
  resolution: SpellResolutionSnapshot | null;
  caster: CombatCharacter | null;
  affectedCharacters: CombatCharacter[];
  loadout: SpellLoadoutDetail[];
  activeSpellId: string | null;
}

const formatModifier = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export function SpellSummaryPanel({
  spell,
  preview,
  resolution,
  caster,
  affectedCharacters,
  loadout,
  activeSpellId,
}: SpellSummaryPanelProps) {
  const hasRolls =
    (resolution?.attackRolls.length ?? 0) > 0 ||
    (resolution?.savingThrows.length ?? 0) > 0 ||
    (resolution?.damageRolls.length ?? 0) > 0;

  return (
    <section className="bg-midnight-400/30 border border-shadow-800 rounded-lg p-4 space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-shadow-300">Spell Highlights</h3>
        {spell ? (
          <div className="text-shadow-200 text-sm">
            <span className="font-semibold">{spell.name}</span> · Level {spell.level} · {spell.school} · {spell.range}
          </div>
        ) : (
          <p className="text-xs text-shadow-400">No spell resolved on the current step.</p>
        )}
        {caster && (
          <div className="text-xs text-shadow-400">
            Cast by <span className="font-semibold text-shadow-200">{caster.name}</span>
          </div>
        )}
      </header>

      {preview && (
        <div className="rounded-md border border-shadow-700 bg-shadow-900/60 p-3 text-xs space-y-2">
          <div className="font-semibold text-shadow-200 uppercase tracking-[0.25em]">Preview</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-shadow-200">
            <span>{preview.affectedSquares.length} squares affected</span>
            {preview.friendlyFireRisk && <span>⚠️ Friendly fire risk</span>}
            {preview.requiresLineOfSight && !preview.lineOfSightBlocked && <span>👁️ Requires line of sight</span>}
            {preview.lineOfSightBlocked && <span>🚫 Line of sight blocked</span>}
          </div>
        </div>
      )}

      {resolution && (
        <div className="space-y-3 text-xs text-shadow-200">
          <div className="rounded-md border border-shadow-700 bg-shadow-900/60 p-3 space-y-2">
            <div className="font-semibold uppercase tracking-[0.25em] text-shadow-200">Impact</div>
            <div>
              {resolution.affectedCharacterIds.length} target
              {resolution.affectedCharacterIds.length === 1 ? '' : 's'} affected
            </div>
            {affectedCharacters.length > 0 && (
              <ul className="space-y-1">
                {affectedCharacters.map((target) => (
                  <li key={target.id} className="flex items-center justify-between rounded bg-shadow-800/80 px-2 py-1">
                    <span className="font-semibold text-shadow-50">
                      {target.name} {target.isPlayer ? '(Ally)' : '(Enemy)'}
                    </span>
                    <span className="text-shadow-300">
                      HP {target.hp}/{target.maxHp}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="text-shadow-300">
              {resolution.friendlyFireOccurred ? '⚠️ Allies were caught in the blast.' : 'Allies were spared.'}
            </div>
          </div>

          {hasRolls && (
            <div className="space-y-2">
              {resolution.attackRolls.length > 0 && (
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-shadow-200 mb-1">Attack Rolls</div>
                  <ul className="space-y-1">
                    {resolution.attackRolls.map((roll) => (
                      <li key={roll.id} className="rounded bg-shadow-900/70 border border-shadow-700 px-2 py-1">
                        <span className="font-semibold text-shadow-50">{roll.description}</span> · Result{' '}
                        {roll.finalResult}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resolution.savingThrows.length > 0 && (
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-shadow-200 mb-1">Saving Throws</div>
                  <ul className="space-y-1">
                    {resolution.savingThrows.map((roll) => (
                      <li key={roll.id} className="rounded bg-shadow-900/70 border border-shadow-700 px-2 py-1">
                        <span className="font-semibold text-shadow-50">{roll.description}</span> · Result{' '}
                        {roll.finalResult}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resolution.damageRolls.length > 0 && (
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-shadow-200 mb-1">Damage Rolls</div>
                  <ul className="space-y-1">
                    {resolution.damageRolls.map((roll) => (
                      <li key={roll.id} className="rounded bg-shadow-900/70 border border-shadow-700 px-2 py-1">
                        <span className="font-semibold text-shadow-50">{roll.description}</span> · Total{' '}
                        {roll.finalResult}
                        {roll.modifier ? ` (${formatModifier(roll.modifier)} mod)` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="font-semibold uppercase tracking-[0.25em] text-shadow-200 text-xs">Scenario Loadout</div>
        {loadout.length === 0 ? (
          <p className="text-xs text-shadow-400">No predefined spell loadout for this scenario.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {loadout.map(({ script, spell: loadoutSpell }) => {
              const isActive = script.spellId === activeSpellId;
              return (
                <div
                  key={`${script.casterId}-${script.spellId}`}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    isActive
                      ? 'border-aurora-400 bg-aurora-500/20 text-aurora-50'
                      : 'border-shadow-700 bg-shadow-900/60 text-shadow-200'
                  }`}
                  title={script.description}
                >
                  {loadoutSpell ? loadoutSpell.name : script.spellId}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
