/**
 * Firebase client configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// For local development with emulators, we don't need real Firebase config
const isUsingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true' || 
                         import.meta.env.MODE === 'development';

const firebaseConfig = {
  apiKey: isUsingEmulators ? 'demo-api-key' : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isUsingEmulators ? 'demo-project.firebaseapp.com' : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: isUsingEmulators ? 'demo-project.appspot.com' : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: isUsingEmulators ? '123456789' : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: isUsingEmulators ? '1:123456789:web:abcdef' : import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('🔥 Firebase initialized:', {
  mode: import.meta.env.MODE,
  projectId: firebaseConfig.projectId,
  usingEmulators: isUsingEmulators,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (isUsingEmulators) {
  console.log('🔧 Connecting to Firebase emulators');
  
  try {
    // Check if already connected to avoid reconnection
    const authEmulatorConnected = (auth as any)._canInitEmulator;
    
    if (authEmulatorConnected === undefined || authEmulatorConnected) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    
    if (!(db as any)._settingsFrozen) {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    
    console.log('✅ Connected to emulators');
  } catch (error) {
    console.warn('⚠️ Emulator connection error (may already be connected):', error);
  }
}

