import { runMigration } from '../utils/migration-runner';
// import { updateEntity } from '../utils/strapi-client';

interface Monster {
  documentId: string;
  name: string;
  special_abilities?: {
    name: string;
    desc: string;
    // ...
  }[];
  features?: Record<string, unknown>[];
}

const REGEX_USAGE_DAY = /(\d+)\/Day/i;
const REGEX_RECHARGE = /Recharge\s+(\d+(?:-\d+)?)/i; // e.g. Recharge 6 or Recharge 5-6

async function main() {
  await runMigration<Monster>({
    collection: 'monsters',
    name: '05-migrate-features',
    dryRun: process.argv.includes('--dry-run'),
    process: async (monster) => {
      if (
        !monster.special_abilities ||
        !Array.isArray(monster.special_abilities) ||
        monster.special_abilities.length === 0
      )
        return null;

      const newFeatures: Record<string, unknown>[] = [];

      for (const ability of monster.special_abilities) {
        // Parse Usage
        let usage_max: number | null = null;
        let usage_per: string | null = null;

        // "3/Day"
        const dayMatch = ability.name.match(REGEX_USAGE_DAY);
        if (dayMatch) {
          usage_max = parseInt(dayMatch[1], 10);
          usage_per = 'day';
        }

        // "Recharge 5-6" - Technically not a "usage_per" in the same way, but let's flag it.
        // Or leave it in description.
        // We'll set usage_per = 'other' if we see Recharge?
        if (REGEX_RECHARGE.test(ability.name)) {
          usage_per = 'other'; // implies special recharge mechanic
        }

        newFeatures.push({
          name: ability.name,
          description: ability.desc,
          source: 'monster',
          usage_max: usage_max,
          usage_per: usage_per,
        });
      }

      if (newFeatures.length === 0) return null;

      return {
        features: newFeatures,
      };
    },
  });
}

main().catch(console.error);
