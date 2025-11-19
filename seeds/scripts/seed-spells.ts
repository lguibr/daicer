/**
 * @file seeds/scripts/seed-spells.ts
 * @description Seed spells data to Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

// Initialize Firebase Admin
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔥 Using Firestore Emulator:', process.env.FIRESTORE_EMULATOR_HOST);
  initializeApp({ projectId: 'daicer-dev' });
} else {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function seedSpells() {
  console.log('📚 Seeding spells to Firestore...\n');

  // Load spells
  const spellsPath = join(__dirname, '../game-data/spells.json');
  const spells = JSON.parse(readFileSync(spellsPath, 'utf-8'));

  console.log(`Found ${spells.length} spells to seed\n`);

  const batch = db.batch();
  let count = 0;

  for (const spell of spells) {
    const docRef = db.collection('spells').doc(spell.id);
    batch.set(docRef, {
      ...spell,
      imageUrl: spell.imageUrl ?? null,
    });
    count++;

    if (count % 100 === 0) {
      console.log(`  Prepared ${count}/${spells.length} spells...`);
    }
  }

  await batch.commit();
  console.log(`\n✅ Seeded ${count} spells to Firestore`);
  console.log('📊 Collection: spells');
  console.log(`   Documents: ${count}`);

  // Create indexes summary
  console.log('\n📑 Recommended indexes:');
  console.log('  - level (single field)');
  console.log('  - school (single field)');
  console.log('  - effectShape (single field)');
  console.log('  - level + school (composite)');
  console.log('  - level + effectShape (composite)');

  process.exit(0);
}

seedSpells().catch((error) => {
  console.error('❌ Error seeding spells:', error);
  process.exit(1);
});
