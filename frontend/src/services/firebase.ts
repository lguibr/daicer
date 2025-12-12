// Stub replacement for Firebase SDK since we migrated to Strapi
// This file maintains the API surface for existing components until they are refactored.

export interface StubUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdToken: () => Promise<string>;
}

export const auth = {
  currentUser: {
    uid: 'stub-user-id',
    email: 'stub@example.com',
    displayName: 'Stub User',
    getIdToken: async () => 'stub-token',
  } as StubUser | null,
  onAuthStateChanged: (cb: (user: StubUser | null) => void) => {
    cb({
      uid: 'stub-user-id',
      email: 'stub@example.com',
      displayName: 'Stub User',
      getIdToken: async () => 'stub-token',
    });
    return () => {};
  },
  signInAnonymously: async () => ({
    user: { uid: 'stub-anon', getIdToken: async () => 'stub-token' },
  }),
};

export const db = {};
export const storage = {};
export const functions = {};
export const analytics = {};

// Emulators
export function connectAuthEmulator() {}
export function connectFirestoreEmulator() {}
export function connectFunctionsEmulator() {}
export function connectStorageEmulator() {}

export const isUsingEmulators = false;
