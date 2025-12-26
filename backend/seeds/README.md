# Backend Seeds

This directory contains the JSON data used to seed the Daicer backend with initial game content (D&D 5e SRD based).

## Usage

To run the seeds, use the following command from the `backend` directory:

```bash
yarn seed
# OR directly
yarn ts-node src/scripts/seed.ts
```

This script connects to the Strapi instance (which must be built/available, but the script instantiates its own Strapi instance, so the server doesn't necessarily need to be running on a port, but the database must be accessible).

## Seeding Order & Dependencies

The `src/scripts/seed.ts` script executes seeding in a specific order to respect relational dependencies.

1.  **Prompts** (System prompts for LLM)
2.  **Races**
3.  **Classes**
4.  **Subclasses** (Depends on `Classes`)
5.  **Spells**
6.  **Monsters**
7.  **Equipment Categories**
8.  **Weapon Properties**
9.  **Damage Types**
10. **Magic Schools**
11. **Languages**
12. **Equipment** (Depends on `Equipment Categories`, `Weapon Properties`, `Damage Types`)
13. **Magic Items** (Depends on `Equipment Categories`)
14. **Proficiencies** (Depends on `Classes`, `Races`)
15. **Traits** (Depends on `Races`, `Proficiencies`)

## Default Data

The seeds populate the database with standard SRD (System Reference Document) content, including:

- **Classes**: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.
- **Races**: Dragonborn, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling, Human, Tiefling.
- **Equipment**: Standard weapons, armor, and adventuring gear.
- **Spells**: A subset of standard spells.
- **Monsters**: Common low-level monsters (Goblin, Orc, Skeleton, etc.).
- **Prompts**: Core system prompts for the AI Narrator (e.g., combat description, world building).

## Troubleshooting & Reset

### Re-seeding

The seed script is idempotent for **creation** but might not update all fields if the entry already exists. It primarily checks for existence by unique keys (like `slug` or `key`) and skips creation if found. Some sections (like Prompts) have logic to update text if it matches a specific key, but generally, it is "create if missing".

### Full Reset

To completely reset the database and re-seed from scratch (ONLY for local development):

1.  Stop the Strapi server.
2.  Delete the SQlite database file (if using default local db):
    ```bash
    rm .tmp/data.db
    ```
    _Note: If using Postgres, drop and recreate the schema._
3.  Run the seed command:
    ```bash
    yarn seed
    ```
