import { CharacterSheet } from '../types';

export enum ConditionType {
  Blinded = 'Blinded',
  Charmed = 'Charmed',
  Deafened = 'Deafened',
  Frightened = 'Frightened',
  Grappled = 'Grappled',
  Incapacitated = 'Incapacitated',
  Invisible = 'Invisible',
  Paralyzed = 'Paralyzed',
  Petrified = 'Petrified',
  Poisoned = 'Poisoned',
  Prone = 'Prone',
  Restrained = 'Restrained',
  Stunned = 'Stunned',
  Unconscious = 'Unconscious',
  Exhaustion = 'Exhaustion',
  Rage = 'Rage', // Class Feature Condition
}

export interface ConditionModifier {
  grantAdvantageToAttacker?: boolean; // Attacker hitting ME gets advantage
  grantDisadvantageToAttacker?: boolean; // Attacker hitting ME gets disadvantage (e.g. Invisible)
  hasDisadvantageOnAttack?: boolean; // I have disadvantage on attacks
  hasAdvantageOnAttack?: boolean; // I have advantage
  autoFailStrDexSaves?: boolean;
  autoCritReceived?: boolean; // Hits against me are crits
  speedZero?: boolean;
}

// Registry definition
const CONDITION_REGISTRY: Record<string, ConditionModifier> = {
  [ConditionType.Blinded]: {
    hasDisadvantageOnAttack: true,
    grantAdvantageToAttacker: true,
  },
  [ConditionType.Grappled]: {
    speedZero: true,
  },
  [ConditionType.Incapacitated]: {
    // No actions (logic handled in Action Validation usually)
  },
  [ConditionType.Invisible]: {
    hasAdvantageOnAttack: true,
    grantDisadvantageToAttacker: true,
  },
  [ConditionType.Paralyzed]: {
    speedZero: true,
    autoFailStrDexSaves: true,
    grantAdvantageToAttacker: true,
    autoCritReceived: true,
  },
  [ConditionType.Petrified]: {
    speedZero: true,
    grantAdvantageToAttacker: true,
    autoFailStrDexSaves: true,
  },
  [ConditionType.Poisoned]: {
    hasDisadvantageOnAttack: true,
  },
  [ConditionType.Prone]: {
    // Prone is complex: Advantage if Melee, Disadvantage if Ranged.
    // For MVP, simplistic "GrantAdvantageToAttacker" approach might oversimplify ranged interaction.
    // We will handle specific logic in Combat or split flags 'grantMeleeAdvantage' etc.
    // For now, let's stick to standard flags and expect Combat to handle range check overrides if simpler?
    // Actually, generic flag is dangerous.
    // Let's add specific nuance.
    // grantAdvantageToAttacker: true, // Removed: Handled in combat.ts to allow Ranged Disadvantage
    hasDisadvantageOnAttack: true,
  },
  [ConditionType.Restrained]: {
    speedZero: true,
    hasDisadvantageOnAttack: true,
    grantAdvantageToAttacker: true,
    autoFailStrDexSaves: true, // Should only be Dex saves actually.
  },
  [ConditionType.Stunned]: {
    speedZero: true,
    grantAdvantageToAttacker: true,
    autoFailStrDexSaves: true,
  },
  [ConditionType.Unconscious]: {
    speedZero: true,
    grantAdvantageToAttacker: true,
    autoCritReceived: true,
    autoFailStrDexSaves: true,
  },
};

/**
 * Checks if a character has a specific condition.
 */
export function hasCondition(sheet: CharacterSheet, type: ConditionType | string): boolean {
  return sheet.conditions?.some((c) => c.name.toLowerCase() === type.toLowerCase()) ?? false;
}

/**
 * Aggregates all active modifiers for a character based on their conditions.
 */
export function getConditionModifiers(sheet: CharacterSheet): ConditionModifier {
  const result: ConditionModifier = {};

  if (!sheet.conditions) return result;

  for (const cond of sheet.conditions) {
    // Find definition (case insensitive mostly, but Enum preferable)
    const key = Object.keys(CONDITION_REGISTRY).find((k) => k.toLowerCase() === cond.name.toLowerCase());
    if (key) {
      const mod = CONDITION_REGISTRY[key];
      if (mod) {
        if (mod.grantAdvantageToAttacker) result.grantAdvantageToAttacker = true;
        if (mod.grantDisadvantageToAttacker) result.grantDisadvantageToAttacker = true;
        if (mod.hasDisadvantageOnAttack) result.hasDisadvantageOnAttack = true;
        if (mod.hasAdvantageOnAttack) result.hasAdvantageOnAttack = true;
        if (mod.speedZero) result.speedZero = true;
        if (mod.autoCritReceived) result.autoCritReceived = true;
        if (mod.autoFailStrDexSaves) result.autoFailStrDexSaves = true;
      }
    }
  }

  return result;
}
