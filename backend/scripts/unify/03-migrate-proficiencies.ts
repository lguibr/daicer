import { runMigration } from '../utils/migration-runner';

interface Monster {
  documentId: string;
  name: string;
  proficiencies?: {
    value?: number;
    proficiency?: {
      name?: string; // e.g., "Skill: Stealth" or "Saving Throw: DEX"
    };
  }[];
  stats?: {
    skills?: string[];
    saves?: string[];
  };
}

// Mapping for canonical IDs
const SKILL_MAP: Record<string, string> = {
  acrobatics: 'acrobatics',
  'animal handling': 'animal-handling',
  arcana: 'arcana',
  athletics: 'athletics',
  deception: 'deception',
  history: 'history',
  insight: 'insight',
  intimidation: 'intimidation',
  investigation: 'investigation',
  medicine: 'medicine',
  nature: 'nature',
  perception: 'perception',
  performance: 'performance',
  persuasion: 'persuasion',
  religion: 'religion',
  'sleight of hand': 'sleight-of-hand',
  stealth: 'stealth',
  survival: 'survival',
};

async function main() {
  await runMigration<Monster>({
    collection: 'monsters',
    name: '03-migrate-proficiencies',
    dryRun: process.argv.includes('--dry-run'),
    process: async (monster) => {
      if (!monster.proficiencies || !Array.isArray(monster.proficiencies)) return null;
      if (monster.proficiencies.length === 0) return null;

      const skills: Set<string> = new Set(monster.stats?.skills || []);
      const saves: Set<string> = new Set(monster.stats?.saves || []);
      let hasChanges = false;

      for (const entry of monster.proficiencies) {
        const rawName = entry.proficiency?.name;
        if (!rawName) continue;

        // Handle Skills
        if (rawName.startsWith('Skill:')) {
          const skillName = rawName.replace('Skill:', '').trim().toLowerCase();
          const canonical = SKILL_MAP[skillName];
          if (canonical) {
            if (!skills.has(canonical)) {
              skills.add(canonical);
              hasChanges = true;
            }
          } else {
            console.warn(`[Warn] Unknown skill: ${skillName} on ${monster.name}`);
          }
        }

        // Handle Saves
        else if (rawName.startsWith('Saving Throw:')) {
          const saveName = rawName.replace('Saving Throw:', '').trim().toLowerCase();
          // "dex" "con" etc.
          if (!saves.has(saveName)) {
            saves.add(saveName);
            hasChanges = true;
          }
        }
      }

      if (!hasChanges) return null;

      // Ensure stats object exists
      const existingStats = monster.stats || {};

      return {
        stats: {
          ...existingStats,
          skills: Array.from(skills),
          saves: Array.from(saves),
        },
      };
    },
  });
}

main().catch(console.error);
