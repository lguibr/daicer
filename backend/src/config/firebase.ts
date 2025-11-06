/**
 * Firebase Admin SDK configuration
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 * Uses emulator in development, real Firebase in production
 */
export function initializeFirebase(): void {
  if (admin.apps.length > 0) {
    return; // Already initialized
  }

  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';

  if (isDevelopment) {
    // Use emulators in development/test
    console.log(`🔥 Firebase initialized in ${process.env.NODE_ENV} mode`);
    console.log(`📦 Project ID: ${projectId}`);
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`🔧 Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.log(`🔧 Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    }

    admin.initializeApp({
      projectId,
    });
  } else {
    // Production: use service account
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase credentials not configured for production');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
}

/**
 * Get Firestore instance
 * @returns Firestore database instance
 */
export function getDb() {
  return getFirestore();
}

/**
 * Get Firebase Auth instance
 * @returns Firebase Auth instance
 */
export function getFirebaseAuth() {
  return getAuth();
}

