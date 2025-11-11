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
      EQUIPMENT_CATEGORIES.map((e) => ({
        id: e.index,
        index: e.index,
        name: e.name,
        equipment: e.equipment,
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
