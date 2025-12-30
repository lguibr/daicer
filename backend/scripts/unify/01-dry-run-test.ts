import { runMigration } from '../utils/migration-runner';

interface Monster {
  documentId: string;
  name: string;
  proficiencies?: unknown;
}

async function main() {
  await runMigration<Monster>({
    collection: 'monsters',
    name: '01-dry-run-test',
    dryRun: true,
    // Just test on one monster
    filter: (m) => m.name.toLowerCase().includes('goblin'),
    process: async (monster) => {
      console.info(`Processing ${monster.name}...`);

      // Simulate a change
      if (monster.proficiencies) {
        return {
          name: monster.name,
        };
      }
      return null;
    },
  });
}

main().catch(console.error);
