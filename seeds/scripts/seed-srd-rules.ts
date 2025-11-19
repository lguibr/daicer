#!/usr/bin/env tsx
/**
 * Seed Firestore with D&D 5e SRD Rules and Embeddings
 * Run with: yarn seed:srd or tsx seeds/scripts/seed-srd-rules.ts
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../../backend/src/utils/logger.js';
import { SRD_RULES } from '../data/srd-rules.js';

const SRD_RULES_COLLECTION = 'srd_rules';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
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
 * Generate embeddings for rule content
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small', // 1536 dimensions, cheaper than ada-002
  });

  logger.info(`Generating embeddings for ${texts.length} rules...`);
  const vectors = await embeddings.embedDocuments(texts);
  logger.info(`✓ Generated ${vectors.length} embeddings`);

  return vectors;
}

/**
 * Seed SRD rules with embeddings
 */
async function seedSRDRules(): Promise<void> {
  logger.info('🌱 Starting SRD rules seeding with embeddings...\n');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for embedding generation');
  }

  const db = initializeFirebase();

  try {
    // Generate embeddings for all rule contents
    const ruleContents = SRD_RULES.map((rule) => rule.content);
    const embeddings = await generateEmbeddings(ruleContents);

    // Prepare documents with embeddings as Firestore vectors
    const documentsWithEmbeddings = SRD_RULES.map((rule, index) => ({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      content: rule.content,
      tags: rule.tags,
      embedding: FieldValue.vector(embeddings[index]), // Use native Firestore vector
      createdAt: Date.now(),
    }));

    // Batch write to Firestore (get-or-create pattern)
    logger.info(`\n📚 Writing ${documentsWithEmbeddings.length} rules to Firestore...`);
    let batch = db.batch();
    let count = 0;
    let skipped = 0;
    let batchSize = 0;

    for (const doc of documentsWithEmbeddings) {
      const docRef = db.collection(SRD_RULES_COLLECTION).doc(doc.id);

      // Check if document already exists
      const existing = await docRef.get();
      if (existing.exists) {
        skipped++;
        continue;
      }

      batch.set(docRef, doc);
      count++;
      batchSize++;

      // Firestore batch limit is 500 operations
      if (batchSize >= 500) {
        await batch.commit();
        logger.info(`  ✓ Committed ${count} new documents`);
        batch = db.batch();
        batchSize = 0;
      }
    }

    // Commit remaining documents
    if (batchSize > 0) {
      await batch.commit();
    }

    logger.info(
      `✅ Seeded ${count} new SRD rules with embeddings${skipped > 0 ? ` (skipped ${skipped} existing)` : ''}\n`
    );
    logger.info('📊 Summary by category:');
    const categoryCounts = documentsWithEmbeddings.reduce(
      (acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(categoryCounts).forEach(([category, ruleCount]) => {
      logger.info(`  - ${category}: ${ruleCount} rules`);
    });

    logger.info('\n✨ SRD rules seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Error seeding SRD rules:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSRDRules()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedSRDRules };
