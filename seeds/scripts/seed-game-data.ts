#!/usr/bin/env tsx
/**
 * Seed Firestore with D&D 5e Game Data
 * Run with: yarn seed:gamedata or tsx seeds/scripts/seed-game-data.ts
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '../../backend/src/utils/logger.js';
import { GAME_DATA_COLLECTIONS, type GameDataDocument } from '../../backend/src/types/game-data.js';

// Import all game data from JSON
import RACES from '../game-data/character-races.json' assert { type: 'json' };
import CLASSES from '../game-data/character-classes.json' assert { type: 'json' };
import BACKGROUNDS from '../game-data/character-backgrounds.json' assert { type: 'json' };
import ABILITIES from '../game-data/character-abilities.json' assert { type: 'json' };
import ALIGNMENTS from '../game-data/character-alignments.json' assert { type: 'json' };
import SKILLS from '../game-data/character-skills.json' assert { type: 'json' };
import CONDITIONS from '../game-data/combat-conditions.json' assert { type: 'json' };
import DAMAGE_TYPES from '../game-data/combat-damage-types.json' assert { type: 'json' };
import EQUIPMENT_CATEGORIES from '../game-data/equipment-categories.json' assert { type: 'json' };
import EQUIPMENT_ITEMS from '../game-data/equipment-items.json' assert { type: 'json' };
import WEAPON_PROPERTIES from '../game-data/equipment-weapon-properties.json' assert { type: 'json' };
import LANGUAGES from '../game-data/world-languages.json' assert { type: 'json' };
import MAGIC_SCHOOLS from '../game-data/magic-schools.json' assert { type: 'json' };
import MONSTERS from '../game-data/monsters.json' assert { type: 'json' };
import MAGIC_ITEMS from '../game-data/magic-items.json' assert { type: 'json' };
import FEATURES from '../game-data/features.json' assert { type: 'json' };
import TRAITS from '../game-data/traits.json' assert { type: 'json' };
import SUBCLASSES from '../game-data/subclasses.json' assert { type: 'json' };
import PROFICIENCIES from '../game-data/proficiencies.json' assert { type: 'json' };
import SPELLS from '../game-data/spells.json' assert { type: 'json' };

/**
 * Spell lookup map for denormalization
 */
interface SpellBasicInfo {
  id: string;
  name: string;
  level: number;
  school: string;
  range?: string;
}

// Build spell lookup map from spells.json
const spellLookup = new Map<string, SpellBasicInfo>();
for (const spell of SPELLS as any[]) {
  const spellInfo: SpellBasicInfo = {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    range: typeof spell.range === 'string' ? spell.range : spell.range?.type || 'Unknown',
  };
  spellLookup.set(spell.id, spellInfo);
  // Also allow lookup by URL pattern
  const urlId = spell.id.replace(/^\/api\/\d+\/spells\//, '');
  spellLookup.set(urlId, spellInfo);
}

/**
 * Extract spell ID from various formats (URL, index, etc.)
 */
function extractSpellId(spellRef: any): string | null {
  if (typeof spellRef === 'string') {
    // Direct ID or URL
    const match = spellRef.match(/\/spells\/([^/]+)$/);
    return match ? match[1] : spellRef;
  }
  if (spellRef?.url) {
    const match = spellRef.url.match(/\/spells\/([^/]+)$/);
    return match ? match[1] : null;
  }
  if (spellRef?.index) {
    return spellRef.index;
  }
  return null;
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  // Check if running against emulator
  const isEmulator = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

  if (isEmulator) {
    logger.info(`Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    logger.warn('⚠️  Running against PRODUCTION Firestore! Set FIRESTORE_EMULATOR_HOST to use emulator.');
  }

  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  });

  return getFirestore();
}

/**
 * Remove undefined values from object recursively
 */
function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Batch write documents to a collection (get-or-create pattern)
 */
async function seedCollection<T extends GameDataDocument>(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  documents: readonly T[]
): Promise<void> {
  let batch = db.batch();
  let count = 0;
  let skipped = 0;
  let batchSize = 0;

  for (const doc of documents) {
    const docRef = db.collection(collectionName).doc(doc.id);

    // Check if document already exists
    const existing = await docRef.get();
    if (existing.exists) {
      skipped++;
      continue;
    }

    // Remove undefined values before writing to Firestore
    const cleanDoc = removeUndefined(doc);
    batch.set(docRef, cleanDoc);
    count++;
    batchSize++;

    // Firestore batch limit is 500 operations
    if (batchSize >= 500) {
      await batch.commit();
      logger.info(`  ✓ Committed ${count} new documents to ${collectionName}`);
      batch = db.batch();
      batchSize = 0;
    }
  }

  // Commit remaining documents
  if (batchSize > 0) {
    await batch.commit();
  }

  logger.info(
    `✅ Seeded ${count} new documents to ${collectionName}${skipped > 0 ? ` (skipped ${skipped} existing)` : ''}`
  );
}

/**
 * Main seeding function
 */
async function seedGameData(): Promise<void> {
  logger.info('🌱 Starting game data seeding...\n');

  const db = initializeFirebase();

  try {
    // Seed Races
    logger.info(`📚 Seeding ${GAME_DATA_COLLECTIONS.RACES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.RACES,
      RACES.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        speed: r.speed,
        size: r.size,
        imageUrl: null,
      }))
    );

    // Seed Classes
    logger.info(`\n⚔️  Seeding ${GAME_DATA_COLLECTIONS.CLASSES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.CLASSES,
      CLASSES.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        hitDie: c.hitDie,
        primaryAbility: c.primaryAbility,
        savingThrows: c.savingThrows,
        imageUrl: null,
      }))
    );

    // Seed Backgrounds
    logger.info(`\n📖 Seeding ${GAME_DATA_COLLECTIONS.BACKGROUNDS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.BACKGROUNDS,
      BACKGROUNDS.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        skillProficiencies: b.skillProficiencies,
        imageUrl: null,
      }))
    );

    // Seed Abilities
    logger.info(`\n💪 Seeding ${GAME_DATA_COLLECTIONS.ABILITIES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.ABILITIES,
      ABILITIES.map((a) => ({
        id: a.id,
        index: a.index,
        name: a.name,
        fullName: a.fullName,
        description: a.description,
        imageUrl: null,
      }))
    );

    // Seed Alignments
    logger.info(`\n🧭 Seeding ${GAME_DATA_COLLECTIONS.ALIGNMENTS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.ALIGNMENTS,
      ALIGNMENTS.map((a) => ({
        id: a.id,
        index: a.id,
        name: a.name,
        abbreviation: a.abbreviation,
        description: a.description,
        imageUrl: null,
      }))
    );

    // Seed Skills
    logger.info(`\n🎯 Seeding ${GAME_DATA_COLLECTIONS.SKILLS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.SKILLS,
      SKILLS.map((s) => ({
        id: s.index,
        index: s.index,
        name: s.name,
        description: s.description,
        abilityScore: s.abilityScore,
        imageUrl: null,
      }))
    );

    // Seed Conditions
    logger.info(`\n🩹 Seeding ${GAME_DATA_COLLECTIONS.CONDITIONS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.CONDITIONS,
      CONDITIONS.map((c) => ({
        id: c.index,
        index: c.index,
        name: c.name,
        description: c.description,
        imageUrl: null,
      }))
    );

    // Seed Damage Types
    logger.info(`\n💥 Seeding ${GAME_DATA_COLLECTIONS.DAMAGE_TYPES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.DAMAGE_TYPES,
      DAMAGE_TYPES.map((d) => ({
        id: d.index,
        index: d.index,
        name: d.name,
        description: d.description,
        imageUrl: null,
      }))
    );

    // Seed Languages
    logger.info(`\n🗣️  Seeding ${GAME_DATA_COLLECTIONS.LANGUAGES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.LANGUAGES,
      LANGUAGES.map((l) => ({
        id: l.index,
        index: l.index,
        name: l.name,
        isRare: l.isRare,
        note: l.note,
        imageUrl: null,
      }))
    );

    // Seed Magic Schools
    logger.info(`\n✨ Seeding ${GAME_DATA_COLLECTIONS.MAGIC_SCHOOLS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.MAGIC_SCHOOLS,
      MAGIC_SCHOOLS.map((m) => ({
        id: m.index,
        index: m.index,
        name: m.name,
        description: m.description,
        imageUrl: null,
      }))
    );

    // Seed Equipment Categories
    logger.info(`\n📦 Seeding ${GAME_DATA_COLLECTIONS.EQUIPMENT_CATEGORIES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.EQUIPMENT_CATEGORIES,
      EQUIPMENT_CATEGORIES.map((e: any) => ({
        id: e.index,
        index: e.index,
        name: e.name,
        equipment: e.equipment || [],
        imageUrl: null,
      }))
    );

    // Seed Weapon Properties
    logger.info(`\n🗡️  Seeding ${GAME_DATA_COLLECTIONS.WEAPON_PROPERTIES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.WEAPON_PROPERTIES,
      WEAPON_PROPERTIES.map((w) => ({
        id: w.index,
        index: w.index,
        name: w.name,
        description: w.description,
        imageUrl: null,
      }))
    );

    // Seed Equipment
    logger.info(`\n🎒 Seeding ${GAME_DATA_COLLECTIONS.EQUIPMENT}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.EQUIPMENT,
      EQUIPMENT_ITEMS.map((e) => ({
        id: e.index,
        index: e.index,
        name: e.name,
        equipmentCategory: e.equipmentCategory,
        cost: e.cost,
        weight: e.weight,
        description: e.description,
        damage: e.damage,
        armorClass: e.armorClass,
        range: e.range,
        properties: e.properties,
        imageUrl: null,
      }))
    );

    // Seed Monsters
    logger.info(`\n🐉 Seeding ${GAME_DATA_COLLECTIONS.MONSTERS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.MONSTERS,
      MONSTERS.map((m: any) => {
        // Handle both old format (camelCase) and new format (snake_case)
        const ac = Array.isArray(m.armor_class)
          ? m.armor_class[0]?.value || m.armorClass || 10
          : m.armor_class || m.armorClass || 10;

        // Parse speed
        const speed =
          typeof m.speed === 'object'
            ? Object.entries(m.speed)
                .map(([key, value]) => (key === 'walk' ? value : `${key} ${value}`))
                .join(', ')
            : m.speed;

        // Parse skills and saving throws from proficiencies
        const skills: string[] = [];
        const savingThrows: string[] = [];
        if (m.proficiencies) {
          for (const prof of m.proficiencies) {
            const name = prof.proficiency?.name || '';
            const value = prof.value;
            if (name.startsWith('Saving Throw:')) {
              const ability = name.replace('Saving Throw: ', '');
              savingThrows.push(`${ability} ${value >= 0 ? '+' : ''}${value}`);
            } else if (name.startsWith('Skill:')) {
              const skill = name.replace('Skill: ', '');
              skills.push(`${skill} ${value >= 0 ? '+' : ''}${value}`);
            }
          }
        } else if (m.savingThrows) {
          savingThrows.push(...m.savingThrows);
        }
        if (m.skills && typeof m.skills[0] === 'string') {
          skills.push(...m.skills);
        }

        // Parse senses
        const senses: string[] = [];
        if (typeof m.senses === 'object' && !Array.isArray(m.senses)) {
          for (const [key, value] of Object.entries(m.senses)) {
            if (key === 'passive_perception') {
              senses.push(`passive Perception ${value}`);
            } else {
              senses.push(`${key.replace('_', ' ')} ${value}`);
            }
          }
        } else if (Array.isArray(m.senses)) {
          senses.push(...m.senses);
        }

        // Parse languages
        const languages = typeof m.languages === 'string' ? m.languages.split(', ') : m.languages || [];

        // Parse condition immunities
        const conditionImmunities = m.condition_immunities
          ? m.condition_immunities.map((c: any) => (typeof c === 'string' ? c : c.name))
          : m.conditionImmunities || [];

        // Extract and embed spell metadata (DENORMALIZATION)
        const spellsEmbedded: Array<{ id: string; name: string; level: number; school: string; range?: string }> = [];

        // Check special_abilities for spellcasting
        if (m.special_abilities) {
          for (const ability of m.special_abilities) {
            if (ability.spellcasting?.spells || ability.spells) {
              const spellList = ability.spellcasting?.spells || ability.spells;
              for (const spellGroup of spellList) {
                if (spellGroup.spells) {
                  for (const spellRef of spellGroup.spells) {
                    const spellId = extractSpellId(spellRef);
                    if (spellId) {
                      const spellInfo = spellLookup.get(spellId);
                      if (spellInfo && !spellsEmbedded.find((s) => s.id === spellInfo.id)) {
                        spellsEmbedded.push(spellInfo);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return {
          id: m.index || m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: m.name,
          size: m.size,
          type: m.type,
          alignment: m.alignment,
          armorClass: ac,
          hitPoints: m.hit_points_roll || m.hitPoints || `${m.hit_points} (${m.hit_dice})`,
          speed,
          abilityScores: {
            STR: m.strength || m.abilityScores?.STR,
            DEX: m.dexterity || m.abilityScores?.DEX,
            CON: m.constitution || m.abilityScores?.CON,
            INT: m.intelligence || m.abilityScores?.INT,
            WIS: m.wisdom || m.abilityScores?.WIS,
            CHA: m.charisma || m.abilityScores?.CHA,
          },
          ...(savingThrows.length > 0 && { savingThrows }),
          ...(skills.length > 0 && { skills }),
          ...(m.damage_vulnerabilities?.length && { damageVulnerabilities: m.damage_vulnerabilities }),
          ...(m.damage_resistances?.length && { damageResistances: m.damage_resistances }),
          ...(m.damage_immunities?.length && { damageImmunities: m.damage_immunities }),
          ...(conditionImmunities.length > 0 && { conditionImmunities }),
          senses,
          languages,
          challenge: m.challenge_rating !== undefined ? `${m.challenge_rating} (${m.xp || 0} XP)` : m.challenge,
          ...(m.special_abilities?.length && {
            specialAbilities: m.special_abilities.map((a: any) => ({
              name: a.name,
              description: a.desc || a.description,
            })),
          }),
          ...(m.specialAbilities?.length && { specialAbilities: m.specialAbilities }),
          actions: (m.actions || []).map((a: any) => ({
            name: a.name,
            description: a.desc || a.description,
          })),
          ...(m.legendary_actions?.length && {
            legendaryActions: m.legendary_actions.map((a: any) => ({
              name: a.name,
              description: a.desc || a.description,
            })),
          }),
          ...(m.legendaryActions?.length && { legendaryActions: m.legendaryActions }),
          imageUrl: null,
          // Embedded spell metadata for performance
          ...(spellsEmbedded.length > 0 && { spellsEmbedded }),
        };
      })
    );

    // Seed Magic Items
    logger.info(`\n✨ Seeding ${GAME_DATA_COLLECTIONS.MAGIC_ITEMS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.MAGIC_ITEMS,
      MAGIC_ITEMS.map((item: any) => ({
        id: item.index,
        index: item.index,
        name: item.name,
        equipmentCategory: item.equipment_category?.name || 'Other',
        rarity: item.rarity?.name || 'Common',
        description: Array.isArray(item.desc) ? item.desc.join('\n\n') : item.desc || '',
        imageUrl: null,
      }))
    );

    // Seed Features
    logger.info(`\n⚡ Seeding ${GAME_DATA_COLLECTIONS.FEATURES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.FEATURES,
      FEATURES.map((feat: any) => ({
        id: feat.index,
        index: feat.index,
        name: feat.name,
        className: feat.class?.name || 'General',
        level: feat.level || 1,
        prerequisites: feat.prerequisites || [],
        description: Array.isArray(feat.desc) ? feat.desc.join('\n\n') : feat.desc || '',
      }))
    );

    // Seed Traits
    logger.info(`\n🎭 Seeding ${GAME_DATA_COLLECTIONS.TRAITS}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.TRAITS,
      TRAITS.map((trait: any) => ({
        id: trait.index,
        index: trait.index,
        name: trait.name,
        races: (trait.races || []).map((r: any) => r.name || r),
        subraces: (trait.subraces || []).map((s: any) => s.name || s),
        description: Array.isArray(trait.desc) ? trait.desc.join('\n\n') : trait.desc || '',
        proficiencies: (trait.proficiencies || []).map((p: any) => p.name || p),
      }))
    );

    // Seed Subclasses
    logger.info(`\n🎓 Seeding ${GAME_DATA_COLLECTIONS.SUBCLASSES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.SUBCLASSES,
      SUBCLASSES.map((sub: any) => ({
        id: sub.index,
        index: sub.index,
        name: sub.name,
        className: sub.class?.name || 'Unknown',
        subclassFlavor: sub.subclass_flavor || '',
        description: Array.isArray(sub.desc) ? sub.desc.join('\n\n') : sub.desc || '',
      }))
    );

    // Seed Proficiencies
    logger.info(`\n🛡️  Seeding ${GAME_DATA_COLLECTIONS.PROFICIENCIES}...`);
    await seedCollection(
      db,
      GAME_DATA_COLLECTIONS.PROFICIENCIES,
      PROFICIENCIES.map((prof: any) => ({
        id: prof.index,
        index: prof.index,
        name: prof.name,
        type: prof.type || 'Other',
        classes: (prof.classes || []).map((c: any) => c.name || c),
        races: (prof.races || []).map((r: any) => r.name || r),
        reference: prof.reference?.name || undefined,
      }))
    );

    logger.info('\n✨ Game data seeding completed successfully!\n');
    logger.info('📊 Summary:');
    logger.info(`  - Races: ${RACES.length}`);
    logger.info(`  - Classes: ${CLASSES.length}`);
    logger.info(`  - Backgrounds: ${BACKGROUNDS.length}`);
    logger.info(`  - Abilities: ${ABILITIES.length}`);
    logger.info(`  - Alignments: ${ALIGNMENTS.length}`);
    logger.info(`  - Skills: ${SKILLS.length}`);
    logger.info(`  - Conditions: ${CONDITIONS.length}`);
    logger.info(`  - Damage Types: ${DAMAGE_TYPES.length}`);
    logger.info(`  - Languages: ${LANGUAGES.length}`);
    logger.info(`  - Magic Schools: ${MAGIC_SCHOOLS.length}`);
    logger.info(`  - Equipment Categories: ${EQUIPMENT_CATEGORIES.length}`);
    logger.info(`  - Weapon Properties: ${WEAPON_PROPERTIES.length}`);
    logger.info(`  - Equipment: ${EQUIPMENT_ITEMS.length}`);
    logger.info(`  - Monsters: ${MONSTERS.length}`);
    logger.info(`  - Magic Items: ${MAGIC_ITEMS.length}`);
    logger.info(`  - Features: ${FEATURES.length}`);
    logger.info(`  - Traits: ${TRAITS.length}`);
    logger.info(`  - Subclasses: ${SUBCLASSES.length}`);
    logger.info(`  - Proficiencies: ${PROFICIENCIES.length}`);
  } catch (error) {
    logger.error('❌ Error seeding game data:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGameData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedGameData };
