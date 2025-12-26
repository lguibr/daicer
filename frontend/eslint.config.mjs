import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';
import reactRefresh from 'eslint-plugin-react-refresh';

// Mimic CommonJS variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  {
    ignores: [
      'dist',
      '.eslintrc.cjs',
      'vite.config.ts',
      'tailwind.config.js',
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  js.configs.recommended,
  ...compat.extends('plugin:react-hooks/recommended', 'airbnb', 'prettier'),
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          jsx: 'never',
          mts: 'never',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            '**/*.test.tsx',
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.stories.ts',
            '**/*.stories.tsx',
            '**/test/**',
            '**/__tests__/**',
            '**/.storybook/**',
            'vite.config.ts',
          ],
        },
      ],
      'no-underscore-dangle': [
        'error',
        {
          allow: ['_canInitEmulator', '_settingsFrozen'],
        },
      ],
      'no-nested-ternary': 'off',
      'no-console': 'off', // Allow console in dev, CI will catch
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          assert: 'either',
        },
      ],
      'import/prefer-default-export': 'off',
      'import/no-named-as-default': 'off', // Allow named exports as default (e.g., cn from utils)
      'react/no-array-index-key': 'off', // Acceptable for static lists
      'jsx-a11y/click-events-have-key-events': 'off', // Many valid UI patterns
      'jsx-a11y/no-static-element-interactions': 'off', // Many valid UI patterns
      'jsx-a11y/control-has-associated-label': 'off', // Icons and implicit labels OK
      'react/button-has-type': 'error', // Enforce this
      'react/no-danger': 'warn',
      'no-plusplus': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-shadow': ['error', { ignoreOnInitialization: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'consistent-return': 'off',
      'no-restricted-globals': ['error', 'event', 'fdescribe'],
      'no-await-in-loop': 'off',
      'no-continue': 'off',
      'no-restricted-syntax': 'off',
      'no-alert': 'warn',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Overrides
  {
    files: ['**/workers/**/*.ts', '**/*.worker.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-param-reassign': 'off',
      'no-console': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'default-case': 'off',
    },
  },
  {
    files: [
      '**/*.stories.tsx',
      '**/*.stories.ts',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'no-alert': 'off',
    },
  },
  {
    files: ['**/components/ui/dice-roll-animation/**/*.ts', '**/components/ui/dice-roll-animation/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'no-case-declarations': 'off',
    },
  },
  {
    files: ['**/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/state/**/*.ts', '**/state/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-param-reassign': 'off',
      'class-methods-use-this': 'off',
    },
  },
  {
    files: ['**/providers/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/pages/Assets*.tsx'],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
  {
    files: ['**/components/ui/**/*.tsx', '**/components/ui/**/*.ts'],
    rules: {
      'react/jsx-no-useless-fragment': 'off',
      'react/jsx-no-constructed-context-values': 'off',
      '@typescript-eslint/no-shadow': 'off',
    },
  },
  {
    files: ['**/components/assets/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/components/ai/**/*.tsx'],
    rules: {
      'jsx-a11y/no-noninteractive-tabindex': 'off',
    },
  },
  {
    files: ['**/components/shared/**/*.tsx', '**/components/tactical/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/room/character-creation/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/types/shared_legacy/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'no-param-reassign': 'off',
      radix: 'off',
      'no-constant-condition': 'off',
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    files: ['**/pages/Explore.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
