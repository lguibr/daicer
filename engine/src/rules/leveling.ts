import { EntitySheet } from '../types';
import { calculateModifier, calculateProficiencyBonus } from './dnd5e';

export const XP_TABLE = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000,
  265000, 305000, 355000,
];

export function getLevelFromXP(xp: number): number {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) return i + 1;
  }
  return 1;
}

/**
 * Standard 5e Full Caster Slot Progression
 */
const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 2, 1, 1, 1, 1, 1],
  20: [4, 3, 3, 3, 2, 1, 1, 1, 1, 1],
};

/**
 * Processes a Level Up.
 * Note: Mutates the sheet for MVP.
 */
export function levelUp(sheet: EntitySheet): EntitySheet {
  const currentLevel = sheet.level;
  const newLevel = currentLevel + 1;

  if (newLevel > 20) return sheet; // Cap at 20

  sheet.level = newLevel;

  // 1. HP Increase (Deterministic Average)
  // Hit Die: "1d8" -> 8. Average is (8/2)+1 = 5.
  const hitDieStr = sheet.hitDice.die || '1d8';
  // "1d8" -> split 'd' -> ["1", "8"]
  const parts = hitDieStr.split('d');
  const sides = parseInt(parts[1] ?? parts[0] ?? '8') || 8;
  const avg = Math.floor(sides / 2) + 1;
  const conScore = sheet.attributes.Constitution ?? 10;
  const conMod = calculateModifier(conScore);

  const hpGain = Math.max(1, avg + conMod);

  sheet.maxHp += hpGain;
  sheet.hp += hpGain; // Heal the gain immediately? Usually yes.

  // 2. Hit Dice Increase
  sheet.hitDice.total += 1;
  sheet.hitDice.current += 1;

  // 3. Proficiency Bonus
  sheet.proficiencyBonus = calculateProficiencyBonus(newLevel);

  // 4. Spell Slots (If Caster)
  // Simple check for MVP: Does it have slots already?
  // Or check Class.
  const cls = sheet.characterClass.toLowerCase();
  const isCaster = ['wizard', 'sorcerer', 'cleric', 'bard', 'druid'].some((c) => cls.includes(c));

  if (isCaster && FULL_CASTER_SLOTS[newLevel]) {
    const newSlotsConfig = FULL_CASTER_SLOTS[newLevel];

    // Update slots array
    // Map existing to preserve usage? Or Level Up usually resets?
    // Level Up usually happens during downtime, so reset fits.
    // But strictly, we should expand.

    const newSlots = newSlotsConfig.map((total, idx) => {
      const level = idx + 1;
      // Find existing
      const existing = sheet.spellbook?.slots?.find((s) => s.level === level);
      if (existing) {
        return { level, max: total, current: existing.current + (total - existing.max) };
      }
      return { level, max: total, current: total };
    });

    if (!sheet.spellbook) {
      // Init spellbook if missing? Should have been there.
      // Ignoring for now.
    } else {
      sheet.spellbook.slots = newSlots;
    }
  }

  return sheet; // Return mutated
}
