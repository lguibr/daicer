/**
 * Firebase client configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// For local development with emulators, we don't need real Firebase config
const isUsingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true' || import.meta.env.MODE === 'development';

const firebaseConfig = {
  apiKey: isUsingEmulators ? 'demo-api-key' : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isUsingEmulators ? 'demo-project.firebaseapp.com' : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: isUsingEmulators ? 'demo-project.appspot.com' : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: isUsingEmulators ? '123456789' : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: isUsingEmulators ? '1:123456789:web:abcdef' : import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (isUsingEmulators) {
  try {
    // Check if already connected to avoid reconnection
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const authEmulatorConnected = auth._canInitEmulator;

    if (authEmulatorConnected === undefined || authEmulatorConnected) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!db._settingsFrozen) {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  } catch (error) {
    // Emulator connection error (may already be connected)
  }
}
