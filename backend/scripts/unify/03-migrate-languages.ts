import { runMigration } from '../utils/migration-runner';
import { getAll } from '../utils/strapi-client';

interface Language {
  documentId: string;
  name: string;
}

interface Monster {
  documentId: string;
  name: string;
  languages?: string; // "Common, Goblin"
  stats?: {
    languages?: number[]; // IDs
  };
}

// Case insensitive normalized map
const buildLanguageMap = async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const langs = await getAll<Language>('languages');
  for (const l of langs) {
    if (l.name) {
      map.set(l.name.toLowerCase().trim(), l.documentId);
    }
  }
  return map;
};

async function main() {
  const langMap = await buildLanguageMap();
  console.info(`[Init] Loaded ${langMap.size} languages for matching.`);

  await runMigration<Monster>({
    collection: 'monsters',
    name: '03-migrate-languages',
    dryRun: process.argv.includes('--dry-run'),
    process: async (monster) => {
      if (!monster.languages) return null;

      const raw = monster.languages;
      // Split by comma
      const parts = raw.split(',').map((s) => s.trim());

      const matchedIds: Set<string> = new Set();
      const currentStats = monster.stats || {};
      // const existingLanguages = (currentStats.languages as any) || []; // Relations often return array of objects or IDs depending on population

      // If populated as objects, extract IDs. If IDs, keep them.
      // This is tricky. Usually "populate: *" returns objects.
      // But update expects IDs (connect/set).
      // For migration, we usually "connect" using IDs.

      // Let's assume we want to SET distinct IDs.

      for (const part of parts) {
        // Handle "telepathy 120 ft." -> Ignore here (belongs in Senses/Features)
        if (part.toLowerCase().includes('telepathy')) continue;

        // Try exact match
        let clean = part.replace(/\(.*\)/, '').trim(); // Remove (usually Common)
        clean = clean.replace(/.*\s+matches/, '').trim(); // Clean junk

        const id = langMap.get(clean.toLowerCase());
        if (id) {
          matchedIds.add(id);
        } else {
          // Try simple fuzzy? "Giant Owl" -> "Giant"? No, too risky.
          // Just log warn
          // console.warn(`[Warn] Unmatched language '${part}' for ${monster.name}`);
        }
      }

      if (matchedIds.size === 0) return null;

      // We use "connect" syntax for relations in Strapi
      return {
        stats: {
          ...currentStats,
          languages: {
            connect: Array.from(matchedIds),
          },
        },
      } as unknown;
    },
  });
}

main().catch(console.error);
