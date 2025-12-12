import { faker } from '@faker-js/faker';
import type { Player, Message } from './types';
import { createCharacter } from '../character/factory';

export function createPlayer(overrides: Partial<Player> = {}): Player {
  const name = faker.person.firstName();
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name,
    character: createCharacter({ name }),
    action: null,
    isReady: false,
    joinedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: faker.string.uuid(),
    sender: faker.helpers.arrayElement(['DM', faker.string.uuid()]),
    text: faker.lorem.sentence(),
    timestamp: Date.now(),
    ...overrides,
  };
}
