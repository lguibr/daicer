export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Map seeds imports from parent directory (MUST come before the .js stripping regex)
    '^../../seeds/(.*)\.js$': '<rootDir>/../seeds/$1.ts',
    '^@daicer/shared/(.*)$': '<rootDir>/../shared/$1.ts',
    '^@daicer/shared$': '<rootDir>/../shared/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: {
          ignoreCodes: [151002],
        },
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/server.ts'],
  // Coverage thresholds (realistic targets: happy path + errors + critical edges)
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
    './src/services/': {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
    },
    './src/combat/': {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
    },
    './src/api/': {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
    },
    './src/graph/': {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },
  // Test timeout for integration tests
  testTimeout: 10000,
  // Global setup and teardown for Firebase emulators
  globalSetup: '<rootDir>/test/setup-emulators.ts',
  globalTeardown: '<rootDir>/test/teardown-emulators.ts',
  // Test match patterns
  testMatch: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
};
