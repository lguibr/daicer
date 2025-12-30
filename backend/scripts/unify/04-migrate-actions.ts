import { runMigration } from '../utils/migration-runner';
// import { updateEntity } from '../utils/strapi-client';

interface Monster {
  documentId: string;
  name: string;
  actions?: {
    name: string;
    desc: string;
    attack_bonus?: number;
    // ... possibly other legacy fields
  }[];
  structuredActions?: Record<string, unknown>[]; // The target
}

// --- REGEX SUITE ---

// Type Detection
const REGEX_MELEE_WEAPON = /Melee Weapon Attack/i;
const REGEX_RANGED_WEAPON = /Ranged Weapon Attack/i;
const REGEX_SPELL_ATTACK = /Spell Attack/i;

// Stats
const REGEX_TO_HIT = /\+([0-9]+)\s+to\s+hit/i;
const REGEX_REACH = /reach\s+([0-9]+)\s*ft/i;
// const REGEX_RANGE = /range\s+([0-9]+)(?:\/([0-9]+))?\s*ft/i;

// Damage: "Hit: 5 (1d6 + 2) slashing damage"
// Captures: 1=Avg, 2=DiceFormula, 3=Bonus, 4=Type
const REGEX_DAMAGE = /Hit:\s*([0-9]+)\s*\(([0-9]+d[0-9]+)\s*(?:[+-]\s*([0-9]+))?\)\s*([a-zA-Z]+)\s*damage/i;

// Save: "DC 13 DC dexterity saving throw" (sometimes typos in source), or "DC 13 Strength saving throw"
const REGEX_SAVE = /DC\s*([0-9]+)\s*([a-zA-Z]+)\s*saving\s*throw/i;

// Duration doesn't usually appear in Monster Actions (mostly spells), but we can look for "1 minute" etc.
// const REGEX_DURATION_MIN = /1\s+minute/i;

function parseActionType(desc: string): 'melee' | 'ranged' | 'spell' | 'utility' {
  if (REGEX_MELEE_WEAPON.test(desc)) return 'melee';
  if (REGEX_RANGED_WEAPON.test(desc)) return 'ranged';
  if (REGEX_SPELL_ATTACK.test(desc)) return 'spell';
  // Fallback? If it has damage, maybe utility/special?
  // Usually if no attack roll, it might be a multiattack or a breath weapon (Save based).
  // Breath weapons are usually "utility" or "special" but fit under Actions.
  // We'll default to 'utility' if no clear attack keywords found.
  return 'utility';
}

function parseDamage(desc: string) {
  const match = desc.match(REGEX_DAMAGE);
  if (!match) return [];

  // match[2] is "1d6"
  // match[3] is "2" (bonus)
  // match[4] is "slashing"
  return [
    {
      dice: match[2],
      bonus: match[3] ? parseInt(match[3], 10) : 0,
      type: match[4].toLowerCase(),
    },
  ];
}

function parseSave(desc: string) {
  const match = desc.match(REGEX_SAVE);
  if (!match) return null;
  // match[1] = 13 (DC)
  // match[2] = Dexterity (Stat)
  return {
    dc: parseInt(match[1], 10),
    stat: match[2].toLowerCase().substring(0, 3), // "Dexterity" -> "dex"
  };
}

async function main() {
  await runMigration<Monster>({
    collection: 'monsters',
    name: '04-migrate-actions',
    dryRun: process.argv.includes('--dry-run'),
    process: async (monster) => {
      if (!monster.actions || !Array.isArray(monster.actions) || monster.actions.length === 0) return null;

      const newActions: Record<string, unknown>[] = [];

      for (const act of monster.actions) {
        if (act.name === 'Multiattack') continue; // Skip Multiattack for now (handled separately or not a 'structured action'?)

        // Parse Parsing
        const type = parseActionType(act.desc);

        const toHitMatch = act.desc.match(REGEX_TO_HIT);
        const toHit = toHitMatch ? parseInt(toHitMatch[1], 10) : undefined;

        const reachMatch = act.desc.match(REGEX_REACH);
        const reach = reachMatch ? parseInt(reachMatch[1], 10) : undefined;

        const damage = parseDamage(act.desc);
        const save = parseSave(act.desc);

        // If it's just text without mechanics, keep it as utility?

        newActions.push({
          name: act.name,
          type,
          toHit,
          reach,
          damage,
          save,
          description: act.desc,
          duration: 'instantaneous', // Default
        });
      }

      if (newActions.length === 0) return null;

      return {
        structuredActions: newActions,
      };
    },
  });
}

main().catch(console.error);
