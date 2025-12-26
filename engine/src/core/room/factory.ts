import { faker } from '@faker-js/faker';
import type { Room, WorldSettings } from './types';
import { GamePhase } from './types';

export function createRoom(overrides: Partial<Room> = {}): Room {
  const id = faker.string.uuid();
  const code = faker.string.alphanumeric(6).toUpperCase();
  return {
    documentId: `room-${id}`,
    roomId: code,
    id,
    code,
    ownerId: 'user-1',
    settings: null,
    worldDescription: '',
    phase: GamePhase.SETUP,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isActive: true,
    ...overrides,
  };
}

export function createWorldSettings(overrides: Partial<WorldSettings> = {}): WorldSettings {
  return {
    worldType: faker.helpers.arrayElement(['terra', 'forest', 'desert', 'water']),
    worldSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
    theme: 'High Fantasy',
    setting: faker.lorem.sentence(),
    tone: 'Epic Adventure',
    worldBackground: faker.lorem.paragraph(),
    dmStyle: {
      verbosity: 3,
      detail: 3,
      engagement: 4,
      narrative: 4,
      specialMode: null,
      customDirectives: '',
    },
    dmSystemPrompt: 'You are an expert Dungeon Master...',
    playerCount: faker.number.int({ min: 2, max: 6 }),
    adventureLength: faker.helpers.arrayElement(['short', 'medium', 'long']),
    difficulty: faker.helpers.arrayElement(['easy', 'medium', 'challenging']),
    startingLevel: faker.number.int({ min: 1, max: 5 }),
    attributePointBudget: 27,
    language: 'en',
    ...overrides,
  };
}
