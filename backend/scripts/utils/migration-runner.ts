import { getAll, updateEntity } from './strapi-client';

export interface MigrationConfig<T> {
  collection: string;
  name: string;
  dryRun?: boolean;
  filter?: (item: T) => boolean;
  process: (item: T) => Promise<Partial<T> | null>; // Return null to skip update
}

export async function runMigration<T extends { documentId: string; name?: string }>(config: MigrationConfig<T>) {
  console.info(`\n=== Starting Migration: ${config.name} ===`);
  console.info(`Dry Run: ${config.dryRun ?? false}`);

  const items = await getAll<T>(config.collection, { populate: '*' });
  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const item of items) {
    if (config.filter && !config.filter(item)) continue;

    try {
      const changes = await config.process(item);
      if (changes) {
        if (!config.dryRun) {
          await updateEntity(config.collection, item.documentId, changes);
          process.stdout.write('.');
        } else {
          console.info(
            `[DryRun] Would update ${item.name || item.documentId}:`,
            JSON.stringify(changes).slice(0, 100) + '...'
          );
        }
        updated++;
      }
    } catch (err) {
      console.error(`\nError processing ${item.name || item.documentId}:`, err);
      errors++;
    }
    processed++;
  }

  console.info(`\n\n=== Migration Complete ===`);
  console.info(`Processed: ${processed}`);
  console.info(`Updated: ${updated}`);
  console.info(`Errors: ${errors}`);
}
