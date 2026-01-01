import { z } from 'zod';
import { CharacterSheetSchema } from '../schemas/character';
import { rollDie } from './dice';
import { calculateModifier } from './dnd5e';

type CharacterSheet = z.infer<typeof CharacterSheetSchema>;

export interface RestResult {
  hpHealed: number;
  hitDiceSpent: number;
  hitDiceRecovered: number;
  resourcesRecovered: string[]; // Names of resources/features/slots
  newHp: number;
  newHitDice: number;
}

/**
 * Performs a Short Rest.
 * Allows spending Hit Dice to heal.
 * Resets "short-rest" resources.
 */
export function shortRest(sheet: CharacterSheet, hitDiceToSpend: number): RestResult {
  let hpHealed = 0;
  let hitDiceSpent = 0;

  // 1. Spend Hit Dice
  const conScore = sheet.attributes.Constitution ?? 10;
  const conMod = calculateModifier(conScore);

  let currentHitDice = sheet.hitDice.current;

  // Dice Parsing: "1d8" -> sides=8
  const hitDieStr = sheet.hitDice.die || '1d8'; // Default fallback
  const sides = parseInt(hitDieStr.replace(/[^0-9]/g, '')) || 8;

  for (let i = 0; i < hitDiceToSpend; i++) {
    if (currentHitDice > 0) {
      const rollVal = rollDie(sides);
      const heal = Math.max(0, rollVal + conMod); // Min 0 heal
      hpHealed += heal;
      currentHitDice--;
      hitDiceSpent++;
    }
  }

  // Cap HP
  const newHp = Math.min(sheet.maxHp, sheet.hp + hpHealed);

  // 2. Reset Resources (Short Rest)
  const recoveredList: string[] = [];

  // Features
  // Note: FeatureSchema in character.ts had usage: { max, current, per }
  // We need to iterate sheet.features.
  // BUT `sheet.features` is array(FeatureSchema).
  // Wait, I updated FeatureSchema in schema/character.ts to have `current`.

  // Need to clone strictly or return mutations?
  // Engine functions should ideally return the *diff* or a *clone*, or expect mutation.
  // For MVP simplification, we assume the caller will start using the new state,
  // but to keep it deterministic and avoid side-effects on input ref if possible,
  // we usually return a new object or just the numeric deltas.
  // However, `sheet` structure is deep.
  // Let's perform logic assuming Mutable Sheet for now (or caller clones).
  // DANGER: Pure functions are better.
  // But strictly cloning deeply is expensive.
  // I will act on the sheet reference passed in? No, that's side-effecty.
  // I will return the "Result" describing changes, AND perform the mutation?
  // Or just return the Result, and let the caller apply?
  // "hpHealed" is easy. Resets are lists.
  // Let's assume this function MUTATES the sheet for convenience in this MVP,
  // as Redux/State management will likely wrap this in an Immer producer anyway.

  // Apply HP changes
  sheet.hp = newHp;
  sheet.hitDice.current = currentHitDice;

  // Reset Features
  if (Array.isArray(sheet.features)) {
    sheet.features.forEach((f) => {
      if (f.usage && (f.usage.per === 'short_rest' || f.usage.per === 'short')) {
        // Normalized strings?
        f.usage.current = f.usage.max; // Reset
        recoveredList.push(f.name);
      }
    });
  }

  // Reset Resources (Generic Pools)
  sheet.resources.forEach((r) => {
    if (r.refresh === 'short-rest') {
      r.current = r.max;
      recoveredList.push(r.name);
    }
  });

  // Warlock Slots come back on Short Rest (Pact Magic).
  // This requires knowing CLASS logic.
  // MVP: explicit `refresh` on spell slots?
  // SpellSlotsSchema didn't have `refresh`.
  // Warlock slots are special.
  // For MVP, we might skip Warlock auto-detection unless explicitly flagged.
  // Or check class name?
  if (sheet.characterClass.toLowerCase().includes('warlock')) {
    if (sheet.spellbook && sheet.spellbook.slots) {
      sheet.spellbook.slots.forEach((_s) => {
        // Pact Magic slots usually have a MAX level, and all are same level.
        // Logic is complex. Skipping Warlock short rest slots for MVP unless genericized.
      });
    }
  }

  return {
    hpHealed,
    hitDiceSpent,
    hitDiceRecovered: 0,
    resourcesRecovered: recoveredList,
    newHp,
    newHitDice: currentHitDice,
  };
}

/**
 * Performs a Long Rest.
 * Full Heal, Reset All Slots, Recover 1/2 Hit Dice.
 */
export function longRest(sheet: CharacterSheet): RestResult {
  const hpHealed = sheet.maxHp - sheet.hp;

  // 1. Recover HP
  sheet.hp = sheet.maxHp;

  // 2. Recover Hit Dice (Half Max, flow)
  const maxHitDice = sheet.hitDice.total;
  const recoverAmount = Math.max(1, Math.floor(maxHitDice / 2));
  const oldHitDice = sheet.hitDice.current;
  sheet.hitDice.current = Math.min(maxHitDice, oldHitDice + recoverAmount);

  const hitDiceRecovered = sheet.hitDice.current - oldHitDice;

  // 3. Reset All Resources
  const recoveredList: string[] = ['HP', 'Hit Dice'];

  // Spell Slots
  if (sheet.spellbook && sheet.spellbook.slots) {
    sheet.spellbook.slots.forEach((s) => {
      s.current = s.max; // All slots back
    });
    recoveredList.push('Spell Slots');
  }

  // Features
  if (Array.isArray(sheet.features)) {
    sheet.features.forEach((f) => {
      if (f.usage) {
        // Long rest resets Short AND Long rest features usually?
        // Yes, Long Rest resets everything.
        f.usage.current = f.usage.max;
        recoveredList.push(f.name);
      }
    });
  }

  // Generic Resources
  sheet.resources.forEach((r) => {
    // Refresh checks? 'daily', 'long-rest'
    if (['long-rest', 'daily', 'short-rest'].includes(r.refresh)) {
      r.current = r.max;
      recoveredList.push(r.name);
    }
  });

  return {
    hpHealed,
    hitDiceSpent: 0,
    hitDiceRecovered,
    resourcesRecovered: recoveredList,
    newHp: sheet.hp,
    newHitDice: sheet.hitDice.current,
  };
}
