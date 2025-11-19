/**
 * Test helper functions and utilities
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebase } from '@/config/firebase';
import type { Room, User, Player, Message } from '@/types';

// Ensure Firebase is initialized
initializeFirebase();

/**
 * Clear all Firestore collections
 */
export async function clearFirestore(): Promise<void> {
  const firestore = getFirestore();

  const collections = ['rooms', 'users', 'players', 'messages', 'characters', 'assets'];

  await Promise.all(
    collections.map(async (collectionName) => {
      const snapshot = await firestore.collection(collectionName).get();
      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    })
  );
}

/**
 * Create a test room
 */
export async function createTestRoom(overrides: Partial<Room> = {}): Promise<Room> {
  const firestore = getFirestore();

  const room: Room = {
    id: 'test-room-1',
    roomCode: 'TEST01',
    name: 'Test Room',
    phase: 'lobby',
    dmStyle: 'balanced',
    aiModel: 'gemini-2.0-flash-exp',
    adventureType: 'mixed',
    worldTheme: 'high-fantasy',
    playerIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };

  await firestore.collection('rooms').doc(room.id).set(room);
  return room;
}

/**
 * Create a test user in Firebase Auth and Firestore
 */
export async function createTestUser(
  uid: string,
  email: string,
  displayName?: string
): Promise<User & { uid: string }> {
  const auth = getAuth();
  const firestore = getFirestore();

  // Create user in Firebase Auth
  try {
    await auth.createUser({
      uid,
      email,
      displayName,
    });
  } catch {
    // User might already exist, that's okay
  }

  const user: User = {
    id: uid,
    email,
    displayName: displayName || email.split('@')[0],
    language: 'en',
    createdAt: new Date().toISOString(),
  };

  await firestore.collection('users').doc(user.id).set(user);
  return { ...user, uid };
}

/**
 * Create a test player
 */
export async function createTestPlayer(roomId: string, overrides: Partial<Player> = {}): Promise<Player> {
  const firestore = getFirestore();

  const player: Player = {
    id: 'test-player-1',
    roomId,
    userId: 'test-user-1',
    name: 'Test Player',
    isReady: false,
    status: 'active',
    ...overrides,
  };

  await firestore.collection('players').doc(player.id).set(player);
  return player;
}

/**
 * Create a test message
 */
export async function createTestMessage(roomId: string, overrides: Partial<Message> = {}): Promise<Message> {
  const firestore = getFirestore();

  const message: Message = {
    id: 'test-message-1',
    roomId,
    role: 'user',
    content: 'Test message',
    playerId: 'test-player-1',
    timestamp: new Date().toISOString(),
    ...overrides,
  };

  await firestore.collection('messages').doc(message.id).set(message);
  return message;
}

/**
 * Get Firebase ID token for test user
 * Returns a custom token that can be used for testing
 */
export async function getTestToken(uid: string, role: 'free' | 'premium' | 'god' = 'premium'): Promise<string> {
  const auth = getAuth();
  // Create custom token with role claim (for emulator use)
  const customToken = await auth.createCustomToken(uid, { role });

  // In emulator mode, custom tokens work directly
  // In production, you'd need to exchange this for an ID token
  return customToken;
}

/**
 * Setup test environment with user and token
 * Enhanced to work properly with Firebase Auth emulator
 */
export async function setupTestEnvironment(): Promise<{
  firestore: ReturnType<typeof getFirestore>;
  testUser: User & { uid: string };
  testToken: string;
}> {
  const firestore = getFirestore();
  const uid = `test-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const testUser = await createTestUser(uid, `test-${uid}@example.com`, 'Test User');

  // For Firebase emulator, we need to create a custom token and then "sign in" with it
  // to get an ID token. Since we're testing the backend, we'll use a simpler approach:
  // Set the emulator to accept custom tokens as ID tokens
  const testToken = await getTestToken(uid);

  return { firestore, testUser, testToken };
}

/**
 * Cleanup test user from Firebase Auth and Firestore
 */
export async function cleanupTestUser(uid: string): Promise<void> {
  const auth = getAuth();
  const firestore = getFirestore();

  try {
    // Delete from Firebase Auth
    await auth.deleteUser(uid);
  } catch {
    // User might not exist, that's okay
  }

  try {
    // Delete from Firestore
    await firestore.collection('users').doc(uid).delete();
  } catch {
    // Document might not exist, that's okay
  }
}

/**
 * Create a mock character sheet for testing
 * Uses static data for deterministic tests (no faker dependency)
 */
export function createMockCharacter(overrides: Partial<any> = {}): any {
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn'];
  const classes = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin'];
  const backgrounds = ['Soldier', 'Scholar', 'Criminal', 'Acolyte', 'Noble'];
  const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Neutral', 'Chaotic Neutral'];

  const race = overrides.race || races[0];
  const characterClass = overrides.characterClass || classes[0];
  const level = overrides.level || 1;

  return {
    // Basic info - deterministic
    name: overrides.name || 'Test Character',
    race,
    characterClass,
    background: overrides.background || backgrounds[0],
    alignment: overrides.alignment || alignments[0],
    level,
    xp: level * 300,

    // Core stats
    hp: 10 + level * 6,
    maxHp: 10 + level * 6,
    temporaryHp: 0,
    hitDice: { total: level, current: level },
    deathSaves: { successes: 0, failures: 0 },

    armorClass: 14 + 2,
    initiative: 1,
    speed: 30,
    proficiencyBonus: Math.floor((level - 1) / 4) + 2,
    inspiration: false,

    // Attributes - valid D&D scores
    attributes: {
      Strength: 14,
      Dexterity: 12,
      Constitution: 14,
      Intelligence: 10,
      Wisdom: 12,
      Charisma: 10,
    },

    savingThrows: {
      fortitude: 2,
      reflex: 1,
      will: 1,
    },

    skills: {},
    skillDetails: [],
    expertises: [],

    // Combat
    baseAttackBonus: level + 3,
    attacks: [
      {
        name: 'Longsword',
        bonus: `+${level + 3}`,
        damageType: '1d8+3 slashing',
      },
    ],
    equipment: 'Chain mail, longsword, shield',

    // Currency
    currency: {
      cp: 10,
      sp: 5,
      ep: 0,
      gp: 25,
      pp: 0,
    },

    // Character details
    proficienciesAndLanguages: 'All armor, shields, simple weapons, martial weapons, Common',
    features: 'Fighting Style, Second Wind',
    talents: [],

    // Appearance
    appearance: {
      age: '25',
      height: '5\'10"',
      weight: '180 lbs',
      eyes: 'blue',
      skin: 'Fair',
      hair: 'Brown',
      description: 'A brave adventurer',
    },

    // Personality
    personality: {
      traits: 'Brave and loyal',
      ideals: 'Honor and justice',
      bonds: 'Protects the innocent',
      flaws: 'Too trusting',
    },

    // Background
    backstory: 'A warrior seeking glory',
    backgroundDetails: {
      origin: 'Military background',
      upbringing: 'Raised in barracks',
      motivation: 'Seeking glory',
      keyEvents: ['Joined the army', 'First battle won'],
    },
    alliesAndOrganizations: 'The City Guard',
    treasure: 'Heirloom sword',
    resourcePools: [],
    advancementPoints: {
      ability: 0,
      skill: 0,
      talent: 0,
    },
    avatarAssets: null,

    // Spellcasting
    spellcasting: {
      class: '',
      ability: '',
      saveDC: 0,
      attackBonus: 0,
      cantrips: [],
      spellsKnown: [],
      slots: [],
    },

    ...overrides,
  };
}

/**
 * Create mock room (in-memory, no Firestore)
 */
export function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: `room-${Math.random().toString(36).slice(2)}`,
    roomCode: `TST${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`,
    name: 'Mock Room',
    phase: 'lobby',
    dmStyle: 'balanced',
    aiModel: 'gemini-2.0-flash-exp',
    adventureType: 'mixed',
    worldTheme: 'high-fantasy',
    playerIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock player (in-memory, no Firestore)
 */
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: `player-${Math.random().toString(36).slice(2)}`,
    roomId: 'test-room',
    userId: 'test-user',
    name: 'Mock Player',
    isReady: false,
    status: 'active',
    ...overrides,
  };
}

/**
 * Create mock combat state for tactical testing
 */
export function createMockCombatState(overrides: Partial<any> = {}): any {
  return {
    encounterId: `encounter-${Math.random().toString(36).slice(2)}`,
    round: 1,
    turn: 0,
    phase: 'in_progress',
    units: [
      {
        id: 'unit-1',
        name: 'Fighter',
        hp: 40,
        maxHp: 40,
        ac: 16,
        initiative: 15,
        position: { x: 5, y: 5 },
        allegiance: 'player',
        isActive: true,
      },
      {
        id: 'unit-2',
        name: 'Goblin',
        hp: 7,
        maxHp: 7,
        ac: 13,
        initiative: 12,
        position: { x: 10, y: 8 },
        allegiance: 'enemy',
        isActive: true,
      },
    ],
    turnOrder: ['unit-1', 'unit-2'],
    log: [],
    seed: 42,
    ...overrides,
  };
}

/**
 * Create mock LLM response (structured output)
 */
export function createMockLLMResponse(type: 'turn' | 'world' | 'character', data: any = {}): any {
  if (type === 'turn') {
    return {
      overall_summary: data.summary || 'The adventure continues...',
      player_perspectives: data.perspectives || [{ playerId: 'player-1', message: 'You see a door ahead.' }],
    };
  }

  if (type === 'world') {
    return {
      worldDescription: data.description || 'A vast fantasy realm awaits...',
      setting: data.setting || 'Medieval kingdom',
      tone: data.tone || 'Epic and heroic',
    };
  }

  if (type === 'character') {
    return {
      name: data.name || 'Character',
      opening: data.opening || 'You find yourself at the start of an adventure...',
      personalHook: data.hook || 'Something calls to you from afar.',
    };
  }

  return data;
}

/**
 * Create mock graph state
 */
export function createMockGraphState(overrides: Partial<any> = {}): any {
  return {
    roomId: 'test-room',
    phase: 'gameplay',
    players: [
      createMockPlayer({ id: 'player-1', name: 'Hero' }),
      createMockPlayer({ id: 'player-2', name: 'Warrior' }),
    ],
    messages: [
      {
        id: 'msg-1',
        role: 'dm',
        content: 'Welcome to the adventure!',
        timestamp: new Date().toISOString(),
      },
    ],
    worldDescription: 'A mystical forest surrounds you.',
    turnCount: 0,
    language: 'en',
    ...overrides,
  };
}

/**
 * Wait for a condition to be true (polling with timeout)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (!(await condition())) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Cleanup test environment
 */
export async function cleanupTestEnvironment(uid: string): Promise<void> {
  await cleanupTestUser(uid);
  await clearFirestore();
}
