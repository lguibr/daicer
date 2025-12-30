import { runMigration } from '../utils/migration-runner';

interface Monster {
  documentId: string;
  name: string;
  senses?: {
    passive_perception?: number;
    darkvision?: string;
    blindsight?: string;
    truesight?: string;
    tremorsense?: string;
  } | null; // It can be null in the DB
  stats?: {
    passivePerception?: number;
    darkvision?: number;
    blindsight?: number;
    truesight?: number;
    tremorsense?: number;
  };
}

function parseDistance(val?: string): number | null {
  if (!val) return null;
  const match = val.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

async function main() {
  await runMigration<Monster>({
    collection: 'monsters',
    name: '03-migrate-senses',
    dryRun: process.argv.includes('--dry-run'),
    process: async (monster) => {
      // Robust null check for senses
      if (!monster.senses || typeof monster.senses !== 'object') return null;

      const changes: Record<string, unknown> = {};
      let hasChanges = false;
      const currentStats = monster.stats || {};

      // 1. Passive Perception
      if (monster.senses.passive_perception !== undefined && monster.senses.passive_perception !== null) {
        if (currentStats.passivePerception !== monster.senses.passive_perception) {
          changes.passivePerception = monster.senses.passive_perception;
          hasChanges = true;
        }
      }

      // 2. Vision Distances
      const visionMap = {
        darkvision: 'darkvision',
        blindsight: 'blindsight',
        truesight: 'truesight',
        tremorsense: 'tremorsense',
      };

      for (const [jsonKey, statKey] of Object.entries(visionMap)) {
        // @ts-ignore
        const rawVal = monster.senses[jsonKey];
        const dist = parseDistance(rawVal);

        if (dist !== null) {
          // @ts-ignore
          if (currentStats[statKey] !== dist) {
            // @ts-ignore
            changes[statKey] = dist;
            hasChanges = true;
          }
        }
      }

      if (!hasChanges) return null;

      return {
        stats: {
          ...currentStats, // Preserve existing stats (like speed)
          ...changes,
        },
      };
    },
  });
}

main().catch(console.error);
