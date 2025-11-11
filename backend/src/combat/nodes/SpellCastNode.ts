/**
 * @file backend/src/combat/nodes/SpellCastNode.ts
 * @description Combat graph node for spell casting - integrates spatial targeting with damage
 * @note This shows how spell effect shapes integrate into CORE combat resolution
 */

import type { CombatState } from '../state';
import type { SpellData, GridPosition } from '../../types/spells';
import { calculateAffectedSquares, canCauseFriendlyFire } from '../spell-targeting';
import { rollDice } from '../dice';

/**
 * Cast a spell in combat - CORE integration of spatial targeting
 *
 * @param state - Current combat state
 * @param casterId - Character casting the spell
 * @param spellData - Spell being cast
 * @param targetPosition - Target point/creature position
 * @returns Updated combat state
 */
export function castSpell(
  state: CombatState,
  casterId: string,
  spellData: SpellData,
  targetPosition: GridPosition
): CombatState {
  const caster = state.characters.find((c) => c.id === casterId);
  if (!caster) return state;

  // STEP 1: Calculate affected grid squares using CORE spatial targeting
  const affectedSquares = calculateAffectedSquares(
    spellData.effectShape,
    spellData.effectDimensions,
    caster.position,
    targetPosition,
    state.gridWidth,
    state.gridHeight
  );

  // STEP 2: Find all characters in affected squares
  const affectedCharacters = state.characters.filter((char) =>
    affectedSquares.some((sq) => sq.x === char.position.x && sq.y === char.position.y && char.hp > 0)
  );

  // STEP 3: Check for friendly fire
  const friendlyFireRisk = canCauseFriendlyFire(spellData.effectShape);
  const allies = affectedCharacters.filter((c) => c.isPlayer === caster.isPlayer);

  if (friendlyFireRisk && allies.length > 0) {
    state.log.push({
      id: `spell-warning-${Date.now()}`,
      timestamp: Date.now(),
      message: `⚠️ Warning: ${spellData.name} may hit ${allies.length} allies!`,
      type: 'warning',
      relatedRolls: [],
    });
  }

  // STEP 4: Apply damage/effects to each affected character
  const updatedCharacters = state.characters.map((char) => {
    if (!affectedCharacters.find((ac) => ac.id === char.id)) return char;

    // Roll spell attack or saving throw
    let damage = 0;

    if (spellData.damage) {
      const damageRoll = rollDice(
        spellData.damage.diceType,
        spellData.damage.diceCount,
        spellData.damage.bonus || 0,
        state.diceRollerSeed
      );

      damage = damageRoll.total;

      // Handle saving throw
      if (spellData.savingThrow) {
        const saveRoll = rollDice(20, 1, 0, state.diceRollerSeed);
        const saveDC = 8 + caster.proficiencyBonus + 3; // Simplified spellcasting modifier

        if (saveRoll.total >= saveDC) {
          if (spellData.savingThrow.damageOnSave === 'half') {
            damage = Math.floor(damage / 2);
          } else if (spellData.savingThrow.damageOnSave === 'none') {
            damage = 0;
          }
        }
      }
    }

    return {
      ...char,
      hp: Math.max(0, char.hp - damage),
    };
  });

  // STEP 5: Generate combat log
  state.log.push({
    id: `spell-cast-${Date.now()}`,
    timestamp: Date.now(),
    message: `${caster.name} casts **${spellData.name}** affecting ${affectedCharacters.length} targets!`,
    type: 'attack',
    relatedRolls: [],
  });

  return {
    ...state,
    characters: updatedCharacters,
    log: [...state.log],
  };
}

/**
 * Example usage in combat graph:
 *
 * const spell = await loadSpellById('fireball');
 * const newState = castSpell(currentState, casterId, spell, targetPoint);
 *
 * This uses calculateAffectedSquares() to determine which grid squares
 * are hit, then applies damage to all characters in those squares.
 */
