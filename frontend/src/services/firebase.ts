/**
 * Firebase client configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// For local development with emulators, we don't need real Firebase config
const isUsingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true' || import.meta.env.MODE === 'development';
console.log('🔥 Firebase Emulator Mode:', isUsingEmulators, {
  VITE_USE_EMULATORS: import.meta.env.VITE_USE_EMULATORS,
  MODE: import.meta.env.MODE,
  projectId: isUsingEmulators ? 'demo-project' : import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
});

const firebaseConfig = {
  apiKey: isUsingEmulators ? 'demo-api-key' : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isUsingEmulators ? 'demo-project.firebaseapp.com' : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: isUsingEmulators ? 'demo-project' : import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
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
    // Use E2E ports if VITE_PORT is 3100, otherwise use dev ports
    const isE2E = import.meta.env.VITE_PORT === '3100';
    const authPort = isE2E ? 9100 : 9099;
    const firestorePort = isE2E ? 8081 : 8080;

    // Check if already connected to avoid reconnection
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const authEmulatorConnected = auth._canInitEmulator;

    if (authEmulatorConnected === undefined || authEmulatorConnected) {
      connectAuthEmulator(auth, `http://127.0.0.1:${authPort}`, { disableWarnings: true });
      console.log(`✅ Auth Emulator connected: http://127.0.0.1:${authPort}`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!db._settingsFrozen) {
      connectFirestoreEmulator(db, '127.0.0.1', firestorePort);
      console.log(`✅ Firestore Emulator connected: 127.0.0.1:${firestorePort}`);
    }

    // Clear any cached production tokens
    const { currentUser } = auth;
    if (currentUser) {
      currentUser
        .getIdToken(true)
        .then((token) => {
          // Decode token to check project ID
          const parts = token.split('.');
          if (parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.aud !== 'demo-project') {
              console.warn('⚠️ Detected old production token, signing out...');
              auth.signOut();
              localStorage.clear();
              sessionStorage.clear();
            }
          }
        })
        .catch(() => {
          // Token invalid, clear
          auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
        });
    }
  } catch (error) {
    console.error('❌ Emulator connection error:', error);
  }
}
