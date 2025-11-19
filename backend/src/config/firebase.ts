/**
 * Firebase Admin SDK configuration
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

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
    if (process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      const storageHost = process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST;
      console.log(`🔧 Storage Emulator: ${storageHost}`);
    }

    admin.initializeApp({
      projectId,
      storageBucket: `${projectId}.appspot.com`, // Required for Storage API
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
 * Get Firestore instance (alias for compatibility)
 * @returns Firestore database instance
 */
export { getFirestore };

/**
 * Firestore database instance (lazy)
 * Only call this after initializeFirebase() has been called
 */
// eslint-disable-next-line no-underscore-dangle
let _db: ReturnType<typeof getFirestore> | null = null;
export const db = (): ReturnType<typeof getFirestore> => {
  if (!_db) {
    _db = getFirestore();
  }
  return _db;
};

/**
 * Get Firebase Auth instance
 * @returns Firebase Auth instance
 */
export function getFirebaseAuth() {
  return getAuth();
}

/**
 * Get Firebase Storage instance
 * @returns Firebase Storage instance
 */
export function getStorageInstance() {
  return getStorage();
}

/**
 * Get Auth instance (alias for compatibility)
 * @returns Auth instance
 */
export function getAuthInstance() {
  return getAuth();
}
