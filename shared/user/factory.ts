import { faker } from '@faker-js/faker';
import type { User, Role } from './types';

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    displayName: faker.person.fullName(),
    photoURL: faker.image.avatar(),
    avatarUrl: null,
    role: faker.helpers.arrayElement(['free', 'premium', 'god']) as Role,
    language: 'en',
    createdAt: Date.now(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
